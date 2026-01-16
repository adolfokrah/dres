import type { TaskConfig } from 'payload'

/**
 * Task: Review Notifications
 * 
 * Sends review request notifications to buyers with draft reviews.
 * Scheduled to run daily at 10 AM UTC.
 */
export const reviewNotificationsTask: TaskConfig = {
  slug: 'reviewNotifications' as any,
  retries: 2,
  outputSchema: [
    {
      name: 'processedCount',
      type: 'number',
    },
    {
      name: 'notificationsSent',
      type: 'number',
    },
    {
      name: 'errors',
      type: 'number',
    },
  ],
  // Schedule: daily at 10 AM UTC
  schedule: [
    {
      cron: '0 10 * * *', // 10 AM UTC
      queue: 'default',
    },
  ],
  handler: async ({  req }) => {
    const { payload } = req
    const daysAfterDelivery = 1
    const batchSize =  100

    payload.logger.info(`📝 Starting review notifications task (daysAfterDelivery: ${daysAfterDelivery})`)

    try {
      // Calculate the date threshold (drafts created X days ago)
      const createdThreshold = new Date()
      createdThreshold.setDate(createdThreshold.getDate() - daysAfterDelivery)

      // Find draft reviews that are old enough to notify
      const draftReviews = await payload.find({
        collection: 'reviews',
        where: {
          status: { equals: 'draft' },
          createdAt: { greater_than : createdThreshold.toISOString() },
        },
        limit: batchSize,
        depth: 2,
      })

      payload.logger.info(`Found ${draftReviews.docs.length} draft reviews to process`)

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

          // Update review status to pending
          await payload.update({
            collection: 'reviews',
            id: review.id,
            data: {
              status: 'pending',
              notificationSentAt: new Date().toISOString(),
            },
          })

          notificationsSent++

        } catch (itemError) {
          errors++
          payload.logger.error(`Error processing review ${review.id}: ${itemError}`)
        }
      }

      payload.logger.info(
        `✅ Review notifications complete: ${processedCount} processed, ${notificationsSent} sent, ${errors} errors`
      )

      return { output: { processedCount, notificationsSent, errors } }

    } catch (error) {
      payload.logger.error(`Error in review notifications task: ${error}`)
      throw error
    }
  },
}
