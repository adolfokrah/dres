import type { Payload } from 'payload'

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
 * Handle failed charge - update transaction and order
 */
export async function handleChargeFailed(
  payload: Payload,
  data: PaystackChargeData
) {
  const { reference } = data

  payload.logger.info(`🔔 handleChargeFailed: Processing reference ${reference}`)

  // Find the transaction
  const transactions = await payload.find({
    collection: 'transactions',
    where: {
      transactionId: { equals: reference },
    },
    limit: 1,
  })

  const transaction = transactions.docs[0]

  if (!transaction) {
    payload.logger.error(`🔔 handleChargeFailed: Transaction not found for reference ${reference}`)
    return
  }

  // Update transaction status to cancelled
  await payload.update({
    collection: 'transactions',
    id: transaction.id,
    data: {
      status: 'cancelled',
      notes: `Payment failed. Gateway response: ${data.gateway_response}`,
    },
  })

  payload.logger.info(`🔔 handleChargeFailed: Transaction ${reference} marked as cancelled`)

  // Get the order from the transaction
  const orderId = typeof transaction.order === 'object' && transaction.order !== null ? transaction.order.id : transaction.order

  if (!orderId) {
    payload.logger.error(`🔔 handleChargeFailed: No order linked to transaction ${reference}`)
    return
  }

  // Update order status to 'cancelled'
  await payload.update({
    collection: 'orders',
    id: orderId,
    data: {
      status: 'cancelled',
    },
  })

  payload.logger.info(`🔔 handleChargeFailed: Order ${orderId} status updated to 'cancelled'`)
}
