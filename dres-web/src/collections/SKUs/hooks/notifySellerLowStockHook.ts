import type { CollectionAfterChangeHook } from 'payload'
import type { Skus, Variation, Style, User } from '../../../payload-types'

const LOW_STOCK_THRESHOLD = 20

/**
 * Hook to notify sellers when SKU stock is low or out of stock
 * - Stock < 20: Low stock warning
 * - Stock = 0: Out of stock alert
 */
export const notifySellerLowStockHook: CollectionAfterChangeHook<Skus> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  // Only check on update operations
  if (operation !== 'update') {
    return doc
  }

  const previousStock = previousDoc?.stock ?? 0
  const newStock = doc.stock ?? 0

  // Determine notification type
  const wasAboveThreshold = previousStock >= LOW_STOCK_THRESHOLD
  const isNowBelowThreshold = newStock < LOW_STOCK_THRESHOLD && newStock > 0
  const wasInStock = previousStock > 0
  const isNowOutOfStock = newStock <= 0

  const shouldNotifyLowStock = wasAboveThreshold && isNowBelowThreshold
  const shouldNotifyOutOfStock = wasInStock && isNowOutOfStock

  if (!shouldNotifyLowStock && !shouldNotifyOutOfStock) {
    return doc
  }

  try {
    // Get variation details
    const variationId = typeof doc.variation === 'string' ? doc.variation : doc.variation?.id

    if (!variationId) {
      req.payload.logger.warn(`Cannot notify seller: no variation ID for SKU ${doc.id}`)
      return doc
    }

    const variation = await req.payload.findByID({
      collection: 'variations',
      id: variationId,
      depth: 2,
    }) as Variation & { style?: Style }

    if (!variation) {
      req.payload.logger.warn(`Cannot notify seller: variation ${variationId} not found`)
      return doc
    }

    const style = variation.style as Style | undefined
    const styleId = typeof variation.style === 'string' ? variation.style : style?.id

    if (!styleId) {
      req.payload.logger.warn(`Cannot notify seller: no style ID for variation ${variationId}`)
      return doc
    }

    // Get seller ID from style
    const sellerId = typeof style?.seller === 'string' ? style.seller : (style?.seller as User)?.id

    if (!sellerId) {
      req.payload.logger.warn(`Cannot notify seller: no seller found for style ${styleId}`)
      return doc
    }

    // Get variation title and SKU info for the message
    const variationTitle = variation.title || 'Item'
    const skuCode = doc.sku || doc.id

    // Build the path for seller app
    // Route: /sell/style/:styleId/variation/:variationId/sku/:skuId
    const path = `/sell/style/${styleId}/variation/${variationId}/sku/${doc.id}`

    // Get image ID for notification
    let imageId: string | undefined
    if (variation.images && variation.images.length > 0) {
      const firstImage = variation.images[0]
      if (typeof firstImage === 'object' && 'id' in firstImage) {
        imageId = firstImage.id
      } else if (typeof firstImage === 'string') {
        imageId = firstImage
      }
    }

    let notificationMessage: string
    let notificationType: 'system' = 'system' // Using system type for seller notifications

    if (shouldNotifyOutOfStock) {
      notificationMessage = `⚠️ Out of Stock! "${variationTitle}" (SKU: ${skuCode}) is now out of stock. Restock soon to avoid missing sales.`
      req.payload.logger.info(`🔔 SKU ${doc.id} is OUT OF STOCK - notifying seller ${sellerId}`)
    } else {
      notificationMessage = `📦 Low Stock Alert! "${variationTitle}" (SKU: ${skuCode}) has only ${newStock} items left. Consider restocking soon.`
      req.payload.logger.info(`🔔 SKU ${doc.id} is LOW STOCK (${newStock}) - notifying seller ${sellerId}`)
    }

    // Create notification for seller
    await req.payload.create({
      collection: 'notifications',
      data: {
        user: sellerId,
        type: notificationType,
        message: notificationMessage,
        path,
        image: imageId,
        metadata: {
          skuId: doc.id,
          variationId,
          styleId,
          stock: newStock,
          alertType: shouldNotifyOutOfStock ? 'out_of_stock' : 'low_stock',
        },
      },
    })

    req.payload.logger.info(`   ✅ Created ${shouldNotifyOutOfStock ? 'out of stock' : 'low stock'} notification for seller ${sellerId}`)
  } catch (error) {
    req.payload.logger.error(`Error in notifySellerLowStockHook: ${error}`)
  }

  return doc
}
