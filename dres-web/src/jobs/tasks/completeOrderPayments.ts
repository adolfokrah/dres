import type { TaskConfig } from 'payload'

/**
 * Complete Order Payments Task
 *
 * Marks pending order_payment transactions as completed after 5 minutes.
 * This delay ensures orders are finalized before funds become available for withdrawal.
 *
 * Schedule: Every 5 minutes (for testing)
 * TODO: Change back to '0 6,18 * * *' (6 AM and 6 PM) and 6 hours delay for production
 *
 * Flow:
 * 1. Find all order_payment transactions with 'pending' status
 * 2. Filter to only those created more than 5 minutes ago
 * 3. Update status to 'completed'
 */

// In-memory lock to prevent duplicate runs within the same minute
let lastRunTimestamp: number = 0

export const completeOrderPaymentsTask: TaskConfig = {
  slug: 'completeOrderPayments' as any,
  outputSchema: [
    { name: 'transactionsCompleted', type: 'number' },
  ],
  schedule: [
    {
      cron: '*/8 * * * *', // Every 5 minutes (for testing)
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req

    // Prevent duplicate runs within 60 seconds
    const now = Date.now()
    if (now - lastRunTimestamp < 60000) {
      payload.logger.info('[CompleteOrderPayments] Skipping - already ran within last 60 seconds')
      return { output: { transactionsCompleted: 0 } }
    }
    lastRunTimestamp = now

    payload.logger.info('[CompleteOrderPayments] Starting complete order payments task')

    // Calculate cutoff time (5 minutes ago for testing)
    const cutoffTime = new Date()
    cutoffTime.setMinutes(cutoffTime.getMinutes() - 5)

    try {
      // Find all pending order_payment transactions created more than 5 minutes ago
      const pendingTransactions = await payload.find({
        collection: 'transactions',
        where: {
          type: { equals: 'order_payment' },
          status: { equals: 'pending' },
          createdAt: { less_than: cutoffTime.toISOString() },
        },
        limit: 0, // Get all matching transactions
      })

      payload.logger.info(
        `[CompleteOrderPayments] Found ${pendingTransactions.docs.length} pending order_payment transactions to complete`
      )

      if (pendingTransactions.docs.length === 0) {
        return { output: { transactionsCompleted: 0 } }
      }

      // Update each transaction to completed
      let transactionsCompleted = 0
      for (const transaction of pendingTransactions.docs) {
        try {
          await payload.update({
            collection: 'transactions',
            id: transaction.id,
            data: {
              status: 'completed',
            },
          })
          transactionsCompleted++
          payload.logger.info(
            `[CompleteOrderPayments] Completed transaction ${transaction.transactionId}`
          )
        } catch (error) {
          payload.logger.error(
            `[CompleteOrderPayments] Failed to complete transaction ${transaction.transactionId}: ${error}`
          )
        }
      }

      payload.logger.info(
        `[CompleteOrderPayments] Completed ${transactionsCompleted} order_payment transactions`
      )

      return { output: { transactionsCompleted } }
    } catch (error) {
      payload.logger.error(`[CompleteOrderPayments] Error: ${error}`)
      throw error
    }
  },
}
