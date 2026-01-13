import type { CollectionAfterChangeHook } from 'payload'

/**
 * Hook that notifies all followers when a seller publishes a new style.
 * 
 * Triggers when:
 * - A style status changes to 'published'
 * - On create with status 'published'
 * 
 * Creates a notification for each follower with a link to the seller's profile.
 */
export const notifyFollowersOnPublish: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const { payload } = req

  // Check if this is a publish action
  const isNewPublish = operation === 'create' && doc.status === 'published'
  const isStatusChangeToPublished = 
    operation === 'update' && 
    doc.status === 'published' && 
    previousDoc?.status !== 'published'

  if (!isNewPublish && !isStatusChangeToPublished) {
    return doc
  }

  const sellerId = typeof doc.seller === 'string' ? doc.seller : doc.seller?.id

  if (!sellerId) {
    payload.logger.warn('Cannot notify followers: No seller ID found on style')
    return doc
  }

  try {
    // Get seller info for the notification message
    const seller = await payload.findByID({
      collection: 'users',
      id: sellerId,
      depth: 0,
    })

    if (!seller) {
      payload.logger.warn(`Cannot notify followers: Seller ${sellerId} not found`)
      return doc
    }

    const sellerName = seller.shopName || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'A seller you follow'

    // Get all followers of this seller
    const followsResult = await payload.find({
      collection: 'follows',
      where: {
        following: { equals: sellerId },
      },
      limit: 1000, // Batch limit
      depth: 0,
    })

    if (followsResult.docs.length === 0) {
      payload.logger.info(`No followers to notify for seller ${sellerId}`)
      return doc
    }

    payload.logger.info(`Notifying ${followsResult.docs.length} followers about new listing from ${sellerName}`)

    // Get the first variation image for the notification (if available)
    let notificationImage: string | null = null
    const variationsResult = await payload.find({
      collection: 'variations',
      where: {
        style: { equals: doc.id },
      },
      limit: 1,
      depth: 1,
    })

    if (variationsResult.docs.length > 0) {
      const variation = variationsResult.docs[0]
      // Get the first image from the variation
      if (variation.images && Array.isArray(variation.images) && variation.images.length > 0) {
        const firstImage = variation.images[0] as any
        if (typeof firstImage === 'string') {
          notificationImage = firstImage
        } else if (firstImage?.image) {
          notificationImage = typeof firstImage.image === 'string' 
            ? firstImage.image 
            : firstImage.image?.id || null
        }
      }
    }

    // Create notifications for each follower
    const notificationPromises = followsResult.docs.map(async (follow) => {
      const followerId = typeof follow.follower === 'string' ? follow.follower : follow.follower?.id

      if (!followerId) return null

      try {
        return await payload.create({
          collection: 'notifications',
          data: {
            user: followerId,
            type: 'system',
            message: `${sellerName} just added a new listing: ${doc.title}`,
            path: `/sellers/${sellerId}`,
            image: notificationImage,
            metadata: {
              styleId: doc.id,
              sellerId: sellerId,
              styleTitle: doc.title,
            },
            read: false,
          },
        })
      } catch (error) {
        payload.logger.error(`Failed to create notification for follower ${followerId}: ${error}`)
        return null
      }
    })

    const results = await Promise.allSettled(notificationPromises)
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value !== null).length

    payload.logger.info(`Created ${successCount}/${followsResult.docs.length} notifications for new listing`)

  } catch (error) {
    // Don't fail the publish if notifications fail
    payload.logger.error(`Error notifying followers: ${error}`)
  }

  return doc
}
