import type { TaskConfig } from 'payload'

/**
 * Task: Draft Reminder
 * 
 * Reminds sellers about their draft products older than 3 days.
 * Scheduled to run twice daily at 6 AM and 6 PM UTC.
 */
export const draftReminderTask: TaskConfig = {
  slug: 'draftReminder' as any,
  retries: 2,
  outputSchema: [
    {
      name: 'sellersNotified',
      type: 'number',
    },
    {
      name: 'sellersSkipped',
      type: 'number',
    },
  ],
  // Schedule: twice daily at 6 AM and 6 PM UTC
  schedule: [
    {
      cron: '0 6 * * *', // 6 AM UTC
      queue: 'default',
    },
    {
      cron: '0 18 * * *', // 6 PM UTC
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req
    const minDays = 1
    const reminderCooldownHours = 12

    payload.logger.info(`📧 Starting draft reminder task (minDays: ${minDays}, cooldown: ${reminderCooldownHours}h)`)

    try {
      // Calculate cutoff date - only remind about drafts older than minDays
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - minDays)

      // Fetch all draft styles older than minDays
      const draftsResult = await payload.find({
        collection: 'styles',
        where: {
          status: { equals: 'draft' },
          createdAt: { greater_than: cutoffDate.toISOString() },
        },
        pagination: false,
        depth: 0,
      })

      if (draftsResult.docs.length === 0) {
        payload.logger.info('No draft styles found to remind about')
        return { output: { sellersNotified: 0, sellersSkipped: 0 } }
      }

      // Group drafts by seller
      const draftsBySeller = new Map<string, { count: number; titles: string[] }>()
      
      for (const draft of draftsResult.docs) {
        const sellerId = typeof draft.seller === 'string' ? draft.seller : draft.seller?.id
        if (!sellerId) continue

        const existing = draftsBySeller.get(sellerId) || { count: 0, titles: [] }
        existing.count++
        if (existing.titles.length < 3) {
          existing.titles.push(draft.title || 'Untitled')
        }
        draftsBySeller.set(sellerId, existing)
      }

      payload.logger.info(`Found ${draftsResult.docs.length} drafts from ${draftsBySeller.size} sellers`)

      // Calculate cooldown cutoff
      const cooldownCutoff = new Date()
      cooldownCutoff.setHours(cooldownCutoff.getHours() - reminderCooldownHours)

      let sellersNotified = 0
      let sellersSkipped = 0

      // Process each seller
      for (const [sellerId, { count, titles }] of draftsBySeller) {
        // Check if we already sent a reminder recently
        const recentReminder = await payload.find({
          collection: 'notifications',
          where: {
            and: [
              { user: { equals: sellerId } },
              { 'metadata.type': { equals: 'draft_reminder' } },
              { createdAt: { greater_than: cooldownCutoff.toISOString() } },
            ],
          },
          limit: 1,
          depth: 0,
        })

        if (recentReminder.docs.length > 0) {
          sellersSkipped++
          continue
        }

        // Create notification
        const titlePreview = titles.join(', ') + (count > 3 ? '...' : '')
        const message = count === 1
          ? `You have a draft product waiting to be published: "${titles[0]}"`
          : `You have ${count} draft products waiting to be published: ${titlePreview}`

        try {
          await payload.create({
            collection: 'notifications',
            data: {
              user: sellerId,
              type: 'system',
              message,
              path: '/sell',
              metadata: {
                type: 'draft_reminder',
                draftCount: count,
                titles,
              },
              read: false,
            },
          })

          sellersNotified++
        } catch (error) {
          payload.logger.error(`Failed to create notification for seller ${sellerId}: ${error}`)
        }
      }

      payload.logger.info(`✅ Draft reminder complete: ${sellersNotified} notified, ${sellersSkipped} skipped`)

      return { output: { sellersNotified, sellersSkipped } }

    } catch (error) {
      payload.logger.error(`Error in draft reminder task: ${error}`)
      throw error
    }
  },
}
