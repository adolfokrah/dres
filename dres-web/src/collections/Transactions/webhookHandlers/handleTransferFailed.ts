import type { Payload } from 'payload'
import { verifyTransfer } from '../../../utilities/paystack'

interface PaystackTransferData {
  id: number
  domain: string
  status: string
  reference: string
  amount: number
  currency: string
  reason: string | null
  transfer_code: string
  recipient: string | number
  created_at: string
  updated_at: string
  source: string
  source_details: string | null
  titan_code: string | null
}

/**
 * Handle failed or reversed transfer - update transaction and notify user
 *
 * This updates the existing transaction created by autoTransferToSellers or processRefundTransactions
 * from 'in_progress' to 'cancelled' and notifies the user
 */
export async function handleTransferFailed(
  payload: Payload,
  data: PaystackTransferData
) {
  const { reference } = data

  payload.logger.info(`🔔 handleTransferFailed: Processing reference ${reference}`)

  // Find the existing transaction
  const transactions = await payload.find({
    collection: 'transactions',
    where: {
      transactionId: { equals: reference },
    },
    limit: 1,
  })

  const transaction = transactions.docs[0]

  if (!transaction) {
    payload.logger.error(`🔔 handleTransferFailed: Transaction not found for reference ${reference}`)
    return
  }

  // Verify transfer status with Paystack API before updating
  const verified = await verifyTransfer(reference)

  if (!verified.success) {
    payload.logger.error(`🔔 handleTransferFailed: Failed to verify transfer ${reference}: ${verified.error}`)
    return
  }

  // Only proceed if verified status is 'failed' or 'reversed'
  const verifiedStatus = verified.data?.status
  if (verifiedStatus !== 'failed' && verifiedStatus !== 'reversed') {
    payload.logger.warn(`🔔 handleTransferFailed: Transfer ${reference} verified status is '${verifiedStatus}', not 'failed' or 'reversed'. Skipping.`)
    return
  }

  payload.logger.info(`🔔 handleTransferFailed: Transfer ${reference} verified as ${verifiedStatus}`)

  // Update transaction status to cancelled
  await payload.update({
    collection: 'transactions',
    id: transaction.id,
    data: {
      status: 'cancelled',
      notes: `Transfer failed or reversed. Reason: ${verified.data?.reason || data.reason || 'Unknown'}, Status: ${verifiedStatus}`,
    },
  })

  payload.logger.info(`🔔 handleTransferFailed: Transaction ${reference} marked as cancelled`)

  // Get user ID
  const userId = typeof transaction.user === 'object' && transaction.user ? transaction.user.id : transaction.user

  if (!userId) {
    payload.logger.error(`🔔 handleTransferFailed: No user linked to transaction ${reference}`)
    return
  }

  // Notify user about failed transfer
  await payload.create({
    collection: 'notifications',
    data: {
      user: userId,
      type: 'system',
      message: `Your withdrawal transfer failed. Please contact support or update your withdrawal account details.`,
      path: `/profile?tab=transactions`,
      read: false,
    },
  })

  payload.logger.info(`🔔 handleTransferFailed: Notification sent to user ${userId}`)
}
