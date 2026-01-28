import type { TaskConfig } from 'payload'
import { createTransferRecipient, initiateBulkTransfer, toSmallestUnit } from '../../utilities/paystack'

interface TransferItem {
  transactionId: string
  transactionDbId: string
  amount: number
  recipientCode: string
  reason: string
}

/**
 * Auto Transfer Buyer Refund Task
 *
 * Processes pending refund transactions by initiating
 * bulk Paystack transfers to buyers' withdrawal accounts.
 *
 * Schedule: Once daily at midnight
 *
 * Flow:
 * 1. Find pending refund transactions
 * 2. Ensure all users have recipient codes (create if missing)
 * 3. Mark all transactions as 'in_progress'
 * 4. Initiate bulk Paystack transfer
 * 5. Webhooks handle final status (success/failed/reversed)
 */
export const autoTransferBuyerRefundTask: TaskConfig = {
  slug: 'autoTransferBuyerRefund' as any,
  retries: 2,
  outputSchema: [
    { name: 'transactionsProcessed', type: 'number' },
    { name: 'transfersInitiated', type: 'number' },
    { name: 'skipped', type: 'number' },
  ],
  schedule: [
    {
      cron: '0 0 * * *', // Once daily at midnight
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req

    payload.logger.info('[BuyerRefund] Starting process refund transactions task')

    let transactionsProcessed = 0
    let transfersInitiated = 0
    let skipped = 0

    try {
      // Find pending refund transactions
      const pendingTransactions = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { type: { equals: 'refund' } },
            { status: { equals: 'pending' } },
          ],
        },
        limit: 100, // Max 100 for bulk transfer
        depth: 0,
      })

      payload.logger.info(`[BuyerRefund] Found ${pendingTransactions.docs.length} pending refund transactions`)

      if (pendingTransactions.docs.length === 0) {
        return {
          output: {
            transactionsProcessed: 0,
            transfersInitiated: 0,
            skipped: 0,
          },
        }
      }

      // Prepare transfers - ensure all users have recipient codes
      const validTransfers: TransferItem[] = []
      const transactionsToUpdate: string[] = []

      for (const transaction of pendingTransactions.docs) {
        transactionsProcessed++

        // Get the user's withdrawal account
        const userId = typeof transaction.user === 'object' ? transaction.user.id : transaction.user
        if (!userId) {
          payload.logger.warn(`[BuyerRefund] Transaction ${transaction.transactionId} has no user - skipping`)
          skipped++
          continue
        }

        const user = await payload.findByID({
          collection: 'users',
          id: userId,
          depth: 0,
        })

        if (!user) {
          payload.logger.warn(`[BuyerRefund] User ${userId} not found - skipping transaction ${transaction.transactionId}`)
          skipped++
          continue
        }

        const withdrawalAccount = user.withdrawalAccount as {
          bankCode?: string
          bankName?: string
          accountNumber?: string
          accountName?: string
          recipientCode?: string
        } | undefined

        // Check if user has withdrawal account details
        if (!withdrawalAccount?.accountNumber || !withdrawalAccount?.bankCode) {
          payload.logger.warn(
            `[BuyerRefund] User ${userId} has no withdrawal account - skipping transaction ${transaction.transactionId}`
          )
          skipped++
          continue
        }

        // Create recipient code if not exists
        let recipientCode = withdrawalAccount.recipientCode
        if (!recipientCode) {
          payload.logger.info(`[BuyerRefund] Creating transfer recipient for user ${userId}`)

          const recipientResult = await createTransferRecipient({
            type: 'nuban',
            name: withdrawalAccount.accountName || user.firstName || 'Customer',
            accountNumber: withdrawalAccount.accountNumber,
            bankCode: withdrawalAccount.bankCode,
            currency: 'GHS',
          })

          if (!recipientResult.success || !recipientResult.data?.recipient_code) {
            payload.logger.error(
              `[BuyerRefund] Failed to create recipient for user ${userId}: ${recipientResult.error}`
            )
            skipped++
            continue
          }

          recipientCode = recipientResult.data.recipient_code

          // Save recipient code to user's withdrawal account
          await payload.update({
            collection: 'users',
            id: userId,
            data: {
              withdrawalAccount: {
                ...withdrawalAccount,
                recipientCode,
              },
            },
          })

          payload.logger.info(`[BuyerRefund] Created recipient code ${recipientCode} for user ${userId}`)
        }

        // Add to valid transfers
        validTransfers.push({
          transactionId: transaction.transactionId,
          transactionDbId: transaction.id,
          amount: toSmallestUnit(transaction.amount),
          recipientCode,
          reason: `Buyer refund - ${transaction.transactionId}`,
        })
        transactionsToUpdate.push(transaction.id)
      }

      if (validTransfers.length === 0) {
        payload.logger.info('[BuyerRefund] No valid transfers to process')
        return {
          output: {
            transactionsProcessed,
            transfersInitiated: 0,
            skipped,
          },
        }
      }

      // Mark all transactions as 'in_progress' before initiating bulk transfer
      for (const txId of transactionsToUpdate) {
        await payload.update({
          collection: 'transactions',
          id: txId,
          data: {
            status: 'in_progress',
          },
        })
      }

      payload.logger.info(`[BuyerRefund] Marked ${transactionsToUpdate.length} transactions as in_progress`)

      // Initiate bulk transfer
      const bulkResult = await initiateBulkTransfer(
        validTransfers.map((t) => ({
          amount: t.amount,
          recipientCode: t.recipientCode,
          reference: t.transactionId,
          reason: t.reason,
        })),
        'GHS'
      )

      if (!bulkResult.success) {
        // Mark all as cancelled if bulk transfer fails
        for (const txId of transactionsToUpdate) {
          await payload.update({
            collection: 'transactions',
            id: txId,
            data: {
              status: 'cancelled',
              notes: `Bulk transfer failed: ${bulkResult.error}`,
            },
          })
        }

        payload.logger.error(`[BuyerRefund] Bulk transfer failed: ${bulkResult.error}`)
        return {
          output: {
            transactionsProcessed,
            transfersInitiated: 0,
            skipped,
          },
        }
      }

      transfersInitiated = validTransfers.length
      payload.logger.info(
        `[BuyerRefund] Bulk transfer initiated for ${transfersInitiated} transactions. Awaiting webhooks.`
      )

      return {
        output: {
          transactionsProcessed,
          transfersInitiated,
          skipped,
        },
      }
    } catch (error) {
      payload.logger.error(`[BuyerRefund] Error: ${error}`)
      throw error
    }
  },
}
