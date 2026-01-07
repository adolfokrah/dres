import type { CollectionAfterChangeHook } from 'payload'
import type { Skus, Variation, Style, Media } from '../../../payload-types'

/**
 * Hook to notify users when a SKU is back in stock
 * Finds users who subscribed to stock notifications for this SKU and creates a notification
 * After notifying, deletes the subscription
 */
export const notifyBackInStockHook: CollectionAfterChangeHook<Skus> = async ({
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

  // Check if stock went from 0 (or less) to positive
  const wasOutOfStock = previousStock <= 0
  const isNowInStock = newStock > 0
  const backInStock = wasOutOfStock && isNowInStock

  if (!backInStock) {
    return doc
  }

  req.payload.logger.info(`🔔 SKU ${doc.id} is back in stock! (${previousStock} -> ${newStock})`)

  try {
    // Find all users subscribed to this SKU
    const subscriptions = await req.payload.find({
      collection: 'stock-notifications',
      where: {
        sku: { equals: doc.id },
      },
      limit: 1000, // Get all subscriptions
    })

    if (subscriptions.docs.length === 0) {
      req.payload.logger.info(`   No subscriptions found for SKU ${doc.id}`)
      return doc
    }

    req.payload.logger.info(`   Found ${subscriptions.docs.length} subscriptions to notify`)

    // Get variation details for the notification
    const variationId = typeof doc.variation === 'string' ? doc.variation : doc.variation?.id
    
    let variationTitle = 'Item'
    let productImageId: string | undefined
    let variationIdForUrl = variationId

    if (variationId) {
      const variation = await req.payload.findByID({
        collection: 'variations',
        id: variationId,
        depth: 2,
      }) as Variation & { style?: Style }

      if (variation) {
        variationTitle = variation.title || 'Item'
        variationIdForUrl = variation.id

        // Get product image ID
        if (variation.images && variation.images.length > 0) {
          const firstImage = variation.images[0] as Media
          if (typeof firstImage === 'object' && firstImage.id) {
            productImageId = firstImage.id
          } else if (typeof firstImage === 'string') {
            productImageId = firstImage
          }
        }
      }
    }

    // Create notifications for all subscribed users
    const notificationPromises = subscriptions.docs.map(async (subscription) => {
      const userId = typeof subscription.user === 'string' 
        ? subscription.user 
        : subscription.user?.id

      if (!userId) return null

      try {
        // Create notification in the notifications collection
        await req.payload.create({
          collection: 'notifications',
          data: {
            user: userId,
            type: 'back_in_stock',
            message: `🎉 "${variationTitle}" is back in stock! Get it before it's gone.`,
            path: `/products/${variationIdForUrl}?skuId=${doc.id}`,
            image: productImageId,
            metadata: {
              skuId: doc.id,
              variationId: variationIdForUrl,
            },
          },
        })

        // Delete the subscription after creating notification
        await req.payload.delete({
          collection: 'stock-notifications',
          id: subscription.id,
        })

        req.payload.logger.info(`   ✅ Created notification for user ${userId} and deleted subscription ${subscription.id}`)
        return { success: true, userId }
      } catch (error) {
        req.payload.logger.error(`   ❌ Failed to create notification for user ${userId}: ${error}`)
        return { success: false, userId, error }
      }
    })

    await Promise.all(notificationPromises)

    req.payload.logger.info(`   ✅ Finished processing back-in-stock notifications for SKU ${doc.id}`)
  } catch (error) {
    req.payload.logger.error(`Error in notifyBackInStockHook: ${error}`)
  }

  return doc
}
