import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest'

let payload: Payload

// Track created documents for cleanup
const createdDocs: {
  orders: string[]
  transactions: string[]
  users: string[]
} = {
  orders: [],
  transactions: [],
  users: [],
}

/**
 * Helper to create a test user
 */
async function createTestUser(overrides: { shopName?: string } = {}) {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (payload.create as any)({
    collection: 'users',
    disableVerificationEmail: true,
    data: {
      email: `refund-test-${uniqueId}@test.com`,
      password: 'testpassword123',
      firstName: `RefundTest${uniqueId}`,
      lastName: 'User',
      role: 'user',
      shopName: overrides.shopName,
      username: `refundtest${uniqueId.replace(/-/g, '')}`,
      withdrawalAccount: {
        accountName: 'Test Account',
        accountNumber: '1234567890',
        bank: 'Test Bank',
      },
    },
  })
  createdDocs.users.push(user.id)
  return user
}

type ShippingStatus =
  | 'placed'
  | 'cancelled'
  | 'out_for_delivery'
  | 'delivered'
  | 'return_in_progress'
  | 'returned'
  | 'disputed'
  | 'not_available'

/**
 * Helper to create a test order
 */
async function createTestOrder(
  customerId: string,
  items: Array<{
    seller: string
    price: number
    originalPrice: number
    shippingFee?: number
    buyerProtection?: boolean
    buyerProtectionFee?: number
    shippingStatus?: ShippingStatus
  }>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await (payload.create as any)({
    collection: 'orders',
    data: {
      orderId: `ORD-TEST-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      status: 'placed',
      customer: customerId,
      items: items.map((item, idx) => ({
        id: `item-${idx}`,
        seller: item.seller,
        variationTitle: `Test Item ${idx + 1}`,
        price: item.price,
        originalPrice: item.originalPrice,
        quantity: 1,
        shippingFee: item.shippingFee ?? 0,
        buyerProtection: item.buyerProtection ?? false,
        buyerProtectionFee: item.buyerProtectionFee ?? 0,
        shippingStatus: item.shippingStatus ?? 'placed',
      })),
    },
  })
  createdDocs.orders.push(order.id)
  return order
}

/**
 * Helper to create a deposit transaction (simulating payment)
 */
async function createDepositTransaction(
  userId: string,
  orderId: string,
  amount: number,
) {
  const txn = await payload.create({
    collection: 'transactions',
    data: {
      transactionId: `TXN-DEP-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'deposit',
      status: 'completed',
      user: userId,
      order: orderId,
      amount: amount,
      fees: 5,
      paystackFees: 1.5,
      billingDetails: {
        accountName: 'Test Customer',
        accountNumber: '0987654321',
        bank: 'Customer Bank',
      },
    },
  })
  createdDocs.transactions.push(txn.id)
  return txn
}

/**
 * Helper to update order item status
 */
async function updateOrderItemStatus(
  orderId: string,
  itemIndex: number,
  newStatus: ShippingStatus,
) {
  const order = await payload.findByID({ collection: 'orders', id: orderId })
  const items = [...(order.items as Array<{ shippingStatus: string }>)]
  items[itemIndex] = { ...items[itemIndex], shippingStatus: newStatus }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (payload.update as any)({
    collection: 'orders',
    id: orderId,
    data: { items },
  })
}

/**
 * Helper to get refund transactions for an order
 */
async function getRefundTransactions(orderId: string, customerId?: string) {
  const where: Record<string, unknown> = {
    and: [
      { order: { equals: orderId } },
      { type: { equals: 'refund' } },
    ],
  }

  if (customerId) {
    (where.and as Array<Record<string, unknown>>).push({ user: { equals: customerId } })
  }

  const result = await payload.find({
    collection: 'transactions',
    where,
  })
  return result.docs
}

/**
 * Helper to get shipping payment transactions for an order
 */
async function getShippingPaymentTransactions(orderId: string, sellerId?: string) {
  const where: Record<string, unknown> = {
    and: [
      { order: { equals: orderId } },
      { type: { equals: 'shipping_payment' } },
    ],
  }

  if (sellerId) {
    (where.and as Array<Record<string, unknown>>).push({ user: { equals: sellerId } })
  }

  const result = await payload.find({
    collection: 'transactions',
    where,
  })
  return result.docs
}

/**
 * Cleanup helper
 */
async function cleanupTestData() {
  // Delete transactions first (they reference orders and users)
  for (const id of createdDocs.transactions) {
    try {
      await payload.delete({ collection: 'transactions', id })
    } catch {
      // Ignore
    }
  }
  createdDocs.transactions = []

  for (const id of createdDocs.orders) {
    try {
      await payload.delete({ collection: 'orders', id })
    } catch {
      // Ignore
    }
  }
  createdDocs.orders = []

  for (const id of createdDocs.users) {
    try {
      await payload.delete({ collection: 'users', id })
    } catch {
      // Ignore
    }
  }
  createdDocs.users = []
}

