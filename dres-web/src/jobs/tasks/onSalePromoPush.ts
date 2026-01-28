import type { TaskConfig } from 'payload'
import { sendBulkPushNotification } from '../../utilities/sendPushNotification'

/**
 * Task: On Sale Promotion Push Notification
 *
 * Sends a promotional push notification to all users about on-sale items.
 * Scheduled to run every 4 days at 10 AM UTC.
 */
export const onSalePromoPushTask: TaskConfig = {
  slug: 'onSalePromoPush' as any,
  retries: 2,
  outputSchema: [
    {
      name: 'successCount',
      type: 'number',
    },
    {
      name: 'failureCount',
      type: 'number',
    },
  ],
  // Schedule: every 4 days at 10 AM UTC
  schedule: [
    {
      cron: '0 10 */4 * *',
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req

    payload.logger.info('📱 Starting On Sale promo push notification task')

    try {
      // Fetch all active tokens
      const tokens: string[] = []
      let page = 1
      const batchSize = 500

      while (true) {
        const result = await payload.find({
          collection: 'fcm-tokens',
          where: {
            isActive: { equals: true },
          },
          limit: batchSize,
          page,
        })

        tokens.push(...result.docs.map((doc) => doc.token))

        if (!result.hasNextPage) break
        page++
      }

      if (tokens.length === 0) {
        payload.logger.info('No active tokens found')
        return { output: { successCount: 0, failureCount: 0 } }
      }

      payload.logger.info(`Found ${tokens.length} active tokens`)

      // Send push notification
      const result = await sendBulkPushNotification({
        tokens,
        title: 'Sale Alert!',
        body: "Don't miss out on amazing deals! Shop our latest markdowns now.",
        data: {
          path: '/discover/categories/products?filterType=on-sale&title=On%20Sale',
        },
        payload,
      })

      payload.logger.info(
        `✅ On Sale promo push complete: ${result.successCount} sent, ${result.failureCount} failed`,
      )

      return {
        output: {
          successCount: result.successCount,
          failureCount: result.failureCount,
        },
      }
    } catch (error) {
      payload.logger.error(`Error in On Sale promo push task: ${error}`)
      throw error
    }
  },
}
