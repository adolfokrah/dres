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
 * Helper to create a test user (seller)
 */
async function createTestUser(overrides: { shopName?: string } = {}) {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (payload.create as any)({
    collection: 'users',
    disableVerificationEmail: true,
    data: {
      email: `payout-test-${uniqueId}@test.com`,
      password: 'testpassword123',
      firstName: `PayoutTest${uniqueId}`,
      lastName: 'User',
      role: 'user',
      shopName: overrides.shopName,
      username: `payouttest${uniqueId.replace(/-/g, '')}`,
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
 * Helper to get seller's order_payment transaction
 */
async function getSellerOrderPayment(orderId: string, sellerId: string) {
  const result = await payload.find({
    collection: 'transactions',
    where: {
      and: [
        { order: { equals: orderId } },
        { type: { equals: 'order_payment' } },
        { user: { equals: sellerId } },
        { status: { in: ['pending', 'completed'] } },
      ],
    },
    limit: 1,
  })
  return result.docs[0] || null
}

/**
 * Cleanup helper
 */
async function cleanupTestData() {
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

describe('Seller Payout Calculation Tests', () => {
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

  describe('Single Item Delivery', () => {
    it('creates order_payment with correct amount when item is delivered', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ shopName: 'Test Shop' })

      // Create order with one item
      // Selling price: 100, Original price: 80, Shipping: 10
      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          shippingStatus: 'placed',
        },
      ])

      // Update item to delivered
      await updateOrderItemStatus(order.id, 0, 'delivered')

      // Get seller's order_payment transaction
      const orderPayment = await getSellerOrderPayment(order.id, seller.id)

      expect(orderPayment).not.toBeNull()
      // Seller payout = originalPrice (80) + shippingFee (10) = 90
      expect(orderPayment?.amount).toBe(90)
      // Platform fees = sellingPrice (100) - originalPrice (80) = 20
      expect(orderPayment?.fees).toBe(20)
      expect(orderPayment?.type).toBe('order_payment')
      expect(orderPayment?.status).toBe('pending') // Becomes 'completed' after 6 hours via cron job
    })

    it('calculates platform fees as selling price minus original price', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      // Selling price: 150, Original price: 100 (50% markup)
      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 150,
          originalPrice: 100,
          shippingFee: 15,
          shippingStatus: 'placed',
        },
      ])

      await updateOrderItemStatus(order.id, 0, 'delivered')

      const orderPayment = await getSellerOrderPayment(order.id, seller.id)

      // Seller gets: originalPrice (100) + shipping (15) = 115
      expect(orderPayment?.amount).toBe(115)
      // Platform keeps: sellingPrice (150) - originalPrice (100) = 50
      expect(orderPayment?.fees).toBe(50)
    })
  })

  describe('Multiple Items Same Seller', () => {
    it('creates single order_payment for all delivered items from same seller', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      // Two items from same seller
      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10, // Only first item has shipping
          shippingStatus: 'placed',
        },
        {
          seller: seller.id,
          price: 50,
          originalPrice: 40,
          shippingFee: 0,
          shippingStatus: 'placed',
        },
      ])

      // Deliver both items
      await updateOrderItemStatus(order.id, 0, 'delivered')
      await updateOrderItemStatus(order.id, 1, 'delivered')

      const orderPayment = await getSellerOrderPayment(order.id, seller.id)

      expect(orderPayment).not.toBeNull()
      // Seller payout = originalPrices (80 + 40) + ONE shipping (10) = 130
      expect(orderPayment?.amount).toBe(130)
      // Platform fees = (100 - 80) + (50 - 40) = 20 + 10 = 30
      expect(orderPayment?.fees).toBe(30)
    })

    it('only includes ONE shipping fee regardless of item count', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      // Three items, shipping fee on first item only
      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 15,
          shippingStatus: 'placed',
        },
        {
          seller: seller.id,
          price: 60,
          originalPrice: 50,
          shippingFee: 0,
          shippingStatus: 'placed',
        },
        {
          seller: seller.id,
          price: 40,
          originalPrice: 30,
          shippingFee: 0,
          shippingStatus: 'placed',
        },
      ])

      // Deliver all items
      await updateOrderItemStatus(order.id, 0, 'delivered')
      await updateOrderItemStatus(order.id, 1, 'delivered')
      await updateOrderItemStatus(order.id, 2, 'delivered')

      const orderPayment = await getSellerOrderPayment(order.id, seller.id)

      // Seller payout = (80 + 50 + 30) + 15 shipping = 175
      expect(orderPayment?.amount).toBe(175)
      // Platform fees = (100-80) + (60-50) + (40-30) = 20 + 10 + 10 = 40
      expect(orderPayment?.fees).toBe(40)
    })
  })

  describe('Partial Delivery (Some Items Returned)', () => {
    it('pays seller for delivered items WITHOUT shipping when any item is returned (penalty)', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          shippingStatus: 'placed',
        },
        {
          seller: seller.id,
          price: 50,
          originalPrice: 40,
          shippingFee: 0,
          shippingStatus: 'placed',
        },
      ])

      // First item delivered, second returned
      await updateOrderItemStatus(order.id, 0, 'delivered')
      await updateOrderItemStatus(order.id, 1, 'returned')

      const orderPayment = await getSellerOrderPayment(order.id, seller.id)

      expect(orderPayment).not.toBeNull()
      // Seller payout = only delivered item (80), NO shipping (penalty for return)
      // NOT including returned item's originalPrice (40)
      expect(orderPayment?.amount).toBe(80)
      // Platform fees = only from delivered: 100 - 80 = 20
      expect(orderPayment?.fees).toBe(20)
    })

    it('does NOT include shipping when any item is returned (penalty)', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10, // Shipping on first item
          shippingStatus: 'placed',
        },
        {
          seller: seller.id,
          price: 50,
          originalPrice: 40,
          shippingFee: 0,
          shippingStatus: 'placed',
        },
      ])

      // First item (with shipping) returned, second delivered
      await updateOrderItemStatus(order.id, 0, 'returned')
      await updateOrderItemStatus(order.id, 1, 'delivered')

      const orderPayment = await getSellerOrderPayment(order.id, seller.id)

      expect(orderPayment).not.toBeNull()
      // Seller payout = delivered item (40), NO shipping (penalty for return)
      expect(orderPayment?.amount).toBe(40)
      expect(orderPayment?.fees).toBe(10) // 50 - 40
    })
  })

  describe('All Items Returned', () => {
    it('does NOT create order_payment when all items returned', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          shippingStatus: 'placed',
        },
      ])

      // Return the item
      await updateOrderItemStatus(order.id, 0, 'returned')

      const orderPayment = await getSellerOrderPayment(order.id, seller.id)

      // No order_payment should be created - seller gets nothing
      expect(orderPayment).toBeNull()
    })

    it('does NOT create order_payment when all items marked not_available', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          shippingStatus: 'placed',
        },
      ])

      // Mark as not available
      await updateOrderItemStatus(order.id, 0, 'not_available')

      const orderPayment = await getSellerOrderPayment(order.id, seller.id)

      expect(orderPayment).toBeNull()
    })
  })

  describe('Multi-Seller Orders', () => {
    it('creates separate order_payment for each seller', async () => {
      const customer = await createTestUser()
      const seller1 = await createTestUser({ shopName: 'Shop 1' })
      const seller2 = await createTestUser({ shopName: 'Shop 2' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller1.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          shippingStatus: 'placed',
        },
        {
          seller: seller2.id,
          price: 60,
          originalPrice: 50,
          shippingFee: 8,
          shippingStatus: 'placed',
        },
      ])

      // Deliver both items
      await updateOrderItemStatus(order.id, 0, 'delivered')
      await updateOrderItemStatus(order.id, 1, 'delivered')

      const seller1Payment = await getSellerOrderPayment(order.id, seller1.id)
      const seller2Payment = await getSellerOrderPayment(order.id, seller2.id)

      // Seller 1: originalPrice (80) + shipping (10) = 90
      expect(seller1Payment?.amount).toBe(90)
      expect(seller1Payment?.fees).toBe(20) // 100 - 80

      // Seller 2: originalPrice (50) + shipping (8) = 58
      expect(seller2Payment?.amount).toBe(58)
      expect(seller2Payment?.fees).toBe(10) // 60 - 50
    })

    it('only creates payment for seller with delivered items', async () => {
      const customer = await createTestUser()
      const seller1 = await createTestUser({ shopName: 'Shop 1' })
      const seller2 = await createTestUser({ shopName: 'Shop 2' })

      const order = await createTestOrder(customer.id, [
        {
          seller: seller1.id,
          price: 100,
          originalPrice: 80,
          shippingFee: 10,
          shippingStatus: 'placed',
        },
        {
          seller: seller2.id,
          price: 60,
          originalPrice: 50,
          shippingFee: 8,
          shippingStatus: 'placed',
        },
      ])

      // Seller 1 item delivered, Seller 2 item returned
      await updateOrderItemStatus(order.id, 0, 'delivered')
      await updateOrderItemStatus(order.id, 1, 'returned')

      const seller1Payment = await getSellerOrderPayment(order.id, seller1.id)
      const seller2Payment = await getSellerOrderPayment(order.id, seller2.id)

      // Seller 1 gets payment
      expect(seller1Payment?.amount).toBe(90)

      // Seller 2 gets nothing (all items returned)
      expect(seller2Payment).toBeNull()
    })
  })

  describe('Edge Cases', () => {
    it('handles zero platform fees when originalPrice equals selling price', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      // No markup - selling at cost
      const order = await createTestOrder(customer.id, [
        {
          seller: seller.id,
          price: 100,
          originalPrice: 100, // Same as selling price
          shippingFee: 10,
          shippingStatus: 'placed',
        },
      ])

      await updateOrderItemStatus(order.id, 0, 'delivered')

      const orderPayment = await getSellerOrderPayment(order.id, seller.id)

      expect(orderPayment?.amount).toBe(110) // 100 + 10 shipping
      expect(orderPayment?.fees).toBe(0) // No platform fee
    })
  })
})
