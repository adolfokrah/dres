import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest'
import { calculateOrderCommission } from '@/utilities/calculateOrderCommission'

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
async function createTestUser(email?: string) {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (payload.create as any)({
    collection: 'users',
    disableVerificationEmail: true,
    data: {
      email: email ?? `comm-test-${uniqueId}@test.com`,
      password: 'testpassword123',
      firstName: `CommTest${uniqueId}`,
      lastName: 'User',
      role: 'user',
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
    originalPrice?: number
    shippingFee?: number
    buyerProtection?: boolean
    buyerProtectionFee?: number
    shippingStatus?: ShippingStatus
  }>,
  options: { discountAmount?: number; pointsDiscount?: number } = {},
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
        originalPrice: item.originalPrice ?? item.price * 0.8,
        quantity: 1,
        shippingFee: item.shippingFee ?? 0,
        buyerProtection: item.buyerProtection ?? false,
        buyerProtectionFee: item.buyerProtectionFee ?? 0,
        shippingStatus: item.shippingStatus ?? 'placed',
      })),
      discountAmount: options.discountAmount ?? 0,
      pointsDiscount: options.pointsDiscount ?? 0,
    },
  })
  createdDocs.orders.push(order.id)
  return order
}

/**
 * Helper to create a test transaction
 */
