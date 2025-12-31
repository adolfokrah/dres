import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  seller: string | { id: string }
  productTitle: string
  variation?: { images?: { image?: { url?: string } }[] } | string
}

/**
 * Notify sellers when an order is placed
 * Creates a notification for each unique seller in the order
 */
export const notifySellersOnOrderPlaced: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  const payload = req.payload

  // Only trigger when status changes TO 'placed'
  const previousStatus = previousDoc?.status
  const newStatus = doc.status

  // Check if this is a new 'placed' order or status changed to 'placed'
  const isNewPlacedOrder = operation === 'create' && newStatus === 'placed'
  const statusChangedToPlaced = operation === 'update' && newStatus === 'placed' && previousStatus !== 'placed'

  if (!isNewPlacedOrder && !statusChangedToPlaced) {
    return doc
  }

  payload.logger.info(`📦 Order ${doc.orderId} placed - notifying sellers`)

  try {
    const items = (doc.items || []) as OrderItem[]

    // Group items by seller
    const sellerItems = new Map<string, { productTitles: string[]; image?: string }>()

    for (const item of items) {
      const sellerId = typeof item.seller === 'object' ? item.seller.id : item.seller
      if (!sellerId) continue

      if (!sellerItems.has(sellerId)) {
        sellerItems.set(sellerId, { productTitles: [], image: undefined })
      }

      const sellerData = sellerItems.get(sellerId)!
      sellerData.productTitles.push(item.productTitle)

      // Get first product image if available
      if (!sellerData.image && item.variation && typeof item.variation === 'object') {
        const firstImage = item.variation.images?.[0]?.image
        if (firstImage && typeof firstImage === 'object' && firstImage.url) {
          sellerData.image = firstImage.url
        }
      }
    }

    // Create notification for each seller
    for (const [sellerId, data] of sellerItems) {
      const itemCount = data.productTitles.length
      const itemsText = itemCount === 1 
        ? data.productTitles[0] 
        : `${itemCount} items`

      await payload.create({
        collection: 'notifications',
        data: {
          user: sellerId,
          message: `New order received! ${itemsText} waiting to be shipped.`,
          path: `/sold/${doc.id}`,
          image: data.image || undefined,
          read: false,
        },
      })

      payload.logger.info(`📬 Notification sent to seller ${sellerId} for order ${doc.orderId}`)
    }

    payload.logger.info(`📦 Seller notifications complete for order ${doc.orderId}`)
  } catch (error) {
    payload.logger.error(`📦 Error notifying sellers for order ${doc.orderId}: ${error}`)
  }

  return doc
}
