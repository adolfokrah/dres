import type { PayloadHandler } from 'payload'

/**
 * POST /api/saved-searches/queue-notification-checks
 * Called by cron service to queue notification checks for all active saved searches
 */
export const queueNotificationChecks: PayloadHandler = async (req) => {
  const { payload } = req

  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Fetch all active saved searches that haven't been checked in the last 6 hours
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

    const savedSearches = await payload.find({
      collection: 'saved-searches',
      where: {
        isActive: { equals: true },
        or: [
          { lastChecked: { exists: false } },
          { lastChecked: { less_than: sixHoursAgo } },
        ],
      },
      limit: 100, // Process in batches
    })

    if (savedSearches.docs.length === 0) {
      return Response.json({
        success: true,
        message: 'No saved searches to check',
        jobsQueued: 0,
      })
    }

    // Queue a job for each saved search
    let jobsQueued = 0
    for (const search of savedSearches.docs) {
      await payload.jobs.queue({
        task: 'checkSavedSearchAndNotify',
        input: {
          savedSearchId: search.id,
        },
      })
      jobsQueued++
    }

    // Run the queued jobs
    await payload.jobs.run()

    return Response.json({
      success: true,
      message: `Queued and processed ${jobsQueued} saved search checks`,
      jobsQueued,
    })

  } catch (error: any) {
    payload.logger.error(`Error in queueNotificationChecks: ${error}`)
    return Response.json(
      {
        error: 'Failed to queue notification checks',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
