type TransactionType =
  | 'deposit'
  | 'refund'
  | 'order_payment'
  | 'transfer'
  | 'shipping_payment'

type TransactionStatus = 'pending' | 'completed' | 'cancelled' | 'in_progress'

export interface TransactionInput {
  type: TransactionType
  orderId?: string
  userId?: string
  amount?: number
  fees?: number
  paystackFees?: number
  status?: TransactionStatus
  itemId?: string
}

/**
 * Creates a mock transaction with sensible defaults
 */
export function createTransaction(input: TransactionInput) {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return {
    id: `txn-${uniqueId}`,
    transactionId: `TXN-TEST-${uniqueId}`,
    type: input.type,
    status: input.status ?? 'completed',
    user: input.userId ?? 'user-1',
    order: input.orderId ?? 'order-1',
    amount: input.amount ?? 100,
    fees: input.fees ?? 0,
    paystackFees: input.paystackFees ?? 0,
    itemId: input.itemId,
  }
}

/**
 * Creates a deposit transaction (customer pays for order)
 */
export function createDepositTransaction(
  orderId: string,
  options: { fees?: number; paystackFees?: number; amount?: number; userId?: string } = {},
) {
  return createTransaction({
    type: 'deposit',
    orderId,
    userId: options.userId,
    amount: options.amount ?? 100,
    fees: options.fees ?? 0,
    paystackFees: options.paystackFees ?? 0,
  })
}

/**
 * Creates a refund transaction (platform refunds customer)
 */
export function createRefundTransaction(
  orderId: string,
  options: { fees?: number; paystackFees?: number; amount?: number; userId?: string; itemId?: string } = {},
) {
  return createTransaction({
    type: 'refund',
    orderId,
    userId: options.userId,
    amount: options.amount ?? 100,
    fees: options.fees ?? 0,
    paystackFees: options.paystackFees ?? 0,
    itemId: options.itemId,
  })
}

/**
 * Creates a shipping_payment transaction (platform pays seller for shipping)
 */
export function createShippingPaymentTransaction(
  orderId: string,
  options: { fees?: number; paystackFees?: number; amount?: number; userId?: string } = {},
) {
  return createTransaction({
    type: 'shipping_payment',
    orderId,
    userId: options.userId,
    amount: options.amount ?? 10,
    fees: options.fees ?? 0,
    paystackFees: options.paystackFees ?? 1, // Transfer fee
  })
}

/**
 * Creates an order_payment transaction (platform pays seller for items)
 */
export function createOrderPaymentTransaction(
  orderId: string,
  options: { fees?: number; paystackFees?: number; amount?: number; userId?: string } = {},
) {
  return createTransaction({
    type: 'order_payment',
    orderId,
    userId: options.userId,
    amount: options.amount ?? 100,
    fees: options.fees ?? 0,
    paystackFees: options.paystackFees ?? 1, // Transfer fee
  })
}
