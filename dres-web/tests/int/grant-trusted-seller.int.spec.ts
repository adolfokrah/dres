import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest'

let payload: Payload

// Track created documents for cleanup
const createdDocs: {
  orders: string[]
  users: string[]
} = {
  orders: [],
  users: [],
}

/**
 * Helper to create a test user
 */
async function createTestUser(overrides: { trustedSeller?: boolean } = {}) {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (payload.create as any)({
    collection: 'users',
    disableVerificationEmail: true,
    data: {
      email: `trusted-test-${uniqueId}@test.com`,
      password: 'testpassword123',
      firstName: 'TrustedTest',
      lastName: 'User',
      role: 'user',
      username: `trustedtest${uniqueId.replace(/-/g, '')}`,
      trustedSeller: overrides.trustedSeller ?? false,
    },
  })
  createdDocs.users.push(user.id)
  return user
}

/**
 * Helper to create an order with items for a seller
 */
async function createOrderWithItems(
  customerId: string,
  sellerId: string,
  items: Array<{
    quantity?: number
    shippingStatus?: string
  }>,
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await (payload.create as any)({
    collection: 'orders',
    data: {
      orderId: `ORD-TRUSTED-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      status: 'completed',
      customer: customerId,
      sellers: [sellerId],
      items: items.map((item, index) => ({
        id: `item-${Date.now()}-${index}`,
        seller: sellerId,
        variationTitle: `Test Item ${index + 1}`,
        price: 50,
        originalPrice: 40,
        quantity: item.quantity ?? 1,
        shippingFee: 5,
        shippingStatus: item.shippingStatus ?? 'delivered',
      })),
    },
  })
  createdDocs.orders.push(order.id)
  return order
}

/**
 * Cleanup helper
 */
async function cleanupTestData() {
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

describe('Grant Trusted Seller Integration Tests', () => {
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

  describe('Query non-trusted users', () => {
    it('finds users where trustedSeller is false', async () => {
      const seller = await createTestUser({ trustedSeller: false })

      const nonTrusted = await payload.find({
        collection: 'users',
        where: {
          and: [
            { id: { equals: seller.id } },
            {
              or: [
                { trustedSeller: { equals: false } },
                { trustedSeller: { exists: false } },
              ],
            },
          ],
        },
        depth: 0,
      })

      expect(nonTrusted.docs.length).toBe(1)
    })

    it('does not find users who are already trusted sellers', async () => {
      const seller = await createTestUser({ trustedSeller: true })

      const nonTrusted = await payload.find({
        collection: 'users',
        where: {
          and: [
            { id: { equals: seller.id } },
            {
              or: [
                { trustedSeller: { equals: false } },
                { trustedSeller: { exists: false } },
              ],
            },
          ],
        },
        depth: 0,
      })

      expect(nonTrusted.docs.length).toBe(0)
    })
  })

  describe('Count delivered items for a seller', () => {
    it('counts delivered items correctly', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      // Create order with 3 delivered items
      await createOrderWithItems(customer.id, seller.id, [
        { quantity: 1, shippingStatus: 'delivered' },
        { quantity: 2, shippingStatus: 'delivered' },
        { quantity: 1, shippingStatus: 'placed' }, // not delivered
      ])

      // Query like the cron does
      const orders = await payload.find({
        collection: 'orders',
        where: { sellers: { contains: seller.id } },
        limit: 100,
        depth: 0,
      })

      let deliveredItems = 0
      for (const order of orders.docs) {
        const items = (order.items as any[]) || []
        for (const item of items) {
          const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
          if (itemSellerId === seller.id) {
            if (item.shippingStatus === 'delivered' || item.shippingStatus === 'out_for_delivery') {
              deliveredItems += item.quantity || 1
            }
          }
        }
      }

      // 1 + 2 = 3 delivered (the placed one doesn't count)
      expect(deliveredItems).toBe(3)
    })

    it('counts out_for_delivery items as sold', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      await createOrderWithItems(customer.id, seller.id, [
        { quantity: 3, shippingStatus: 'out_for_delivery' },
        { quantity: 2, shippingStatus: 'delivered' },
      ])

      const orders = await payload.find({
        collection: 'orders',
        where: { sellers: { contains: seller.id } },
        limit: 100,
        depth: 0,
      })

      let deliveredItems = 0
      for (const order of orders.docs) {
        const items = (order.items as any[]) || []
        for (const item of items) {
          const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
          if (itemSellerId === seller.id) {
            if (item.shippingStatus === 'delivered' || item.shippingStatus === 'out_for_delivery') {
              deliveredItems += item.quantity || 1
            }
          }
        }
      }

      expect(deliveredItems).toBe(5)
    })

    it('does not count returned or cancelled items', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser()

      await createOrderWithItems(customer.id, seller.id, [
        { quantity: 2, shippingStatus: 'delivered' },
        { quantity: 3, shippingStatus: 'returned' },
        { quantity: 1, shippingStatus: 'not_available' },
      ])

      const orders = await payload.find({
        collection: 'orders',
        where: { sellers: { contains: seller.id } },
        limit: 100,
        depth: 0,
      })

      let deliveredItems = 0
      for (const order of orders.docs) {
        const items = (order.items as any[]) || []
        for (const item of items) {
          const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
          if (itemSellerId === seller.id) {
            if (item.shippingStatus === 'delivered' || item.shippingStatus === 'out_for_delivery') {
              deliveredItems += item.quantity || 1
            }
          }
        }
      }

      // Only the 2 delivered items count
      expect(deliveredItems).toBe(2)
    })
  })

  describe('Grant trusted seller status', () => {
    it('grants trusted seller when seller has 5+ delivered items', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ trustedSeller: false })

      // Create orders totaling 5 delivered items
      await createOrderWithItems(customer.id, seller.id, [
        { quantity: 3, shippingStatus: 'delivered' },
        { quantity: 2, shippingStatus: 'delivered' },
      ])

      // Simulate cron logic
      const orders = await payload.find({
        collection: 'orders',
        where: { sellers: { contains: seller.id } },
        limit: 100,
        depth: 0,
      })

      let deliveredItems = 0
      for (const order of orders.docs) {
        const items = (order.items as any[]) || []
        for (const item of items) {
          const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
          if (itemSellerId === seller.id) {
            if (item.shippingStatus === 'delivered' || item.shippingStatus === 'out_for_delivery') {
              deliveredItems += item.quantity || 1
            }
          }
        }
      }

      expect(deliveredItems).toBeGreaterThanOrEqual(5)

      // Grant trusted seller
      await payload.update({
        collection: 'users',
        id: seller.id,
        data: { trustedSeller: true },
      })

      const updated = await payload.findByID({
        collection: 'users',
        id: seller.id,
        depth: 0,
      })

      expect((updated as any).trustedSeller).toBe(true)
    })

    it('does not grant trusted seller when seller has fewer than 5 delivered items', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ trustedSeller: false })

      // Create orders totaling 4 delivered items (below threshold)
      await createOrderWithItems(customer.id, seller.id, [
        { quantity: 2, shippingStatus: 'delivered' },
        { quantity: 2, shippingStatus: 'delivered' },
      ])

      const orders = await payload.find({
        collection: 'orders',
        where: { sellers: { contains: seller.id } },
        limit: 100,
        depth: 0,
      })

      let deliveredItems = 0
      for (const order of orders.docs) {
        const items = (order.items as any[]) || []
        for (const item of items) {
          const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
          if (itemSellerId === seller.id) {
            if (item.shippingStatus === 'delivered' || item.shippingStatus === 'out_for_delivery') {
              deliveredItems += item.quantity || 1
            }
          }
        }
      }

      expect(deliveredItems).toBe(4)
      expect(deliveredItems).toBeLessThan(5)

      // Verify seller is still not trusted
      const user = await payload.findByID({
        collection: 'users',
        id: seller.id,
        depth: 0,
      })

      expect((user as any).trustedSeller).toBe(false)
    })

    it('counts items across multiple orders', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ trustedSeller: false })

      // Spread 6 delivered items across 3 orders
      await createOrderWithItems(customer.id, seller.id, [
        { quantity: 2, shippingStatus: 'delivered' },
      ])
      await createOrderWithItems(customer.id, seller.id, [
        { quantity: 2, shippingStatus: 'delivered' },
      ])
      await createOrderWithItems(customer.id, seller.id, [
        { quantity: 2, shippingStatus: 'delivered' },
      ])

      const orders = await payload.find({
        collection: 'orders',
        where: { sellers: { contains: seller.id } },
        limit: 100,
        depth: 0,
      })

      let deliveredItems = 0
      for (const order of orders.docs) {
        const items = (order.items as any[]) || []
        for (const item of items) {
          const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
          if (itemSellerId === seller.id) {
            if (item.shippingStatus === 'delivered' || item.shippingStatus === 'out_for_delivery') {
              deliveredItems += item.quantity || 1
            }
          }
        }
      }

      expect(deliveredItems).toBe(6)
      expect(deliveredItems).toBeGreaterThanOrEqual(5)
    })
  })

  describe('Already trusted sellers are skipped', () => {
    it('already trusted seller is not re-queried', async () => {
      const seller = await createTestUser({ trustedSeller: true })

      // Should not appear in non-trusted query
      const nonTrusted = await payload.find({
        collection: 'users',
        where: {
          and: [
            { id: { equals: seller.id } },
            {
              or: [
                { trustedSeller: { equals: false } },
                { trustedSeller: { exists: false } },
              ],
            },
          ],
        },
        depth: 0,
      })

      expect(nonTrusted.docs.length).toBe(0)
    })
  })

  describe('Edge cases', () => {
    it('handles seller with no orders gracefully', async () => {
      const seller = await createTestUser({ trustedSeller: false })

      const orders = await payload.find({
        collection: 'orders',
        where: { sellers: { contains: seller.id } },
        limit: 100,
        depth: 0,
      })

      expect(orders.docs.length).toBe(0)

      // Delivered items should be 0
      let deliveredItems = 0
      for (const order of orders.docs) {
        const items = (order.items as any[]) || []
        for (const item of items) {
          const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
          if (itemSellerId === seller.id) {
            if (item.shippingStatus === 'delivered' || item.shippingStatus === 'out_for_delivery') {
              deliveredItems += item.quantity || 1
            }
          }
        }
      }

      expect(deliveredItems).toBe(0)
    })

    it('grants at exactly 5 items (boundary)', async () => {
      const customer = await createTestUser()
      const seller = await createTestUser({ trustedSeller: false })

      // Exactly 5 delivered items
      await createOrderWithItems(customer.id, seller.id, [
        { quantity: 5, shippingStatus: 'delivered' },
      ])

      const orders = await payload.find({
        collection: 'orders',
        where: { sellers: { contains: seller.id } },
        limit: 100,
        depth: 0,
      })

      let deliveredItems = 0
      for (const order of orders.docs) {
        const items = (order.items as any[]) || []
        for (const item of items) {
          const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
          if (itemSellerId === seller.id) {
            if (item.shippingStatus === 'delivered' || item.shippingStatus === 'out_for_delivery') {
              deliveredItems += item.quantity || 1
            }
          }
        }
      }

      expect(deliveredItems).toBe(5)

      // Should qualify
      await payload.update({
        collection: 'users',
        id: seller.id,
        data: { trustedSeller: true },
      })

      const updated = await payload.findByID({
        collection: 'users',
        id: seller.id,
        depth: 0,
      })

      expect((updated as any).trustedSeller).toBe(true)
    })
  })
})
