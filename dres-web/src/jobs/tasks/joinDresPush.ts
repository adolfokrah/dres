import type { TaskConfig } from 'payload'
import { sendBulkPushNotification } from '../../utilities/sendPushNotification'

/**
 * Task: Join DRES Push Notification
 *
 * Sends a push notification to anonymous users encouraging them to sign up.
 * Scheduled to run every 2 days at 10 AM UTC.
 */
export const joinDresPushTask: TaskConfig = {
  slug: 'joinDresPush' as any,
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
  // Schedule: every 2 days at 10 AM UTC
  schedule: [
    {
      cron: '0 10 */2 * *',
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req

    payload.logger.info('📱 Starting Join DRES push notification task')

    try {
      // Fetch all anonymous tokens (tokens without a user)
      const tokens: string[] = []
      let page = 1
      const batchSize = 500

      while (true) {
        const result = await payload.find({
          collection: 'fcm-tokens',
          where: {
            and: [{ isActive: { equals: true } }, { user: { exists: false } }],
          },
          limit: batchSize,
          page,
        })

        tokens.push(...result.docs.map((doc) => doc.token))

        if (!result.hasNextPage) break
        page++
      }

      if (tokens.length === 0) {
        payload.logger.info('No anonymous tokens found')
        return { output: { successCount: 0, failureCount: 0 } }
      }

      payload.logger.info(`Found ${tokens.length} anonymous tokens`)

      // Send push notification
      const result = await sendBulkPushNotification({
        tokens,
        title: 'Join DRES Today!',
        body: 'Sign up now to save your favorites, track orders, and get exclusive deals!',
        data: {
          path: '/auth/signup',
        },
        payload,
      })

      payload.logger.info(
        `✅ Join DRES push complete: ${result.successCount} sent, ${result.failureCount} failed`,
      )

      return {
        output: {
          successCount: result.successCount,
          failureCount: result.failureCount,
        },
      }
    } catch (error) {
      payload.logger.error(`Error in Join DRES push task: ${error}`)
      throw error
    }
  },
}
