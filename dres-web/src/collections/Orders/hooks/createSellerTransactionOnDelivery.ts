import type { CollectionAfterChangeHook } from 'payload'
import { generateTransactionId } from '@/utilities/generateTransactionId'

interface OrderItem {
  id: string
  productId: string
  productTitle: string
  productImage: string
  variationOptions: Record<string, string> | null
  sellerId: string
  sellerName: string
  departmentId: string
  collectionId: string
  categoryId: string
  brandId: string
  price: number
  originalPrice: number
  quantity: number
  shippingFee: number
  buyerProtection: boolean
  buyerProtectionFee: number
  shippingStatus: string
}

export const createSellerTransactionOnDelivery: CollectionAfterChangeHook = async ({
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

    // Find items that changed to 'delivered'
    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i]
      const previousItem = previousItems[i]

      // Check if this item just changed to 'delivered'
      if (
        currentItem.shippingStatus === 'delivered' &&
        previousItem?.shippingStatus !== 'delivered' &&
        currentItem.sellerId
      ) {
        // Check if a transaction already exists for this order item
        const existingTransaction = await payload.find({
          collection: 'transactions',
          where: {
            and: [
              { order: { equals: doc.id } },
              { type: { equals: 'transfer' } },
              { itemId: { equals: currentItem.id } },
            ],
          },
          limit: 1,
        })

        // Skip if transaction already exists
        if (existingTransaction.docs.length > 0) {
          payload.logger.info(
            `Transaction already exists for ${currentItem.productTitle} - skipping`,
          )
          continue
        }

        // Fetch seller details for payment info
        const seller = await payload.findByID({
          collection: 'users',
          id: currentItem.sellerId,
          depth: 0,
        })

        // Get seller's withdrawal account details
        const withdrawalAccount = seller?.withdrawalAccount as
          | {
              accountName?: string
              accountNumber?: string
              bank?: string
            }
          | undefined

        // Calculate seller payout and platform fees
        // originalPrice is the seller's base price, price is what customer paid (with platform markup)
        const originalPrice = currentItem.originalPrice ?? currentItem.price
        const sellingPrice = currentItem.price * currentItem.quantity
        const sellerPayout = originalPrice * currentItem.quantity
        const fees = (currentItem.price - originalPrice) * currentItem.quantity

        // Calculate paystack fees (1.95% of selling price) + 1 cedi transfer fee
        const paystackFeesAmount = (1.95 / 100) * sellingPrice + 1
        // Commission fees = platform fees - paystack fees
        const commissionFees = fees - paystackFeesAmount

        // Create transaction for this seller's delivered item
        // Amount is what the seller receives (original price), fees is the platform cut
        await payload.create({
          collection: 'transactions',
          data: {
            transactionId: generateTransactionId(),
            type: 'transfer',
            status: 'pending',
            user: currentItem.sellerId,
            order: doc.id,
            itemId: currentItem.id,
            amount: sellerPayout,
            fees: fees > 0 ? fees : 0,
            paystackFees: Math.round(paystackFeesAmount * 100) / 100,
            commissionFees:
              Math.round(commissionFees * 100) / 100 > 0
                ? Math.round(commissionFees * 100) / 100
                : 0,
            billingDetails: {
              accountName:
                withdrawalAccount?.accountName ||
                seller?.shopName ||
                `${seller?.firstName || ''} ${seller?.lastName || ''}`.trim() ||
                '',
              accountNumber: withdrawalAccount?.accountNumber || '',
              bank: withdrawalAccount?.bank || '',
            },
            notes: `Seller payout for "${currentItem.productTitle}" (Qty: ${currentItem.quantity}). Original price: ${originalPrice}, Selling price: ${currentItem.price}, Total payout: ${sellerPayout}`,
          },
        })

        payload.logger.info(
          `Created seller transaction for delivered item: ${currentItem.productTitle} - Seller: ${currentItem.sellerName}, Payout: ${sellerPayout}, Fees: ${fees}, Commission: ${commissionFees}`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error creating seller transaction: ${error}`)
  }

  return doc
}
