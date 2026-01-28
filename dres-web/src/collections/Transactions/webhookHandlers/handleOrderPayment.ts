import type { Payload } from 'payload'

interface PaystackVerificationData {
  authorization?: {
    authorization_code: string
    bin: string
    last4: string
    exp_month: string
    exp_year: string
    channel: string
    card_type: string
    bank: string
    country_code: string
    brand: string
    reusable: boolean
    signature: string
    account_name: string | null
  }
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
 * Handle successful order payment - update order status to 'placed'
 *
 * This is called after a transaction is marked as completed to update
 * the associated order status from 'new' to 'placed' and populate billing details
 */
export async function handleOrderPayment(
  payload: Payload,
  transaction: {
    id: string
    transactionId: string
    order?: string | { id: string } | null
  },
  verificationData?: PaystackVerificationData
) {
  const { transactionId } = transaction

  // Get the order from the transaction
  const orderId = typeof transaction.order === 'object' && transaction.order ? transaction.order.id : transaction.order

  if (!orderId) {
    payload.logger.error(`🔔 handleOrderPayment: No order linked to transaction ${transactionId}`)
    return
  }

  // Check if order is already placed (idempotency check to prevent duplicate notifications)
  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
  })

  if (order && order.status !== 'new') {
    payload.logger.info(`🔔 handleOrderPayment: Order ${orderId} already has status '${order.status}', skipping update`)
    return
  }

  // Build billing details from Paystack verification data
  const billingDetails: {
    accountName?: string
    accountNumber?: string
    bank?: string
  } = {}

  if (verificationData) {
    const { authorization, customer } = verificationData

    // Account name: prefer authorization account_name, fallback to customer name
    if (authorization?.account_name) {
      billingDetails.accountName = authorization.account_name
    } else if (customer.first_name || customer.last_name) {
      billingDetails.accountName = [customer.first_name, customer.last_name].filter(Boolean).join(' ')
    }

    // Account number: use masked card number (last4) or full for mobile money
    if (authorization?.last4) {
      billingDetails.accountNumber = `****${authorization.last4}`
    }

    // Bank: from authorization
    if (authorization?.bank) {
      billingDetails.bank = authorization.bank
    }
  }

  // Update order status to 'placed' and billing details
  await payload.update({
    collection: 'orders',
    id: orderId,
    data: {
      status: 'placed',
      ...(Object.keys(billingDetails).length > 0 && { billingDetails }),
    },
  })

  payload.logger.info(`🔔 handleOrderPayment: Order ${orderId} status updated to 'placed'`)
}