async function createTestTransaction(
  userId: string,
  orderId: string,
  data: {
    type: 'deposit' | 'refund' | 'order_payment' | 'transfer' | 'shipping_payment'
    amount: number
    fees?: number
    paystackFees?: number
    status?: 'pending' | 'completed' | 'cancelled' | 'in_progress'
  },
) {
  const txn = await payload.create({
    collection: 'transactions',
    data: {
      transactionId: `TXN-TEST-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: data.type,
      status: data.status ?? 'completed',
      user: userId,
      order: orderId,
      amount: data.amount,
      fees: data.fees ?? 0,
      paystackFees: data.paystackFees ?? 0,
    },
  })
  createdDocs.transactions.push(txn.id)
  return txn
}

/**
 * Cleanup helper - deletes all created test documents
 */
async function cleanupTestData() {
  // Delete in reverse order of dependencies
  for (const id of createdDocs.transactions) {
    try {
      await payload.delete({ collection: 'transactions', id })
    } catch {
      // Ignore errors if already deleted
    }
  }
  createdDocs.transactions = []

  for (const id of createdDocs.orders) {
    try {
      await payload.delete({ collection: 'orders', id })
    } catch {
      // Ignore errors if already deleted
    }
  }
  createdDocs.orders = []

  for (const id of createdDocs.users) {
    try {
      await payload.delete({ collection: 'users', id })
    } catch {
      // Ignore errors if already deleted
    }
  }
  createdDocs.users = []
}

describe('Commission Calculation Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterEach(async () => {
    // Clean up after each test to ensure isolation
    await cleanupTestData()
  })

  afterAll(async () => {
    // Final cleanup
    await cleanupTestData()
  })

  describe('Basic Commission Calculation', () => {
    it('calculates commission for a simple delivered order', async () => {
      // Create test user (acts as both customer and seller for simplicity)
      const user = await createTestUser()

      // Create order with one delivered item
      const order = await createTestOrder(user.id, [
        {
          seller: user.id,
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'delivered',
        },
      ])

      // Create deposit transaction
      await createTestTransaction(user.id, order.id, {
        type: 'deposit',
        amount: 118, // 100 + 10 + 8
        fees: 5,
        paystackFees: 1.5,
      })

      // Calculate commission
      const result = await calculateOrderCommission(payload, order.id)

      expect(result).not.toBeNull()
      expect(result?.totalTransactionFees).toBe(5)
      expect(result?.totalPaystackFees).toBe(1.5)
      expect(result?.totalBuyerProtectionFees).toBe(8)
      expect(result?.buyerProtectionCosts).toBe(0) // Delivered, no BP costs
      expect(result?.totalCommission).toBe(11.5) // 5 - 1.5 + 8
    })

    it('calculates commission with discounts applied', async () => {
      const user = await createTestUser()

      const order = await createTestOrder(
        user.id,
        [{ seller: user.id, price: 100, shippingStatus: 'delivered' }],
        { discountAmount: 10, pointsDiscount: 5 },
      )

      await createTestTransaction(user.id, order.id, {
        type: 'deposit',
        amount: 85,
        fees: 5,
        paystackFees: 1.5,
      })

      const result = await calculateOrderCommission(payload, order.id)

      expect(result?.discountAmount).toBe(10)
      expect(result?.pointsDiscount).toBe(5)
      expect(result?.totalCommission).toBe(-11.5) // 5 - 1.5 - 10 - 5
    })
  })

  describe('Return Scenarios', () => {
    it('calculates BP costs when all seller items are returned', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      // Create order with all items returned
      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'returned',
        },
      ])

      // Create deposit and refund transactions
      await createTestTransaction(customer.id, order.id, {
        type: 'deposit',
        amount: 118,
        fees: 5,
        paystackFees: 1.5,
      })

      await createTestTransaction(customer.id, order.id, {
        type: 'refund',
        amount: 100,
        fees: 0,
        paystackFees: 1,
      })

      const result = await calculateOrderCommission(payload, order.id)

      expect(result?.buyerProtectionCosts).toBe(10) // Shipping fee as BP cost
      expect(result?.totalBuyerProtectionFees).toBe(8)
      // Commission = 5 - 2.5 + (8 - 10) = 0.5
      expect(result?.totalCommission).toBe(0.5)
    })

    it('does NOT charge BP costs for partial returns', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      // Create order with one delivered, one returned (same seller)
      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'delivered',
        },
        {
          seller: seller.id,
          price: 50,
          shippingFee: 0,
          buyerProtection: true,
          buyerProtectionFee: 4,
          shippingStatus: 'returned',
        },
      ])

      await createTestTransaction(customer.id, order.id, {
        type: 'deposit',
        amount: 172,
        fees: 10,
        paystackFees: 2,
      })

      const result = await calculateOrderCommission(payload, order.id)

      // BP costs = 0 because not ALL seller items returned
      expect(result?.buyerProtectionCosts).toBe(0)
      expect(result?.totalBuyerProtectionFees).toBe(12) // 8 + 4
    })
  })

  describe('Multi-Seller Orders', () => {
    it('calculates BP costs independently per seller', async () => {
      const customer = await createTestUser()
      const seller1 = await createTestUser()
      const seller2 = await createTestUser()

      // Seller 1: all returned, Seller 2: delivered
      const order = await createTestOrder(customer.id, [
        {
          seller: seller1.id,
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'returned',
        },
        {
          seller: seller2.id,
          price: 80,
          shippingFee: 8,
          buyerProtection: true,
          buyerProtectionFee: 6,
          shippingStatus: 'delivered',
        },
      ])

      await createTestTransaction(customer.id, order.id, {
        type: 'deposit',
        amount: 212,
        fees: 15,
        paystackFees: 3,
      })

      await createTestTransaction(customer.id, order.id, {
        type: 'refund',
        amount: 100,
        fees: 0,
        paystackFees: 1,
      })

      const result = await calculateOrderCommission(payload, order.id)

      // BP costs = 10 (only seller1's shipping, all their items returned)
      expect(result?.buyerProtectionCosts).toBe(10)
      expect(result?.totalBuyerProtectionFees).toBe(14) // 8 + 6
    })
  })

  describe('Edge Cases', () => {
    it('throws NotFound for non-existent order', async () => {
      await expect(
        calculateOrderCommission(payload, '000000000000000000000000'),
      ).rejects.toThrow('Not Found')
    })

    it('handles order with no transactions', async () => {
      const user = await createTestUser()

      const order = await createTestOrder(user.id, [
        {
          seller: user.id,
          price: 100,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
      ])

      const result = await calculateOrderCommission(payload, order.id)

      expect(result?.totalTransactionFees).toBe(0)
      expect(result?.totalPaystackFees).toBe(0)
      expect(result?.totalBuyerProtectionFees).toBe(8)
      expect(result?.totalCommission).toBe(8) // Just BP fees
    })

    it('only counts completed transactions', async () => {
      const user = await createTestUser()

      const order = await createTestOrder(user.id, [
        { seller: user.id, price: 100, shippingStatus: 'delivered' },
      ])

      // Completed transaction
      await createTestTransaction(user.id, order.id, {
        type: 'deposit',
        amount: 100,
        fees: 5,
        paystackFees: 1.5,
        status: 'completed',
      })

      // Pending transaction (should be ignored)
      await createTestTransaction(user.id, order.id, {
        type: 'refund',
        amount: 50,
        fees: 10,
        paystackFees: 5,
        status: 'pending',
      })

      const result = await calculateOrderCommission(payload, order.id)

      // Should only count the completed deposit
      expect(result?.totalTransactionFees).toBe(5)
      expect(result?.totalPaystackFees).toBe(1.5)
    })

    it('excludes shipping_payment fees from income', async () => {
      const user = await createTestUser()

      const order = await createTestOrder(user.id, [
        {
          seller: user.id,
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          shippingStatus: 'returned',
        },
      ])

      await createTestTransaction(user.id, order.id, {
        type: 'deposit',
        amount: 110,
        fees: 5,
        paystackFees: 1.5,
      })

      // Shipping payment (fees should NOT count as income)
      await createTestTransaction(user.id, order.id, {
        type: 'shipping_payment',
        amount: 10,
        fees: 10,
        paystackFees: 1,
      })

      const result = await calculateOrderCommission(payload, order.id)

      // shipping_payment fees (10) should NOT be in totalTransactionFees
      expect(result?.totalTransactionFees).toBe(5)
      // But its paystackFees (1) SHOULD be counted
      expect(result?.totalPaystackFees).toBe(2.5) // 1.5 + 1
    })
  })
})
