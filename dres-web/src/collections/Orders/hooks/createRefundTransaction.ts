import type { CollectionAfterChangeHook } from 'payload'
import { generateTransactionId } from '@/utilities/generateTransactionId'

interface OrderItem {
  id?: string
  variation?: string | { id: string } | null
  seller?: string | { id: string } | null
  variationTitle: string
  variationImage?: string | null
  sku?: string | { id: string } | null
  skuTitle?: string | null
  price: number
  originalPrice?: number | null
  quantity: number
  shippingFee?: number | null
  buyerProtection?: boolean | null
  buyerProtectionFee?: number | null
  shippingStatus?: string | null
  returnReason?: string | null
  returnImage?: string | { id: string } | null
}

       

export const createRefundTransaction: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Skip if context indicates we should skip hooks
  if (req.context?.skipHooks) return doc
  
  // Only process on update
  if (operation !== 'update') return doc

  const payload = req.payload

  payload.logger.info(`[Refund] Processing order ${doc.id} - checking for refundable items`)

  try {
    const currentItems = (doc.items || []) as OrderItem[]
    const previousItems = (previousDoc?.items || []) as OrderItem[]

    // Find items that just changed to refundable status and calculate their totals
    const itemsToRefund = currentItems.reduce<Array<{
      item: OrderItem
      itemId: string
      itemTotal: number
    }>>((acc, currentItem, i) => {
      const previousItem = previousItems.find(p => p.id === currentItem.id) || previousItems[i]
      const currentStatus = currentItem.shippingStatus
      const previousStatus = previousItem?.shippingStatus
      
      const isNowRefundable = currentStatus === 'returned' || currentStatus === 'not_available'
      const wasRefundable = previousStatus === 'returned' || previousStatus === 'not_available'
      
      if (isNowRefundable && !wasRefundable) {
        acc.push({
          item: currentItem,
          itemId: currentItem.id || `${doc.id}-${i}`,
          itemTotal: currentItem.price * currentItem.quantity,
        })
      }
      return acc
    }, [])

    // Exit early if no items to refund
    if (itemsToRefund.length === 0) {
      payload.logger.info(`[Refund] No items to refund for order ${doc.id}`)
      return doc
    }

    payload.logger.info(`[Refund] Found ${itemsToRefund.length} items to refund`)

    // Get site settings for refund transaction fee rate
    let refundTransactionFeeRate = 0.05 // Default 5%
    try {
      const siteSettings = await payload.findGlobal({ slug: 'site-settings' })
      if (siteSettings?.refundTransactionFeeRate) {
        refundTransactionFeeRate = (siteSettings.refundTransactionFeeRate as number) / 100
      }
    } catch {
      payload.logger.warn('[Refund] Could not fetch site settings, using default 3% fee')
    }

    // Get customer and deposit info (only once, outside the loop)
    const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
    
    const depositTransaction = await payload.find({
      collection: 'transactions',
      where: {
        and: [
          { order: { equals: doc.id } },
          { type: { equals: 'deposit' } },
          { user: { equals: customerId } },
        ],
      },
      limit: 1,
    })
    const deposit = depositTransaction.docs[0]
    
    const billingDetails = (deposit?.billingDetails || {}) as {
      accountName?: string
      accountNumber?: string
      bank?: string
    }

    // Create refund for each item
    for (const { item, itemId, itemTotal } of itemsToRefund) {
      // Check if refund already exists
      const existingRefund = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { order: { equals: doc.id } },
            { type: { equals: 'refund' } },
            { itemId: { equals: itemId } },
          ],
        },
        limit: 1,
      })

      if (existingRefund.docs.length > 0) {
        payload.logger.info(`[Refund] Already exists for ${item.variationTitle} - skipping`)
        continue
      }

      const hasBuyerProtection = item.buyerProtection === true
      const shippingFee = item.shippingFee || 0
      const transferFee = 1 // Paystack transfer fee is 1 cedi flat

      let refundAmount: number
      let refundNotes: string

      if (hasBuyerProtection) {
        // WITH BUYER PROTECTION: Full item price + shipping
        refundAmount = itemTotal + shippingFee
        refundNotes = `Refund for "${item.variationTitle}" (Qty: ${item.quantity}). Full refund (BP): Item ${itemTotal} + Shipping ${shippingFee} = ${refundAmount}`
      } else {
        // NO BUYER PROTECTION: Item price - transaction fee % - transfer fee
        const feePercent = refundTransactionFeeRate * 100
        const transactionFee = (itemTotal * refundTransactionFeeRate) + transferFee
        refundAmount = Math.round((itemTotal - transactionFee) * 100) / 100
        refundNotes = `Refund for "${item.variationTitle}" (Qty: ${item.quantity}). Item: ${itemTotal} - Fee (${feePercent}% + 1): ${transactionFee.toFixed(2)} = ${refundAmount}`
      }

      payload.logger.info(`[Refund] ${item.variationTitle}: ${hasBuyerProtection ? 'BP' : 'No BP'} - Refund: ${refundAmount}`)

      // Create refund transaction for customer
      await payload.create({
        collection: 'transactions',
        data: {
          transactionId: generateTransactionId(),
          type: 'refund',
          status: 'pending',
          user: customerId,
          order: doc.id,
          itemId: itemId,
          amount: refundAmount,
          fees: hasBuyerProtection ? 0 : (itemTotal * refundTransactionFeeRate) + transferFee,
          paystackFees: transferFee,
          billingDetails: {
            accountName: billingDetails.accountName || '',
            accountNumber: billingDetails.accountNumber || '',
            bank: billingDetails.bank || '',
          },
          notes: refundNotes,
        },
      })

      // Check if ALL items from this seller are now returned/not_available
      // Only create separate shipping_payment if ALL seller items are returned
      // Otherwise, shipping will be included in order_payment when other items are delivered
      const sellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
      
      if (sellerId) {
        // Get all items from this seller in the order
        const sellerItems = currentItems.filter(i => {
          const itemSellerId = typeof i.seller === 'object' ? i.seller?.id : i.seller
          return itemSellerId === sellerId
        })
        
        // Check if ALL seller items are returned or not_available
        const allSellerItemsReturned = sellerItems.every(i => 
          i.shippingStatus === 'returned' || i.shippingStatus === 'not_available'
        )
        
        // Get shipping fee from any seller item (first item with shipping fee)
        const sellerShippingFee = sellerItems.find(i => i.shippingFee && i.shippingFee > 0)?.shippingFee || 0
        
        if (allSellerItemsReturned && sellerShippingFee > 0) {
          // All items from seller are returned - create separate shipping payment
          // Check if shipping payment already exists for this seller
          const existingShippingPayment = await payload.find({
            collection: 'transactions',
            where: {
              and: [
                { order: { equals: doc.id } },
                { type: { equals: 'shipping_payment' } },
                { user: { equals: sellerId } },
              ],
            },
            limit: 1,
          })

          if (existingShippingPayment.docs.length === 0) {
            await payload.create({
              collection: 'transactions',
              data: {
                transactionId: generateTransactionId(),
                type: 'shipping_payment',
                status: 'pending',
                user: sellerId,
                order: doc.id,
                amount: sellerShippingFee,
                fees: transferFee,
                paystackFees: transferFee,
                notes: `Shipping fee for returned items from seller (all items returned)`,
              },
            })
            payload.logger.info(`[Refund] All seller items returned - created shipping payment: ${sellerShippingFee}`)
          }
        } else if (!allSellerItemsReturned) {
          payload.logger.info(`[Refund] Seller has other items not returned - shipping will be included in order_payment on delivery`)
        }
      }
    }

  } catch (error) {
    payload.logger.error(`Error creating refund transaction: ${error}`)
  }

  return doc
}
