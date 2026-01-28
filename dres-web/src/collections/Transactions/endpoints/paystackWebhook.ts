import { PayloadHandler } from 'payload'
import crypto from 'crypto'
import { handleChargeSuccess } from '../webhookHandlers/handleChargeSuccess'
import { handleChargeFailed } from '../webhookHandlers/handleChargeFailed'
import { handleTransferSuccess } from '../webhookHandlers/handleTransferSuccess'
import { handleTransferFailed } from '../webhookHandlers/handleTransferFailed'

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

interface PaystackWebhookPayload {
  event: PaystackEvent
  data: PaystackChargeData | PaystackTransferData
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
 * - transfer.success: Transfer completed - update transaction to 'completed', notify seller
 * - transfer.failed/reversed: Transfer failed - update transaction to 'cancelled', notify seller
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
        await handleChargeSuccess(payload, data as PaystackChargeData)
        break

      case 'charge.failed':
        await handleChargeFailed(payload, data as PaystackChargeData)
        break

      case 'transfer.success':
        await handleTransferSuccess(payload, data as PaystackTransferData)
        break

      case 'transfer.failed':
      case 'transfer.reversed':
        await handleTransferFailed(payload, data as PaystackTransferData)
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
