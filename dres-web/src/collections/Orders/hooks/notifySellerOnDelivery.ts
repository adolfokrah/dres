import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  variationTitle?: string
  variation?: string | { id: string }
  variationOptions?: Record<string, string> | null
  shippingStatus: string
  seller?: string | { id: string }
  totalPrice?: number
}

/**
 * Send notifications to sellers when their order items are delivered
 * - delivered: "Your item {variationTitle} has been delivered to the customer"
 */
export const notifySellerOnDelivery: CollectionAfterChangeHook = async ({
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

  try {
    const currentItems = (doc.items || []) as OrderItem[]
    const previousItems = (previousDoc?.items || []) as OrderItem[]

    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i]
      const previousItem = previousItems[i]

      // Check if status changed to 'delivered'
      if (
        previousItem &&
        currentItem.shippingStatus === 'delivered' &&
        previousItem.shippingStatus !== 'delivered'
      ) {
        const sellerId = typeof currentItem.seller === 'object'
          ? currentItem.seller.id
          : currentItem.seller

        if (!sellerId) continue

        // Build variation string from options
        const variationStr = currentItem.variationOptions
          ? Object.values(currentItem.variationOptions).join(' / ')
          : ''

        // Use variationTitle as the item name
        const itemTitle = currentItem.variationTitle || 'item'
        const itemDescription = variationStr ? `${itemTitle} (${variationStr})` : itemTitle

        // Get image ID from variation
        let imageId: string | undefined
        const variationId =
          typeof currentItem.variation === 'object'
            ? currentItem.variation.id
            : currentItem.variation

        if (variationId) {
          try {
            const variation = await payload.findByID({
              collection: 'variations',
              id: variationId,
              depth: 0,
            })
            if (variation?.images && Array.isArray(variation.images) && variation.images.length > 0) {
              imageId =
                typeof variation.images[0] === 'object' ? variation.images[0].id : variation.images[0]
            }
          } catch (e) {
            // Ignore - image is optional
          }
        }

        const message = `Your item ${itemDescription} has been delivered to the customer ✅`

        // Create notification for seller
        await payload.create({
          collection: 'notifications',
          data: {
            user: sellerId,
            image: imageId || undefined,
            message,
            path: `/sell/orders/${doc.id}`,
            read: false,
          },
        })

        payload.logger.info(
          `Delivery notification sent to seller ${sellerId} for ${currentItem.variationTitle || 'item'}`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error sending seller delivery notification: ${error}`)
  }

  return doc
}
