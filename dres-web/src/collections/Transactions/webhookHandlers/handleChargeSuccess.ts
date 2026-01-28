import type { Payload } from 'payload'
import { verifyPayment, fromSmallestUnit } from '../../../utilities/paystack'
import { handleOrderPayment } from './handleOrderPayment'
import { handleBoostPayment } from './handleBoostPayment'

interface PaystackChargeData {
  id: number
  domain: string
  status: string
  reference: string
  amount: number
  message: string | null
  gateway_response: string
  paid_at: string | null
  created_at: string
  channel: string
  currency: string
  ip_address: string
  metadata?: {
    orderId?: string
    orderNumber?: string
    transactionId?: string
    customerId?: string
    styleId?: string
    tierId?: string
    tierDuration?: number | string
    [key: string]: unknown
  }
  fees: number | null
  customer: {
    id: number
    first_name: string | null
    last_name: string | null
    email: string
    customer_code: string
    phone: string | null
  }
}

/**
 * Handle successful charge - update transaction and route to specific handler
 *
 * This updates the transaction to 'completed' then routes to the appropriate
 * handler based on transaction type (order payment or boost payment)
 */
export async function handleChargeSuccess(
  payload: Payload,
  data: PaystackChargeData
) {
  const { reference, fees } = data

  payload.logger.info(`🔔 handleChargeSuccess: Processing reference ${reference}`)

  // The reference is the transactionId we created
  // Find the transaction by transactionId
  const transactions = await payload.find({
    collection: 'transactions',
    where: {
      transactionId: { equals: reference },
    },
    limit: 1,
  })

  const transaction = transactions.docs[0]

  if (!transaction) {
    payload.logger.error(`🔔 handleChargeSuccess: Transaction not found for reference ${reference}`)
    return
  }

  payload.logger.info(`🔔 handleChargeSuccess: Found transaction ${transaction.id}, current status: ${transaction.status}`)

  // Check if already processed (idempotency)
  if (transaction.status === 'completed') {
    payload.logger.info(`🔔 handleChargeSuccess: Transaction ${reference} already completed, skipping`)
    return
  }

  // Verify with Paystack API to be extra sure
  payload.logger.info(`🔔 handleChargeSuccess: Verifying with Paystack API...`)
  const verification = await verifyPayment(reference)

  if (!verification.success || verification.data?.status !== 'success') {
    payload.logger.error(`🔔 handleChargeSuccess: Verification failed for ${reference}: ${verification.error}`)
    return
  }

  payload.logger.info(`🔔 handleChargeSuccess: Paystack verification successful`)

  // Update transaction status to completed
  await payload.update({
    collection: 'transactions',
    id: transaction.id,
    data: {
      status: 'completed',
      paystackFees: fees ? fromSmallestUnit(fees) : 0,
      notes: `Payment completed via Paystack. Gateway response: ${data.gateway_response}`,
    },
  })

  payload.logger.info(`🔔 handleChargeSuccess: Transaction ${reference} marked as completed`)

  // Route to specific handler based on transaction type
  const transactionType = transaction.type

  if (transactionType === 'boost_payment') {
    // Handle boost payment - create StyleBoost
    await handleBoostPayment(payload, transaction, data.metadata)
  } else {
    // Handle order payment (deposit) - update order status and billing details
    await handleOrderPayment(payload, transaction, verification.data)
  }
}
