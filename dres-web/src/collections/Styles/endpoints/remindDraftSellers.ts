import type { PayloadHandler } from 'payload'

/**
 * Endpoint to remind sellers about their draft styles
 * 
 * Called by cron job (e.g., daily/weekly)
 * 
 * POST /api/styles/remind-drafts
 * 
 * Optional query params:
 * - minDays: Minimum days since draft was created (default: 3)
 * - reminderCooldown: Hours since last reminder to avoid spam (default: 48)
 */
export const remindDraftSellers: PayloadHandler = async (req) => {
  const { payload } = req

  // Verify cron secret for security
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Allow if user is logged in OR has valid cron secret
  if (!req.user && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Parse options from request body
  const body = req.json ? await req.json() : {}
  const minDays = parseInt(body.minDays || '3', 10)
  const reminderCooldownHours = parseInt(body.reminderCooldown || '48', 10)

  payload.logger.info(`📧 Starting draft reminder job (minDays: ${minDays}, cooldown: ${reminderCooldownHours}h)`)

  try {
    // Calculate cutoff date - only remind about drafts older than minDays
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - minDays)

    // Fetch all draft styles older than minDays
    const draftsResult = await payload.find({
      collection: 'styles',
      where: {
        status: { equals: 'draft' },
        createdAt: { less_than: cutoffDate.toISOString() },
      },
      limit: 1000,
      depth: 0,
    })

    if (draftsResult.docs.length === 0) {
      payload.logger.info('No draft styles found to remind about')
      return Response.json({
        success: true,
        message: 'No draft styles found',
        stats: { sellersNotified: 0, totalDrafts: 0 },
      })
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
        payload.logger.info(`Skipping seller ${sellerId} - reminder sent within ${reminderCooldownHours}h`)
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
            path: '/sell', // Navigate to sell tab where they can see drafts
            metadata: {
              type: 'draft_reminder',
              draftCount: count,
              titles,
            },
            read: false,
          },
        })

        sellersNotified++
        payload.logger.info(`Sent draft reminder to seller ${sellerId} (${count} drafts)`)
      } catch (error) {
        payload.logger.error(`Failed to create notification for seller ${sellerId}: ${error}`)
      }
    }

    payload.logger.info(`✅ Draft reminder job complete: ${sellersNotified} notified, ${sellersSkipped} skipped`)

    return Response.json({
      success: true,
      message: `Sent ${sellersNotified} reminders`,
      stats: {
        totalDrafts: draftsResult.docs.length,
        sellersWithDrafts: draftsBySeller.size,
        sellersNotified,
        sellersSkipped,
      },
    })

  } catch (error) {
    payload.logger.error(`❌ Draft reminder job failed: ${error}`)
    return Response.json(
      {
        success: false,
        error: 'Failed to process draft reminders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
