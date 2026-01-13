import type { PayloadHandler } from 'payload'

/**
 * POST /api/notifications/send-review-requests
 * 
 * Sends review request notifications to buyers with draft reviews.
 * 
 * Query params:
 * - daysAfterDelivery: number (default: 3) - Days to wait after delivery before sending
 * - batchSize: number (default: 100) - Max reviews to process per run
 * 
 * This endpoint is protected and should be called by:
 * - Cron job (with CRON_SECRET)
 * - Admin users
 */
export const sendReviewRequestsHandler: PayloadHandler = async (req) => {
  const { payload, user } = req

  // Check authorization
  const authHeader = req.headers.get('authorization')
  const isAuthorizedByCron = authHeader === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin = user?.role === 'admin'

  if (!isAuthorizedByCron && !isAdmin) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  try {
    const url = new URL(req.url || '', 'http://localhost')
    const daysAfterDelivery = parseInt(url.searchParams.get('daysAfterDelivery') || '3', 10)
    const batchSize = parseInt(url.searchParams.get('batchSize') || '100', 10)

    // Calculate the date threshold (drafts created X days ago)
    const createdThreshold = new Date()
    createdThreshold.setDate(createdThreshold.getDate() - daysAfterDelivery)

    // Find draft reviews that are old enough to notify
    const draftReviews = await payload.find({
      collection: 'reviews',
      where: {
        status: { equals: 'draft' },
        createdAt: { less_than: createdThreshold.toISOString() },
      },
      limit: batchSize,
      depth: 2, // Get variation and style data
    })

    payload.logger.info(
      `Found ${draftReviews.docs.length} draft reviews to process`
    )

    let processedCount = 0
    let notificationsSent = 0
    let errors = 0

    for (const review of draftReviews.docs) {
      processedCount++

      try {
        const userId = typeof review.user === 'string'
          ? review.user
          : review.user?.id

        if (!userId) {
          payload.logger.warn(`Review ${review.id} has no user`)
          continue
        }

        // Get style and variation info for the notification
        const style = typeof review.style === 'object' ? review.style : null
        const variation = typeof review.variation === 'object' ? review.variation : null
        
        const styleId = typeof review.style === 'string'
          ? review.style
          : style?.id
        
        const styleTitle = style?.title || 'your purchase'
        const variationTitle = (variation as any)?.title || styleTitle
        
        // Get brand name
        const brand = typeof style?.brand === 'object' ? style?.brand : null
        const brandName = brand?.name || null
        
        // Get variation image for the notification
        const variationImages = (variation as any)?.images || []
        const firstImage = variationImages[0]
        const imageId = typeof firstImage === 'string' ? firstImage : firstImage?.id

        // Build the notification message
        const productName = brandName
          ? `${brandName} - ${variationTitle}`
          : variationTitle

        const message = `How was "${productName}"? Share your experience and help other shoppers! ⭐`

        // Create the notification
        await payload.create({
          collection: 'notifications',
          data: {
            user: userId,
            type: 'review_request',
            message,
            image: imageId || undefined,
            path: `/products/${styleId}/review`,
            metadata: {
              type: 'review_request',
              reviewId: review.id,
              styleId,
              variationId: typeof review.variation === 'string' 
                ? review.variation 
                : (review.variation as any)?.id,
            },
            read: false,
          },
        })

        // Update review status to pending and record notification time
        await payload.update({
          collection: 'reviews',
          id: review.id,
          data: {
            status: 'pending',
            notificationSentAt: new Date().toISOString(),
          },
        })

        notificationsSent++
        payload.logger.info(
          `Sent review notification for review ${review.id} to user ${userId}`
        )

      } catch (itemError) {
        errors++
        payload.logger.error(
          `Error processing review ${review.id}: ${itemError}`
        )
      }
    }

    payload.logger.info(
      `Review notifications complete: ${processedCount} processed, ${notificationsSent} sent, ${errors} errors`
    )

    return Response.json({
      success: true,
      message: 'Review notifications processed',
      stats: {
        processedCount,
        notificationsSent,
        errors,
      },
      params: {
        daysAfterDelivery,
        batchSize,
      },
    })

  } catch (error) {
    payload.logger.error(`Error processing review notifications: ${error}`)
    return Response.json(
      { 
        error: 'Failed to process review notifications',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