describe('Refund Transaction Creation Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('Single Item Return with Buyer Protection', () => {
    it('creates refund for full item price + shipping when BP enabled', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ shopName: 'Test Shop' })

      // Create order with BP enabled
      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
      ])

      // Create deposit transaction (simulating payment)
      await createDepositTransaction(customer.id, order.id, 118) // 100 + 10 + 8

      // Return the item
      await updateOrderItemStatus(order.id, 0, 'returned')

      // Get refund transactions
      const refunds = await getRefundTransactions(order.id, customer.id)

      expect(refunds).toHaveLength(1)
      // Full refund with BP: item price (100) + shipping (10) = 110
      expect(refunds[0].amount).toBe(110)
      // No fees charged when BP enabled
      expect(refunds[0].fees).toBe(0)
      expect(refunds[0].status).toBe('pending')
      expect(refunds[0].type).toBe('refund')
    })

    it('creates shipping_payment for seller when all items returned with BP', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ shopName: 'Test Shop' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 15,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 123)

      // Return the item
      await updateOrderItemStatus(order.id, 0, 'returned')

      // Get shipping payment for seller
      const shippingPayments = await getShippingPaymentTransactions(order.id, seller.id)

      expect(shippingPayments).toHaveLength(1)
      expect(shippingPayments[0].amount).toBe(15) // Shipping fee
      expect(shippingPayments[0].type).toBe('shipping_payment')
      expect(shippingPayments[0].status).toBe('pending')
    })
  })

  describe('Single Item Return without Buyer Protection', () => {
    it('creates refund with transaction fee deducted when no BP', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ shopName: 'Test Shop' })

      // Create order without BP
      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          buyerProtection: false,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 110)

      // Return the item
      await updateOrderItemStatus(order.id, 0, 'returned')

      const refunds = await getRefundTransactions(order.id, customer.id)

      expect(refunds).toHaveLength(1)
      // Without BP: item price (100) - fee% - transfer fee (1)
      // Fee depends on site-settings refundTransactionFeeRate (default 5%, but may be configured)
      // At minimum, check that refund is less than item price
      expect(refunds[0].amount).toBeLessThan(100)
      expect(refunds[0].amount).toBeGreaterThan(90) // Should be reasonable
      // Fees should be non-zero when no BP
      expect(refunds[0].fees).toBeGreaterThan(0)
      expect(refunds[0].status).toBe('pending')
    })

    it('does NOT include shipping in refund when no BP', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ shopName: 'Test Shop' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 20, // Higher shipping to make it obvious
          buyerProtection: false,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 120)

      await updateOrderItemStatus(order.id, 0, 'returned')

      const refunds = await getRefundTransactions(order.id, customer.id)

      // Refund should be based on item price only, not including shipping
      // Even though shipping was 20, refund is calculated from item price (100) minus fees
      expect(refunds[0].amount).toBeLessThan(100)
      expect(refunds[0].amount).toBeGreaterThan(90)
    })
  })

  describe('Item Not Available', () => {
    it('creates refund when item marked as not_available', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ shopName: 'Test Shop' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 80,
          originalPrice: 60,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 6,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 96)

      // Mark as not available
      await updateOrderItemStatus(order.id, 0, 'not_available')

      const refunds = await getRefundTransactions(order.id, customer.id)

      expect(refunds).toHaveLength(1)
      // Full refund with BP: 80 + 10 = 90
      expect(refunds[0].amount).toBe(90)
      expect(refunds[0].fees).toBe(0)
    })
  })

  describe('Multiple Items - Partial Return', () => {
    it('creates refund only for returned items', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ shopName: 'Test Shop' })

      // Two items, same seller
      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
        {
          seller: seller.id,
          price: 50,
          originalPrice: 40,
          shippingFee: 0,
          buyerProtection: true,
          buyerProtectionFee: 4,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 172)

      // Return only the first item, deliver the second
      await updateOrderItemStatus(order.id, 0, 'returned')
      await updateOrderItemStatus(order.id, 1, 'delivered')

      const refunds = await getRefundTransactions(order.id, customer.id)

      // Only one refund for the returned item
      expect(refunds).toHaveLength(1)
      // First item refund with BP: 100 + 10 = 110
      expect(refunds[0].amount).toBe(110)
    })

    it('does NOT create shipping_payment when only some items returned', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ shopName: 'Test Shop' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
        {
          seller: seller.id,
          price: 50,
          originalPrice: 40,
          shippingFee: 0,
          buyerProtection: true,
          buyerProtectionFee: 4,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 172)

      // Return first, deliver second
      await updateOrderItemStatus(order.id, 0, 'returned')
      await updateOrderItemStatus(order.id, 1, 'delivered')

      const shippingPayments = await getShippingPaymentTransactions(order.id, seller.id)

      // No shipping_payment because not ALL seller items are returned
      // Shipping will be included in order_payment when item is delivered
      expect(shippingPayments).toHaveLength(0)
    })

    it('creates shipping_payment when ALL seller items are returned', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ shopName: 'Test Shop' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10, // Shipping on first item
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
        {
          seller: seller.id,
          price: 50,
          originalPrice: 40,
          shippingFee: 0,
          buyerProtection: true,
          buyerProtectionFee: 4,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 172)

      // Return both items
      await updateOrderItemStatus(order.id, 0, 'returned')
      await updateOrderItemStatus(order.id, 1, 'returned')

      const shippingPayments = await getShippingPaymentTransactions(order.id, seller.id)

      // Shipping payment created since ALL seller items returned
      expect(shippingPayments).toHaveLength(1)
      expect(shippingPayments[0].amount).toBe(10) // Shipping fee
    })
  })

  describe('Multi-Seller Order Returns', () => {
    it('creates separate refunds per item returned', async () => {
      const customer = await createTestUser()
      const seller1 = await createTestUser({ shopName: 'Shop 1' })
      const seller2 = await createTestUser({ shopName: 'Shop 2' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller1.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
        {
          seller: seller2.id,
          price: 60,
          originalPrice: 50,
          shippingFee: 8,
          buyerProtection: true,
          buyerProtectionFee: 5,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 191)

      // Return both items
      await updateOrderItemStatus(order.id, 0, 'returned')
      await updateOrderItemStatus(order.id, 1, 'returned')

      const refunds = await getRefundTransactions(order.id, customer.id)

      expect(refunds).toHaveLength(2)

      // Check refund amounts (order might vary)
      const refundAmounts = refunds.map(r => r.amount).sort((a, b) => (a as number) - (b as number))
      // Seller 2 item: 60 + 8 = 68
      // Seller 1 item: 100 + 10 = 110
      expect(refundAmounts).toEqual([68, 110])
    })

    it('creates shipping_payment for each seller with all items returned', async () => {
      const customer = await createTestUser()
      const seller1 = await createTestUser({ shopName: 'Shop 1' })
      const seller2 = await createTestUser({ shopName: 'Shop 2' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller1.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
        {
          seller: seller2.id,
          price: 60,
          originalPrice: 50,
          shippingFee: 15,
          buyerProtection: true,
          buyerProtectionFee: 5,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 198)

      // Return both
      await updateOrderItemStatus(order.id, 0, 'returned')
      await updateOrderItemStatus(order.id, 1, 'returned')

      const seller1ShippingPayments = await getShippingPaymentTransactions(order.id, seller1.id)
      const seller2ShippingPayments = await getShippingPaymentTransactions(order.id, seller2.id)

      expect(seller1ShippingPayments).toHaveLength(1)
      expect(seller1ShippingPayments[0].amount).toBe(10)

      expect(seller2ShippingPayments).toHaveLength(1)
      expect(seller2ShippingPayments[0].amount).toBe(15)
    })

    it('only creates shipping_payment for seller with ALL items returned', async () => {
      const customer = await createTestUser()
      const seller1 = await createTestUser({ shopName: 'Shop 1' })
      const seller2 = await createTestUser({ shopName: 'Shop 2' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller1.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
        {
          seller: seller2.id,
          price: 60,
          originalPrice: 50,
          shippingFee: 15,
          buyerProtection: true,
          buyerProtectionFee: 5,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 198)

      // Return seller1 item, deliver seller2 item
      await updateOrderItemStatus(order.id, 0, 'returned')
      await updateOrderItemStatus(order.id, 1, 'delivered')

      const seller1ShippingPayments = await getShippingPaymentTransactions(order.id, seller1.id)
      const seller2ShippingPayments = await getShippingPaymentTransactions(order.id, seller2.id)

      // Seller1 gets shipping payment (all their items returned)
      expect(seller1ShippingPayments).toHaveLength(1)
      expect(seller1ShippingPayments[0].amount).toBe(10)

      // Seller2 does NOT get shipping_payment (item delivered, shipping in order_payment)
      expect(seller2ShippingPayments).toHaveLength(0)
    })
  })

  describe('Edge Cases', () => {
    it('does NOT create duplicate refund if item status changes twice', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ shopName: 'Test Shop' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 118)

      // Return the item
      await updateOrderItemStatus(order.id, 0, 'returned')

      // Try to update again (simulate edge case)
      const orderDoc = await payload.findByID({ collection: 'orders', id: order.id })
      const items = [...(orderDoc.items as Array<{ shippingStatus: string }>)]
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (payload.update as any)({
        collection: 'orders',
        id: order.id,
        data: { items }, // Same data, triggering hook again
      })

      const refunds = await getRefundTransactions(order.id, customer.id)

      // Should still only have one refund
      expect(refunds).toHaveLength(1)
    })

    it('does NOT create refund for delivered items', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ shopName: 'Test Shop' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 118)

      // Deliver (not return)
      await updateOrderItemStatus(order.id, 0, 'delivered')

      const refunds = await getRefundTransactions(order.id, customer.id)

      expect(refunds).toHaveLength(0)
    })

    it('does NOT create refund for cancelled items', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ shopName: 'Test Shop' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
      ])

      await createDepositTransaction(customer.id, order.id, 118)

      // Cancel (not return)
      await updateOrderItemStatus(order.id, 0, 'cancelled')

      const refunds = await getRefundTransactions(order.id, customer.id)

      // Cancelled items don't trigger refund (different flow)
      expect(refunds).toHaveLength(0)
    })
  })
})
