import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  productTitle: string
  productImage?: string | { id: string }
  variationOptions?: Record<string, string> | null
  shippingStatus: string
}

/**
 * Send notifications to customer when order item status changes
 * - out_for_delivery: "Your item {productTitle} ({variation}) is out for delivery"
 * - delivered: "Your item {productTitle} ({variation}) has been delivered"
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
        
        const itemDescription = variationStr 
          ? `${currentItem.productTitle} (${variationStr})`
          : currentItem.productTitle

        // Get image ID (first image from variation/product)
        const imageId = typeof currentItem.productImage === 'object' 
          ? currentItem.productImage.id 
          : currentItem.productImage

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
          `Notification sent to customer for ${currentItem.productTitle}: ${newStatus}`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error sending status change notification: ${error}`)
  }

  return doc
}
