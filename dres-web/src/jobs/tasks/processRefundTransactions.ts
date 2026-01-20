import type { TaskConfig } from 'payload'

/**
 * Process Refund Transactions Task (FOR TESTING ONLY)
 *
 * Automatically marks pending refund and shipping_payment transactions as completed.
 * This simulates the transactions being processed by the payment provider.
 *
 * Schedule: Every 8 minutes (for testing)
 *
 * NOTE: This is for testing purposes only. In production, these should
 * be processed via actual payment provider webhooks.
 */
export const processRefundTransactionsTask: TaskConfig = {
  slug: 'processRefundTransactions' as any,
  retries: 2,
  outputSchema: [
    { name: 'transactionsProcessed', type: 'number' },
  ],
  // Schedule: Every 8 minutes (for testing)
  schedule: [
    {
      cron: '*/8 * * * *', // Every 8 minutes (for testing only)
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req

    payload.logger.info('[ProcessRefunds] Starting process refund transactions task')

    let transactionsProcessed = 0

    try {
      // Find pending refund and shipping_payment transactions
      const pendingTransactions = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { type: { in: ['refund', 'shipping_payment'] } },
            { status: { equals: 'pending' } },
          ],
        },
        limit: 50, // Process in batches
        depth: 0,
      })

      payload.logger.info(`[ProcessRefunds] Found ${pendingTransactions.docs.length} pending refund/shipping transactions`)

      for (const transaction of pendingTransactions.docs) {
        try {
          await payload.update({
            collection: 'transactions',
            id: transaction.id,
            data: {
              status: 'completed',
            },
          })

          transactionsProcessed++
          payload.logger.info(
            `[ProcessRefunds] Marked ${transaction.type} transaction ${transaction.transactionId} as completed`
          )
        } catch (error) {
          payload.logger.error(
            `[ProcessRefunds] Error processing transaction ${transaction.transactionId}: ${error}`
          )
        }
      }

      payload.logger.info(
        `[ProcessRefunds] Completed - ${transactionsProcessed} transactions processed`
      )

      return {
        output: {
          transactionsProcessed,
        },
      }
    } catch (error) {
      payload.logger.error(`[ProcessRefunds] Error: ${error}`)
      throw error
    }
  },
}
