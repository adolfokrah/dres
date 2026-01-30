import type { TaskConfig } from 'payload'
import { createTransferRecipient, initiateBulkTransfer, toSmallestUnit } from '../../utilities/paystack'
import { generateTransactionId } from '../../utilities/generateTransactionId'

interface SellerTransferItem {
  sellerId: string
  balance: number
  recipientCode: string
  transactionId: string
  transactionDbId: string
  currencySymbol: string
}

/**
 * Auto Transfer Seller Order Payment Task
 *
 * Finds sellers with positive balance (order_payments older than cutoff minus transfers)
 * and initiates bulk transfer to all sellers at once.
 *
 * Schedule: Once daily at midnight
 *
 * Flow:
 * 1. Find all sellers with positive balance
 * 2. Ensure all sellers have recipient codes (create if missing)
 * 3. Create transfer transactions (negative amount to zero balance)
 * 4. Initiate bulk Paystack transfer
 * 5. Webhooks handle final status (success/failed/reversed)
 */

// In-memory lock to prevent duplicate runs within the same minute
let lastRunTimestamp: number = 0

export const autoTransferSellerOrderPaymentTask: TaskConfig = {
  slug: 'autoTransferSellerOrderPayment' as any,
  outputSchema: [
    { name: 'sellersProcessed', type: 'number' },
    { name: 'transfersInitiated', type: 'number' },
    { name: 'skipped', type: 'number' },
  ],
  schedule: [
    {
      cron: '0 0 * * *',
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req

    // Prevent duplicate runs within 60 seconds
    const now = Date.now()
    if (now - lastRunTimestamp < 60000) {
      payload.logger.info('[SellerOrderPayment] Skipping - already ran within last 60 seconds')
      return { output: { sellersProcessed: 0, transfersInitiated: 0, skipped: 0 } }
    }
    lastRunTimestamp = now

    payload.logger.info('[SellerOrderPayment] Starting auto transfer seller order payment task')

    let sellersProcessed = 0
    let transfersInitiated = 0
    let skipped = 0

    // Calculate cutoff time (8 hours ago)
    const cutoffTime = new Date()
    cutoffTime.setHours(cutoffTime.getHours() - 8)

    try {
      const db = payload.db
      const transactionsCollection = db.collections['transactions']

      // Calculate balance for each seller: order_payments (older than cutoff) + transfers
      const sellersWithPositiveBalance: Array<{
        _id: any
        balance: number
        currency: any
        currencyDoc?: { symbol?: string }
      }> = await transactionsCollection.aggregate([
        {
          $match: {
            $or: [
              // Completed order_payments older than cutoff
              { type: 'order_payment', status: 'completed', createdAt: { $lt: cutoffTime } },
              // Transfers (completed, pending, or in_progress) - include all to avoid duplicates
              { type: 'transfer', status: { $in: ['completed', 'pending', 'in_progress'] } },
            ],
          },
        },
        {
          $group: {
            _id: '$user',
            balance: { $sum: '$amount' },
            currency: { $first: '$currency' },
          },
        },
        {
          $match: {
            balance: { $gt: 0 },
          },
        },
        {
          $lookup: {
            from: 'currencies',
            localField: 'currency',
            foreignField: '_id',
            as: 'currencyDoc',
          },
        },
        {
          $unwind: {
            path: '$currencyDoc',
            preserveNullAndEmptyArrays: true,
          },
        },
      ])

      payload.logger.info(
        `[SellerOrderPayment] Found ${sellersWithPositiveBalance.length} sellers with positive balance`
      )

      if (sellersWithPositiveBalance.length === 0) {
        return {
          output: {
            sellersProcessed: 0,
            transfersInitiated: 0,
            skipped: 0,
          },
        }
      }

      // Prepare transfers - ensure all sellers have recipient codes
      const validTransfers: SellerTransferItem[] = []

      for (const sellerData of sellersWithPositiveBalance) {
        sellersProcessed++
        const sellerId = sellerData._id.toString()
        const { balance, currencyDoc } = sellerData
        const currencySymbol = currencyDoc?.symbol || '₵'

        // Fetch seller's withdrawal account
        const seller = await payload.findByID({
          collection: 'users',
          id: sellerId,
          depth: 0,
        })

        if (!seller) {
          payload.logger.warn(`[SellerOrderPayment] Seller ${sellerId} not found - skipping`)
          skipped++
          continue
        }

        const withdrawalAccount = seller.withdrawalAccount as {
          bankCode?: string
          bankName?: string
          accountNumber?: string
          accountName?: string
          recipientCode?: string
        } | undefined

        if (!withdrawalAccount?.accountNumber || !withdrawalAccount?.bankCode) {
          payload.logger.warn(
            `[SellerOrderPayment] Seller ${sellerId} has no withdrawal account - skipping`
          )
          skipped++
          continue
        }

        // Create recipient code if not exists
        let recipientCode = withdrawalAccount.recipientCode
        if (!recipientCode) {
          payload.logger.info(`[SellerOrderPayment] Creating transfer recipient for seller ${sellerId}`)

          const recipientResult = await createTransferRecipient({
            type: 'mobile_money',
            name: withdrawalAccount.accountName || seller.shopName || seller.firstName || 'Seller',
            accountNumber: withdrawalAccount.accountNumber,
            bankCode: withdrawalAccount.bankCode,
            currency: 'GHS',
          })

          if (!recipientResult.success || !recipientResult.data?.recipient_code) {
            payload.logger.error(
              `[SellerOrderPayment] Failed to create recipient for seller ${sellerId}: ${recipientResult.error}`
            )
            skipped++
            continue
          }

          recipientCode = recipientResult.data.recipient_code

          // Save recipient code to seller's withdrawal account
          await payload.update({
            collection: 'users',
            id: sellerId,
            data: {
              withdrawalAccount: {
                ...withdrawalAccount,
                recipientCode,
              },
            },
          })

          payload.logger.info(`[SellerOrderPayment] Created recipient code ${recipientCode} for seller ${sellerId}`)
        }

        // Create transfer transaction (negative amount to zero out balance)
        const transactionId = generateTransactionId()
        const transaction = await payload.create({
          collection: 'transactions',
          data: {
            transactionId,
            type: 'transfer',
            user: sellerId,
            amount: -balance,
            status: 'in_progress',
            notes: `Auto-transfer - Balance: ${currencySymbol}${balance.toFixed(2)}`,
          },
        })

        validTransfers.push({
          sellerId,
          balance,
          recipientCode,
          transactionId,
          transactionDbId: transaction.id,
          currencySymbol,
        })

        payload.logger.info(
          `[SellerOrderPayment] Created transfer transaction for seller ${sellerId}: ${currencySymbol}${balance.toFixed(2)}`
        )
      }

      if (validTransfers.length === 0) {
        payload.logger.info('[SellerOrderPayment] No valid transfers to process')
        return {
          output: {
            sellersProcessed,
            transfersInitiated: 0,
            skipped,
          },
        }
      }

      // Initiate bulk transfer
      payload.logger.info(`[SellerOrderPayment] Initiating bulk transfer for ${validTransfers.length} sellers`)

      const bulkResult = await initiateBulkTransfer(
        validTransfers.map((t) => ({
          amount: toSmallestUnit(t.balance),
          recipientCode: t.recipientCode,
          reference: t.transactionId,
          reason: `Seller payout - ${t.transactionId}`,
        })),
        'GHS'
      )

      if (!bulkResult.success) {
        // Mark all transactions as cancelled if bulk transfer fails
        for (const transfer of validTransfers) {
          await payload.update({
            collection: 'transactions',
            id: transfer.transactionDbId,
            data: {
              status: 'cancelled',
              notes: `Bulk transfer failed: ${bulkResult.error}`,
            },
          })
        }

        payload.logger.error(`[SellerOrderPayment] Bulk transfer failed: ${bulkResult.error}`)
        return {
          output: {
            sellersProcessed,
            transfersInitiated: 0,
            skipped,
          },
        }
      }

      transfersInitiated = validTransfers.length
      payload.logger.info(
        `[SellerOrderPayment] Bulk transfer initiated for ${transfersInitiated} sellers. Awaiting webhooks.`
      )

      return {
        output: {
          sellersProcessed,
          transfersInitiated,
          skipped,
        },
      }
    } catch (error) {
      payload.logger.error(`[SellerOrderPayment] Error: ${error}`)
      throw error
    }
  },
}
