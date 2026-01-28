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
 * Handle successful transfer - update transaction and notify seller
 *
 * This updates the existing transaction created by processSellerTransfer
 * from 'in_progress' to 'completed' and sends a notification to the seller
 */
export async function handleTransferSuccess(
  payload: Payload,
  data: PaystackTransferData
) {
  const { reference } = data

  payload.logger.info(`🔔 handleTransferSuccess: Processing reference ${reference}`)

  // Find the existing transaction by transactionId (reference)
  const transactions = await payload.find({
    collection: 'transactions',
    where: {
      transactionId: { equals: reference },
    },
    limit: 1,
  })

  const transaction = transactions.docs[0]

  if (!transaction) {
    payload.logger.error(`🔔 handleTransferSuccess: Transaction not found for reference ${reference}`)
    return
  }

  payload.logger.info(`🔔 handleTransferSuccess: Found transaction ${transaction.id}, current status: ${transaction.status}`)

  // Check if already processed (idempotency)
  if (transaction.status === 'completed') {
    payload.logger.info(`🔔 handleTransferSuccess: Transaction ${reference} already completed, skipping`)
    return
  }

  // Verify transfer status with Paystack API before updating
  const verified = await verifyTransfer(reference)

  if (!verified.success) {
    payload.logger.error(`🔔 handleTransferSuccess: Failed to verify transfer ${reference}: ${verified.error}`)
    return
  }

  // Only proceed if verified status is 'success'
  if (verified.data?.status !== 'success') {
    payload.logger.warn(`🔔 handleTransferSuccess: Transfer ${reference} verified status is '${verified.data?.status}', not 'success'. Skipping.`)
    return
  }

  payload.logger.info(`🔔 handleTransferSuccess: Transfer ${reference} verified as successful`)

  // Get transaction amount and currency
  const amount = Math.abs(transaction.amount) // Transfers are negative amounts
  const currencyId = typeof transaction.currency === 'object' && transaction.currency ? transaction.currency.id : transaction.currency

  // Get currency symbol
  let currencySymbol = '₵'
  if (currencyId) {
    const currency = await payload.findByID({
      collection: 'currencies',
      id: currencyId,
      depth: 0,
    })
    currencySymbol = currency?.symbol || '₵'
  }

  // Update transaction status to completed
  await payload.update({
    collection: 'transactions',
    id: transaction.id,
    data: {
      status: 'completed',
      notes: `Transfer completed via Paystack. Transfer code: ${data.transfer_code}`,
    },
  })

  payload.logger.info(`🔔 handleTransferSuccess: Transaction ${reference} marked as completed`)

  // Get user ID
  const userId = typeof transaction.user === 'object' && transaction.user ? transaction.user.id : transaction.user

  if (!userId) {
    payload.logger.error(`🔔 handleTransferSuccess: No user linked to transaction ${reference}`)
    return
  }

  // Create notification for seller
  await payload.create({
    collection: 'notifications',
    data: {
      user: userId,
      type: 'system',
      message: `An amount of ${currencySymbol}${amount.toFixed(2)} has been transferred to your withdrawal account 💰`,
      path: `/profile?tab=transactions`,
      read: false,
    },
  })

  payload.logger.info(`🔔 handleTransferSuccess: Notification sent to user ${userId}`)
}
