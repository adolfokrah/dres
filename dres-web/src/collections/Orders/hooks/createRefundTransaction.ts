import type { CollectionAfterChangeHook } from 'payload'
import { generateTransactionId } from '@/utilities/generateTransactionId'

interface OrderItem {
  id?: string
  product: string | { id: string }
  seller: string | { id: string }
  productTitle: string
  productImage: string
  variationOptions: Record<string, string> | null
  sellerName: string
  price: number
  originalPrice: number
  quantity: number
  shippingFee: number
  buyerProtection: boolean
  buyerProtectionFee: number
  shippingStatus: string
}

export const createRefundTransaction: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only process on update
  if (operation !== 'update') return doc

  const payload = req.payload

  try {
    const currentItems = (doc.items || []) as OrderItem[]
    const previousItems = (previousDoc?.items || []) as OrderItem[]

    // Find items that changed to 'returned' or 'not_available'
    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i]
      const previousItem = previousItems[i]

      // Get item ID for tracking
      const itemId = currentItem.id || `${doc.id}-${i}`

      const isNowRefundable =
        currentItem.shippingStatus === 'returned' || currentItem.shippingStatus === 'not_available'
      const wasRefundable =
        previousItem?.shippingStatus === 'returned' || previousItem?.shippingStatus === 'not_available'

      // Check if this item just changed to 'returned' or 'not_available' - create refund transaction for customer
      if (isNowRefundable && !wasRefundable) {
        // Refund total = selling price (price × qty)
        // If buyer protection is enabled, also refund shipping fee + buyer protection fee
        const sellingPriceTotal = currentItem.price * currentItem.quantity
        const hasBuyerProtection = currentItem.buyerProtection === true
        const shippingFee = hasBuyerProtection ? (currentItem.shippingFee || 0) : 0
        const buyerProtectionFee = hasBuyerProtection ? (currentItem.buyerProtectionFee || 0) : 0
        const refundTotal = sellingPriceTotal + shippingFee 

        // Check if a refund transaction already exists for this order item
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

        // Skip if refund already exists
        if (existingRefund.docs.length > 0) {
          payload.logger.info(
            `Refund transaction already exists for ${currentItem.productTitle} - skipping`,
          )
          continue
        }

        // Get the customer ID from the order
        const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer

        // Find the customer's deposit transaction to get billing details
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

        // Get billing details from the deposit transaction
        const depositBillingDetails = depositTransaction.docs[0]?.billingDetails as
          | {
              accountName?: string
              accountNumber?: string
              bank?: string
            }
          | undefined

        // Build refund notes
        const refundNotes = hasBuyerProtection
          ? `Refund for returned item "${currentItem.productTitle}" (Qty: ${currentItem.quantity}). Product: ${sellingPriceTotal}, Shipping: ${shippingFee}. Total refund: ${refundTotal}`
          : `Refund for returned item "${currentItem.productTitle}" (Qty: ${currentItem.quantity}). Product only: ${sellingPriceTotal} (No buyer protection - shipping not refunded)`

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
            amount: refundTotal,
            billingDetails: {
              accountName: depositBillingDetails?.accountName || '',
              accountNumber: depositBillingDetails?.accountNumber || '',
              bank: depositBillingDetails?.bank || '',
            },
            notes: refundNotes,
          },
        })

        payload.logger.info(
          `Created refund transaction for returned item: ${currentItem.productTitle} - Amount: ${refundTotal} (Product: ${sellingPriceTotal}${hasBuyerProtection ? `, Shipping: ${shippingFee}, Protection: ${buyerProtectionFee}` : ' - No buyer protection'})`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error creating refund transaction: ${error}`)
  }

  return doc
}
