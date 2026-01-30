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

    // Get customer info and withdrawal account (only once, outside the loop)
    const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer

    // Fetch customer to get their withdrawal account for refund
    const customer = await payload.findByID({
      collection: 'users',
      id: customerId,
      depth: 0,
    })

    const withdrawalAccount = (customer?.withdrawalAccount || {}) as {
      bankCode?: string
      bankName?: string
      accountNumber?: string
      accountName?: string
    }

    // Check if customer has a valid withdrawal account
    if (!withdrawalAccount.accountNumber || !withdrawalAccount.bankCode) {
      payload.logger.warn(`[Refund] Customer ${customerId} has no withdrawal account set up - skipping refund creation`)
      return doc
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
      const transferFee = 1 // Paystack transfer fee is 1 cedi flat
      const isNotAvailable = item.shippingStatus === 'not_available'

      // Get seller ID for this item
      const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller

      // Check if ALL items from this seller have the same refund status
      // Shipping fee is included when:
      // 1. BP + ALL items returned
      // 2. BP + ALL items not_available
      // 3. ALL items not_available (regardless of BP - seller's fault)
      const sellerItems = currentItems.filter(i => {
        const sellerId = typeof i.seller === 'object' ? i.seller?.id : i.seller
        return sellerId === itemSellerId
      })
      const allSellerItemsReturned = sellerItems.every(i => i.shippingStatus === 'returned')
      const allSellerItemsNotAvailable = sellerItems.every(i => i.shippingStatus === 'not_available')

      // Include shipping if:
      // - All items not_available (seller's fault, regardless of BP)
      // - OR BP enabled and all items returned
      const includeShipping = allSellerItemsNotAvailable || (hasBuyerProtection && allSellerItemsReturned)
      const shippingFee = includeShipping ? (item.shippingFee || 0) : 0

      let refundAmount: number
      let refundNotes: string

      if (hasBuyerProtection) {
        // WITH BUYER PROTECTION: Full item price + shipping (only if eligible)
        refundAmount = itemTotal + shippingFee
        if (includeShipping && shippingFee > 0) {
          refundNotes = `Refund for "${item.variationTitle}" (Qty: ${item.quantity}). Full refund (BP): Item ${itemTotal} + Shipping ${shippingFee} = ${refundAmount}`
        } else {
          refundNotes = `Refund for "${item.variationTitle}" (Qty: ${item.quantity}). Full refund (BP): Item ${itemTotal} = ${refundAmount}`
        }
      } else if (isNotAvailable) {
        // NOT AVAILABLE (seller never shipped, no BP): Item + shipping (if all not_available) - transaction fee
        const feePercent = refundTransactionFeeRate * 100
        const baseAmount = itemTotal + shippingFee
        const transactionFee = (baseAmount * refundTransactionFeeRate) + transferFee
        refundAmount = Math.round((baseAmount - transactionFee) * 100) / 100
        if (shippingFee > 0) {
          refundNotes = `Refund for "${item.variationTitle}" (Qty: ${item.quantity}). Not available: (Item ${itemTotal} + Shipping ${shippingFee}) - Fee (${feePercent}% + 1): ${transactionFee.toFixed(2)} = ${refundAmount}`
        } else {
          refundNotes = `Refund for "${item.variationTitle}" (Qty: ${item.quantity}). Not available: Item ${itemTotal} - Fee (${feePercent}% + 1): ${transactionFee.toFixed(2)} = ${refundAmount}`
        }
      } else {
        // NO BUYER PROTECTION (actual return): Item price - transaction fee % - transfer fee (no shipping refund)
        const feePercent = refundTransactionFeeRate * 100
        const transactionFee = (itemTotal * refundTransactionFeeRate) + transferFee
        refundAmount = Math.round((itemTotal - transactionFee) * 100) / 100
        refundNotes = `Refund for "${item.variationTitle}" (Qty: ${item.quantity}). Return: Item ${itemTotal} - Fee (${feePercent}% + 1): ${transactionFee.toFixed(2)} = ${refundAmount}`
      }

      // Create refund transaction for customer
      // Calculate fees based on refund type
      let fees = 0
      if (!hasBuyerProtection) {
        if (isNotAvailable) {
          // Not available without BP: fee on (item + shipping)
          fees = ((itemTotal + shippingFee) * refundTransactionFeeRate) + transferFee
        } else {
          // Regular return without BP: fee on item only
          fees = (itemTotal * refundTransactionFeeRate) + transferFee
        }
      }

      await payload.create({
        collection: 'transactions',
        data: {
          transactionId: generateTransactionId(),
          type: 'refund',
          status: 'completed', // Immediately available in user's balance for manual withdrawal
          user: customerId,
          order: doc.id,
          itemId: itemId,
          amount: refundAmount,
          fees,
          paystackFees: transferFee,
          billingDetails: {
            accountName: withdrawalAccount.accountName || '',
            accountNumber: withdrawalAccount.accountNumber || '',
            bank: withdrawalAccount.bankCode || '',
          },
          notes: refundNotes,
        },
      })

      // Create sanction for returned items (penalty for seller - they receive nothing)
      const sellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller

      if (sellerId && item.shippingStatus === 'returned') {
        await payload.create({
          collection: 'seller-sanctions',
          data: {
            seller: sellerId,
            reason: 'item_returned',
            notes: `Order ${doc.orderId}: "${item.variationTitle}" was returned.`,
          },
        })

        payload.logger.info(`[Refund] Created sanction for seller ${sellerId} - item returned`)

        // Notify the seller
        await payload.create({
          collection: 'notifications',
          data: {
            user: sellerId,
            type: 'system',
            message: `A buyer returned an item from order ${doc.orderId}.`,
            path: `/sell/orders`,
            metadata: {
              orderId: doc.id,
              orderNumber: doc.orderId,
            },
          },
        })
      }

      // Check if all seller items are now refundable and update existing refund to add shipping
      // This handles the case where items are refunded one at a time
      if (hasBuyerProtection && includeShipping) {
        // Find existing refunds for this seller's items that don't have shipping yet
        const sellerItemIds = sellerItems.map((si, idx) => si.id || `${doc.id}-${idx}`)
        const itemWithShipping = sellerItems.find(si => (si.shippingFee || 0) > 0)

        if (itemWithShipping && itemWithShipping.id !== item.id) {
          const itemWithShippingId = itemWithShipping.id || `${doc.id}-${currentItems.indexOf(itemWithShipping)}`

          // Find the existing refund for the item with shipping
          const existingShippingRefund = await payload.find({
            collection: 'transactions',
            where: {
              and: [
                { order: { equals: doc.id } },
                { type: { equals: 'refund' } },
                { itemId: { equals: itemWithShippingId } },
              ],
            },
            limit: 1,
          })

          if (existingShippingRefund.docs.length > 0) {
            const refundDoc = existingShippingRefund.docs[0]
            const existingAmount = refundDoc.amount as number
            const shippingToAdd = itemWithShipping.shippingFee || 0
            const expectedAmountWithShipping = (itemWithShipping.price * (itemWithShipping.quantity || 1)) + shippingToAdd

            // Only update if shipping hasn't been added yet
            if (existingAmount < expectedAmountWithShipping) {
              await payload.update({
                collection: 'transactions',
                id: refundDoc.id,
                data: {
                  amount: expectedAmountWithShipping,
                  notes: `Refund for "${itemWithShipping.variationTitle}" (Qty: ${itemWithShipping.quantity}). Full refund (BP): Item ${itemWithShipping.price * (itemWithShipping.quantity || 1)} + Shipping ${shippingToAdd} = ${expectedAmountWithShipping}`,
                },
              })
              payload.logger.info(`[Refund] Updated existing refund to include shipping: ${shippingToAdd}`)
            }
          }
        }
      }
    }

  } catch (error) {
    payload.logger.error(`Error creating refund transaction: ${error}`)
  }

  return doc
}
