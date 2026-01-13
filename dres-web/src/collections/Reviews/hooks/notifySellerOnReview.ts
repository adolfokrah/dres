import type { CollectionAfterChangeHook } from 'payload'
import type { Review } from '../../../payload-types'

/**
 * When a review status changes to 'active', notify the seller
 * that they received a new review.
 */
export const notifySellerOnReview: CollectionAfterChangeHook<Review> = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only process updates where status changed to 'active'
  if (operation !== 'update') return doc
  if (doc.status !== 'active') return doc
  if (previousDoc?.status === 'active') return doc // Already active, no change

  const { payload } = req

  try {
    // Get the style to find the seller
    const styleId = typeof doc.style === 'string' ? doc.style : doc.style?.id
    if (!styleId) {
      payload.logger.warn(`Review ${doc.id} has no style ID`)
      return doc
    }

    const style = await payload.findByID({
      collection: 'styles',
      id: styleId,
      depth: 1,
    })

    const sellerId = typeof style.seller === 'string' 
      ? style.seller 
      : (style.seller as any)?.id

    if (!sellerId) {
      payload.logger.warn(`Style ${styleId} has no seller`)
      return doc
    }

    // Get reviewer info
    const reviewer = typeof doc.user === 'object' ? doc.user : null
    const reviewerName = (reviewer as any)?.firstName || 'A customer'

    // Get variation for image
    const variation = typeof doc.variation === 'object' ? doc.variation : null
    const variationImages = (variation as any)?.images || []
    const firstImage = variationImages[0]
    const imageId = typeof firstImage === 'string' ? firstImage : firstImage?.id

    // Build notification message
    const rating = doc.rating || 0
    const stars = '⭐'.repeat(rating)
    const message = `${reviewerName} left a ${rating}-star review ${stars}`

    // Create notification for seller
    await payload.create({
      collection: 'notifications',
      data: {
        user: sellerId,
        type: 'system',
        message,
        image: imageId || undefined,
        path: `/users/${sellerId}/details?tab=reviews`,
        metadata: {
          type: 'new_review',
          reviewId: doc.id,
          styleId,
          rating: doc.rating,
          reviewerId: typeof doc.user === 'string' ? doc.user : (doc.user as any)?.id,
        },
        read: false,
      },
    })

    payload.logger.info(
      `Notified seller ${sellerId} about new review ${doc.id}`
    )

  } catch (error) {
    payload.logger.error(
      `Error notifying seller about review ${doc.id}: ${error}`
    )
  }

  return doc
}
