import { PayloadHandler } from 'payload'
import crypto from 'crypto'
import { verifyPayment, fromSmallestUnit } from '../../../utilities/paystack'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

/**
 * Paystack Webhook Event Types
 */
type PaystackEvent = 
  | 'charge.success'
  | 'charge.failed'
  | 'transfer.success'
  | 'transfer.failed'
  | 'transfer.reversed'

interface PaystackWebhookPayload {
  event: PaystackEvent
  data: {
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
}

/**
 * Verify Paystack webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string): boolean {
  if (!PAYSTACK_SECRET_KEY) {
    return false
  }

  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payload)
    .digest('hex')

  return hash === signature
}

/**
 * POST /api/transactions/webhooks/paystack
 * 
 * Handles Paystack webhook events:
 * - charge.success: Payment successful - update order status to 'placed'
 * - charge.failed: Payment failed - update transaction status to 'cancelled'
 * 
 * Paystack webhook docs: https://paystack.com/docs/payments/webhooks/
 */
export const paystackWebhook: PayloadHandler = async (req) => {
  const { payload } = req

  payload.logger.info('🔔 Paystack webhook endpoint hit')

  try {
    // Get raw body for signature verification
    // Paystack signs the raw JSON body string
    let rawBody: string | undefined

    // Try different methods to get the body
    if (typeof req.text === 'function') {
      rawBody = await req.text()
    } else if (req.body) {
      // If body is already parsed, stringify it
      rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    }
    
    if (!rawBody) {
      payload.logger.error('🔔 Paystack webhook: No body received')
      return Response.json({ error: 'No body' }, { status: 400 })
    }

    payload.logger.info(`🔔 Paystack webhook: Body received (${rawBody.length} chars)`)

    // Verify webhook signature
    const signature = req.headers.get('x-paystack-signature')
    
    if (!signature) {
      payload.logger.error('🔔 Paystack webhook: No x-paystack-signature header')
      // Return 200 anyway to prevent retries during testing
      return Response.json({ error: 'No signature' }, { status: 200 })
    }

    payload.logger.info(`🔔 Paystack webhook: Signature header present`)

    if (!verifyWebhookSignature(rawBody, signature)) {
      payload.logger.error('🔔 Paystack webhook: Invalid signature')
      return Response.json({ error: 'Invalid signature' }, { status: 401 })
    }

    payload.logger.info('🔔 Paystack webhook: Signature verified successfully')

    // Parse the webhook payload
    const webhookData = JSON.parse(rawBody) as PaystackWebhookPayload
    const { event, data } = webhookData

    payload.logger.info(`🔔 Paystack webhook: Event=${event}, Reference=${data.reference}, Status=${data.status}`)

    // Handle different events
    switch (event) {
      case 'charge.success':
        await handleChargeSuccess(payload, data)
        break

      case 'charge.failed':
        await handleChargeFailed(payload, data)
        break

      default:
        payload.logger.info(`🔔 Paystack webhook: Unhandled event ${event}`)
    }

    // Always return 200 to acknowledge receipt
    payload.logger.info('🔔 Paystack webhook: Returning 200 OK')
    return Response.json({ received: true })

  } catch (error) {
    payload.logger.error(`🔔 Paystack webhook error: ${error}`)
    // Still return 200 to prevent Paystack from retrying
    return Response.json({ received: true, error: 'Processing error' })
  }
}

/**
 * Handle successful charge - update transaction and order
 */
async function handleChargeSuccess(
  payload: Parameters<PayloadHandler>[0]['payload'],
  data: PaystackWebhookPayload['data']
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

  // Check if already processed
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

  // Handle different transaction types
  const transactionType = transaction.type

  if (transactionType === 'boost_payment') {
    // Handle boost payment - create StyleBoost
    await handleBoostPaymentSuccess(payload, transaction, data)
    return
  }

  // Handle order payment (deposit)
  // Get the order from the transaction
  const orderId = typeof transaction.order === 'object' && transaction.order ? transaction.order.id : transaction.order

  if (!orderId) {
    payload.logger.error(`🔔 handleChargeSuccess: No order linked to transaction ${reference}`)
    return
  }

  // Check if order is already placed (idempotency check to prevent duplicate notifications)
  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
  })

  if (order && order.status !== 'new') {
    payload.logger.info(`🔔 handleChargeSuccess: Order ${orderId} already has status '${order.status}', skipping update`)
    return
  }

  // Update order status to 'placed'
  await payload.update({
    collection: 'orders',
    id: orderId,
    data: {
      status: 'placed',
    },
  })

  payload.logger.info(`🔔 handleChargeSuccess: Order ${orderId} status updated to 'placed'`)
}

/**
 * Handle successful boost payment - create StyleBoost
 */
async function handleBoostPaymentSuccess(
  payload: Parameters<PayloadHandler>[0]['payload'],
  transaction: { id: string; transactionId: string; user?: unknown },
  data: PaystackWebhookPayload['data']
) {
  const { reference, metadata } = data

  payload.logger.info(`🔔 handleBoostPaymentSuccess: Processing boost payment ${reference}`)

  // Get style and tier info from metadata
  const styleId = metadata?.styleId as string | undefined
  const tierId = metadata?.tierId as string | undefined
  const tierDuration = metadata?.tierDuration as number | undefined

  if (!styleId || !tierId) {
    payload.logger.error(`🔔 handleBoostPaymentSuccess: Missing styleId or tierId in metadata`)
    return
  }

  // Get tier info if duration not in metadata
  let duration = tierDuration
  if (!duration) {
    const tier = await payload.findByID({
      collection: 'boost-tiers',
      id: tierId,
      depth: 0,
    })
    duration = tier?.duration as number || 7
  }

  // Calculate start and end dates
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + duration)

  // Create the StyleBoost
  const styleBoost = await payload.create({
    collection: 'style-boosts',
    data: {
      style: styleId,
      tier: tierId,
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      transaction: transaction.id,
      notes: `Boost activated via payment. Duration: ${duration} days.`,
    },
    overrideAccess: true,
  })

  payload.logger.info(`🔔 handleBoostPaymentSuccess: StyleBoost created ${styleBoost.id} for style ${styleId}`)
}

/**
 * Handle failed charge - update transaction and order
 */
async function handleChargeFailed(
  payload: Parameters<PayloadHandler>[0]['payload'],
  data: PaystackWebhookPayload['data']
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
