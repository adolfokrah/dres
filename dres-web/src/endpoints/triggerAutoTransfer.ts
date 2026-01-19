import type { PayloadHandler } from 'payload'

/**
 * POST /api/trigger-auto-transfer
 * Manually trigger the auto transfer to sellers task (for testing)
 * Requires admin authentication
 */
export const triggerAutoTransfer: PayloadHandler = async (req) => {
  const { payload, user } = req

  // Require admin user
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized - admin only' }, { status: 401 })
  }

  try {
    payload.logger.info('[TriggerAutoTransfer] Manual trigger requested by admin')

    // Queue the auto transfer task to run immediately
    const job = await payload.jobs.queue({
      task: 'autoTransferToSellers' as any,
      input: {},
    })

    payload.logger.info(`[TriggerAutoTransfer] Job queued with ID: ${job.id}`)

    // Optionally run the job immediately
    await payload.jobs.run()

    return Response.json({
      success: true,
      message: 'Auto transfer task triggered',
      jobId: job.id,
    })
  } catch (error) {
    payload.logger.error(`[TriggerAutoTransfer] Error: ${error}`)
    return Response.json(
      {
        error: 'Failed to trigger auto transfer',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
