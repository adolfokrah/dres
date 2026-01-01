import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  variationTitle?: string
  variation?: string | { id: string }
  variationOptions?: Record<string, string> | null
  shippingStatus: string
}

/**
 * Send notifications to customer when order item status changes
 * - out_for_delivery: "Your item {variationTitle} ({variation}) is out for delivery"
 * - delivered: "Your item {variationTitle} ({variation}) has been delivered"
 */
export const notifyCustomerOnStatusChange: CollectionAfterChangeHook = async ({
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
    const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer

    if (!customerId) return doc

    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i]
      const previousItem = previousItems[i]

      // Check if status changed
      if (previousItem && currentItem.shippingStatus !== previousItem.shippingStatus) {
        const newStatus = currentItem.shippingStatus

        // Build variation string from options
        const variationStr = currentItem.variationOptions
          ? Object.values(currentItem.variationOptions).join(' / ')
          : ''
        
        // Use variationTitle as the item name
        const itemTitle = currentItem.variationTitle || 'item'
        const itemDescription = variationStr 
          ? `${itemTitle} (${variationStr})`
          : itemTitle

        // Get image ID from variation
        let imageId: string | undefined
        const variationId = typeof currentItem.variation === 'object' 
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
              imageId = typeof variation.images[0] === 'object' ? variation.images[0].id : variation.images[0]
            }
          } catch (e) {
            // Ignore - image is optional
          }
        }

        let message = ''
        
        switch (newStatus) {
          case 'out_for_delivery':
            message = `Your item ${itemDescription} is out for delivery 🚚`
            break
          case 'delivered':
            message = `Your item ${itemDescription} has been delivered ✅`
            break
          case 'return_in_progress':
            message = `Return request for ${itemDescription} is being processed 📦`
            break
          case 'returned':
            message = `${itemDescription} has been returned successfully ✅`
            break
          case 'not_available':
            message = `Sorry, ${itemDescription} is no longer available. A refund will be processed.`
            break
          default:
            continue // Skip unknown statuses
        }

        // Create notification
        await payload.create({
          collection: 'notifications',
          data: {
            user: customerId,
            image: imageId || undefined,
            message,
            path: `orders/${doc.id}`,
            read: false,
          },
        })

        payload.logger.info(
          `Notification sent to customer for ${currentItem.variationTitle || 'item'}: ${newStatus}`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error sending status change notification: ${error}`)
  }

  return doc
}
