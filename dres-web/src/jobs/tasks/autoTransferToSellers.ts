import type { TaskConfig } from 'payload'

/**
 * Auto Transfer to Sellers Scheduler Task (FOR TESTING ONLY)
 *
 * Finds sellers with positive balance (order_payments older than cutoff minus transfers)
 * and queues individual transfer tasks for each seller.
 *
 * Duplicate protection: Only queues tasks for sellers with balance > 0.
 * The balance calculation includes all existing transfers, so sellers who
 * already received transfers will have balance = 0 and won't be queued again.
 *
 * Schedule: Every 6 hours
 */

// In-memory lock to prevent duplicate runs within the same minute
let lastRunTimestamp: number = 0

export const autoTransferToSellersTask: TaskConfig = {
  slug: 'autoTransferToSellers' as any,
  outputSchema: [{ name: 'sellersQueued', type: 'number' }],
  // Schedule: Every 6 minutes for testing (change to '0 */6 * * *' for production)
  schedule: [
    {
      cron: '*/6 * * * *',
      queue: 'default', // Use default queue like autoDeliverItems
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req


    payload.logger.info('Just called')
    // Prevent duplicate runs within 60 seconds
    const now = Date.now()
    if (now - lastRunTimestamp < 60000) {
      payload.logger.info('[AutoTransfer] Skipping - already ran within last 60 seconds')
      return { output: { sellersQueued: 0 } }
    }
    lastRunTimestamp = now

    payload.logger.info('[AutoTransfer] Starting scheduler task')

    // Calculate cutoff time (5 minutes ago) - for testing
    const cutoffTime = new Date()
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 5)


    // return {
    //     output: {
    //       sellersQueued: [],
    //     },
    //   }

    try {
      const db = payload.db
      const transactionsCollection = db.collections['transactions']

      // Calculate balance for each seller: order_payments (older than cutoff) + transfers (completed or pending)
      // Only return sellers with positive balance (haven't been fully transferred yet)
      const sellersWithPositiveBalance: Array<{ _id: any; balance: number }> =
        await transactionsCollection.aggregate([
          {
            $match: {
              $or: [
                // Completed order_payments older than cutoff
                { type: 'order_payment', status: 'completed', createdAt: { $lt: cutoffTime } },
                // Transfers (completed or pending) - include pending to avoid duplicate transfers
                { type: 'transfer', status: { $in: ['completed', 'pending'] } },
              ],
            },
          },
          {
            $group: {
              _id: '$user',
              balance: { $sum: '$amount' },
            },
          },
          {
            // Only include sellers with positive balance
            $match: {
              balance: { $gt: 0 },
            },
          },
        ])

      payload.logger.info(
        `[AutoTransfer] Found ${sellersWithPositiveBalance.length} sellers with positive balance`,
      )

      // Queue a transfer task for each seller with positive balance
      let sellersQueued = 0
      for (const seller of sellersWithPositiveBalance) {
        const sellerId = seller._id.toString()

        // Queue individual task for this seller
        await payload.jobs.queue({
          task: 'processSellerTransfer' as any,
          input: {
            sellerId,
          },
        })

        sellersQueued++
        payload.logger.info(`[AutoTransfer] Queued transfer task for seller ${sellerId}`)
      }

      payload.logger.info(`[AutoTransfer] Scheduler completed - ${sellersQueued} tasks queued`)

      return {
        output: {
          sellersQueued,
        },
      }
    } catch (error) {
      payload.logger.error(`[AutoTransfer] Scheduler error: ${error}`)
      throw error
    }
  },
}
