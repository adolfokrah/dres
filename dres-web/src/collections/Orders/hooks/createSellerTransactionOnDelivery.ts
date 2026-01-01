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

// Final statuses - no more changes expected
const FINAL_STATUSES = ['delivered', 'returned', 'not_available']
// Pending statuses - still waiting for resolution
const PENDING_STATUSES = ['placed', 'out_for_delivery', 'return_in_progress']

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

    // FIRST: Check if any item changed to 'return_in_progress' - cancel seller's order_payment transaction
    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i]
      const previousItem = previousItems[i]

      // Check if this item just changed to 'return_in_progress'
      if (
        currentItem.shippingStatus === 'return_in_progress' &&
        previousItem?.shippingStatus !== 'return_in_progress'
      ) {
        const sellerId = typeof currentItem.seller === 'object' 
          ? currentItem.seller.id 
          : currentItem.seller

        if (sellerId) {
          // Find the seller's order_payment transaction for this order
          const existingTransaction = await payload.find({
            collection: 'transactions',
            where: {
              and: [
                { order: { equals: doc.id } },
                { type: { equals: 'order_payment' } },
                { user: { equals: sellerId } },
                { status: { not_equals: 'cancelled' } },
              ],
            },
            limit: 1,
          })

          // Cancel transaction if found (will be recreated when all items reach final status)
          if (existingTransaction.docs.length > 0) {
            const tx = existingTransaction.docs[0]
            await payload.update({
              collection: 'transactions',
              id: tx.id,
              data: {
                status: 'cancelled',
              },
            })

            payload.logger.info(
              `Order payment transaction ${tx.id} cancelled - item "${currentItem.productTitle}" return in progress. Will be recreated when all items reach final status.`,
            )
          }
        }
      }
    }

    // Group items by seller
    const itemsBySeller = new Map<string, OrderItem[]>()
    for (const item of currentItems) {
      const sellerId = typeof item.seller === 'object' ? item.seller.id : item.seller
      if (!sellerId) continue
      
      if (!itemsBySeller.has(sellerId)) {
        itemsBySeller.set(sellerId, [])
      }
      itemsBySeller.get(sellerId)!.push(item)
    }

    // Process each seller
    for (const [sellerId, sellerItems] of itemsBySeller) {
      // Check if ALL items for this seller have a FINAL status (delivered or returned)
      const allFinal = sellerItems.every((item) => FINAL_STATUSES.includes(item.shippingStatus))
      const anyPending = sellerItems.some((item) => PENDING_STATUSES.includes(item.shippingStatus))

      // Skip if any items are still pending
      if (!allFinal || anyPending) {
        continue
      }

      // Get delivered items only (for payout calculation)
      const deliveredItems = sellerItems.filter((item) => item.shippingStatus === 'delivered')

      // Skip if no delivered items (all returned)
      if (deliveredItems.length === 0) {
        continue
      }

      // Check if we already have a status change to final for this seller
      // by comparing with previous state
      const previousSellerItems = previousItems.filter((item) => {
        const prevSellerId = typeof item.seller === 'object' ? item.seller.id : item.seller
        return prevSellerId === sellerId
      })
      
      const previouslyAllFinal = previousSellerItems.length > 0 && 
        previousSellerItems.every((item) => FINAL_STATUSES.includes(item.shippingStatus))

      // Skip if seller items were already all final before this update
      if (previouslyAllFinal) {
        continue
      }

      // Check if a bulk transaction already exists for this seller on this order
      const existingTransactions = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { order: { equals: doc.id } },
            { type: { equals: 'transfer' } },
            { user: { equals: sellerId } },
          ],
        },
        limit: 1,
      })

      // Skip if transaction already exists
      if (existingTransactions.docs.length > 0) {
        payload.logger.info(
          `Bulk transaction already exists for seller ${sellerId} on order ${doc.id} - skipping`,
        )
        continue
      }

      // Fetch seller details for payment info
      const seller = await payload.findByID({
        collection: 'users',
        id: sellerId,
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

      // Calculate totals for delivered items
      // Products: sum of (originalPrice × quantity) for all delivered items
      // Shipping: ONE shipping fee (from first item)
      let totalOriginalPrice = 0
      let totalSellingPrice = 0
      const itemIds: string[] = []
      const productTitles: string[] = []

      for (let i = 0; i < deliveredItems.length; i++) {
        const item = deliveredItems[i]
        const originalPrice = item.originalPrice ?? item.price
        totalOriginalPrice += originalPrice * item.quantity
        totalSellingPrice += item.price * item.quantity
        itemIds.push(item.id || `${doc.id}-${currentItems.indexOf(item)}`)
        productTitles.push(`${item.productTitle} (Qty: ${item.quantity})`)
      }

      // Only ONE shipping fee per seller (from first delivered item)
      const shippingFee = deliveredItems[0]?.shippingFee || 0

      // Seller payout = total original prices + ONE shipping fee
      const sellerPayout = totalOriginalPrice + shippingFee

      // Platform fees = selling price - original price (the markup)
      const platformFees = totalSellingPrice - totalOriginalPrice

      // Paystack transfer fee = 1 cedi flat fee per transfer
      const paystackFeesAmount = 1

      // Commission = platform fees - paystack fees
      const commissionFees = platformFees - paystackFeesAmount

      // Create ONE bulk transaction for this seller (order_payment type)
      await payload.create({
        collection: 'transactions',
        data: {
          transactionId: generateTransactionId(),
          type: 'order_payment',
          status: 'completed',
          user: sellerId,
          order: doc.id,
          itemId: itemIds.join(','), // Store all item IDs
          amount: Math.round(sellerPayout * 100) / 100,
          fees: platformFees > 0 ? Math.round(platformFees * 100) / 100 : 0,
          paystackFees: Math.round(paystackFeesAmount * 100) / 100,
          commissionFees: commissionFees > 0 ? Math.round(commissionFees * 100) / 100 : 0,
          billingDetails: {
            accountName:
              withdrawalAccount?.accountName ||
              seller?.shopName ||
              `${seller?.firstName || ''} ${seller?.lastName || ''}`.trim() ||
              '',
            accountNumber: withdrawalAccount?.accountNumber || '',
            bank: withdrawalAccount?.bank || '',
          },
          notes: `Bulk seller payout for ${deliveredItems.length} item(s): ${productTitles.join(', ')}. Products: ${totalOriginalPrice}, Shipping: ${shippingFee}, Total: ${sellerPayout}`,
        },
      })

      payload.logger.info(
        `Created BULK order_payment transaction for ${deliveredItems.length} delivered items. Seller: ${seller?.shopName || sellerId}, Payout: ${sellerPayout} (Products: ${totalOriginalPrice}, Shipping: ${shippingFee}), Fees: ${platformFees}, Commission: ${commissionFees}`,
      )
    }
  } catch (error) {
    payload.logger.error(`Error creating seller transaction: ${error}`)
  }

  return doc
}
