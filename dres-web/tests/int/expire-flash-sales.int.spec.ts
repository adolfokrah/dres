import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, afterEach, expect } from 'vitest'

let payload: Payload

// Track created documents for cleanup
const createdDocs: {
  skus: string[]
  variations: string[]
  styles: string[]
  users: string[]
} = {
  skus: [],
  variations: [],
  styles: [],
  users: [],
}

/**
 * Helper to create a test user (seller)
 */
async function createTestUser() {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (payload.create as any)({
    collection: 'users',
    disableVerificationEmail: true,
    data: {
      email: `flash-test-${uniqueId}@test.com`,
      password: 'testpassword123',
      firstName: 'FlashTest',
      lastName: 'User',
      role: 'admin',
      username: `flashtest${uniqueId.replace(/-/g, '')}`,
    },
  })
  createdDocs.users.push(user.id)
  return user
}

/**
 * Helper to create a style + variation (minimal, just enough to satisfy SKU requirements)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function createStyleAndVariation(seller: any) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const style = await (payload.create as any)({
    collection: 'styles',
    data: {
      title: `Flash Sale Test Style ${Date.now()}`,
      seller: seller.id,
      status: 'draft',
    },
    user: seller,
    overrideAccess: false,
  })
  createdDocs.styles.push(style.id)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const variation = await (payload.create as any)({
    collection: 'variations',
    data: {
      style: style.id,
      status: 'draft',
    },
  })
  createdDocs.variations.push(variation.id)

  return { style, variation }
}

/**
 * Helper to create a SKU with flash sale fields
 */
async function createTestSku(
  variationId: string,
  overrides: {
    price?: number
    compareAtPrice?: number | null
    flashSaleEnabled?: boolean
    flashSaleEndDate?: string | null
  } = {},
) {
  const uniqueSku = `SKU-TEST-${Date.now()}-${Math.random().toString(36).slice(2).toUpperCase()}`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sku = await (payload.create as any)({
    collection: 'skus',
    data: {
      sku: uniqueSku,
      variation: variationId,
      price: overrides.price ?? 50,
      compareAtPrice: overrides.compareAtPrice ?? null,
      flashSaleEnabled: overrides.flashSaleEnabled ?? false,
      flashSaleEndDate: overrides.flashSaleEndDate ?? null,
      stock: 10,
    },
  })
  createdDocs.skus.push(sku.id)
  return sku
}

/**
 * Cleanup helper
 */
async function cleanupTestData() {
  for (const id of createdDocs.skus) {
    try {
      await payload.delete({ collection: 'skus', id })
    } catch {
      // Ignore
    }
  }
  createdDocs.skus = []

  for (const id of createdDocs.variations) {
    try {
      await payload.delete({ collection: 'variations', id })
    } catch {
      // Ignore
    }
  }
  createdDocs.variations = []

  for (const id of createdDocs.styles) {
    try {
      await payload.delete({ collection: 'styles', id })
    } catch {
      // Ignore
    }
  }
  createdDocs.styles = []

  for (const id of createdDocs.users) {
    try {
      await payload.delete({ collection: 'users', id })
    } catch {
      // Ignore
    }
  }
  createdDocs.users = []
}

describe('Expire Flash Sales Integration Tests', () => {
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

  describe('Query expired flash sales', () => {
    it('finds SKUs with expired flash sale end dates', async () => {
      const user = await createTestUser()
      const { variation } = await createStyleAndVariation(user)

      // Create a SKU with an expired flash sale (1 hour ago)
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      await createTestSku(variation.id, {
        price: 50,
        compareAtPrice: 100,
        flashSaleEnabled: true,
        flashSaleEndDate: oneHourAgo.toISOString(),
      })

      // Query like the cron does
      const now = new Date().toISOString()
      const expiredSkus = await payload.find({
        collection: 'skus',
        where: {
          and: [
            { flashSaleEnabled: { equals: true } },
            { flashSaleEndDate: { less_than: now } },
          ],
        },
        depth: 0,
      })

      expect(expiredSkus.docs.length).toBeGreaterThanOrEqual(1)
      expect(expiredSkus.docs.every((doc) => doc.flashSaleEnabled === true)).toBe(true)
    })

    it('does not find SKUs with future flash sale end dates', async () => {
      const user = await createTestUser()
      const { variation } = await createStyleAndVariation(user)

      // Create a SKU with a future flash sale (1 day from now)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const sku = await createTestSku(variation.id, {
        price: 50,
        compareAtPrice: 100,
        flashSaleEnabled: true,
        flashSaleEndDate: tomorrow.toISOString(),
      })

      // Query like the cron does
      const now = new Date().toISOString()
      const expiredSkus = await payload.find({
        collection: 'skus',
        where: {
          and: [
            { flashSaleEnabled: { equals: true } },
            { flashSaleEndDate: { less_than: now } },
            { id: { equals: sku.id } },
          ],
        },
        depth: 0,
      })

      expect(expiredSkus.docs.length).toBe(0)
    })

    it('does not find SKUs where flashSaleEnabled is false', async () => {
      const user = await createTestUser()
      const { variation } = await createStyleAndVariation(user)

      // Create a SKU with flash sale disabled but with a past date
      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      const sku = await createTestSku(variation.id, {
        price: 50,
        compareAtPrice: 100,
        flashSaleEnabled: false,
        flashSaleEndDate: oneHourAgo.toISOString(),
      })

      const now = new Date().toISOString()
      const expiredSkus = await payload.find({
        collection: 'skus',
        where: {
          and: [
            { flashSaleEnabled: { equals: true } },
            { flashSaleEndDate: { less_than: now } },
            { id: { equals: sku.id } },
          ],
        },
        depth: 0,
      })

      expect(expiredSkus.docs.length).toBe(0)
    })
  })

  describe('Expire flash sale updates', () => {
    it('restores price to compareAtPrice and clears flash sale fields', async () => {
      const user = await createTestUser()
      const { variation } = await createStyleAndVariation(user)

      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      const sku = await createTestSku(variation.id, {
        price: 50, // discounted price during flash sale
        compareAtPrice: 100, // original price
        flashSaleEnabled: true,
        flashSaleEndDate: oneHourAgo.toISOString(),
      })

      // Simulate the cron's update logic
      const originalPrice = sku.compareAtPrice as number

      await payload.update({
        collection: 'skus',
        id: sku.id,
        data: {
          price: originalPrice,
          compareAtPrice: null,
          flashSaleEnabled: false,
          flashSaleEndDate: null,
        },
      })

      // Verify the update
      const updated = await payload.findByID({
        collection: 'skus',
        id: sku.id,
        depth: 0,
      })

      expect(updated.price).toBe(100) // price restored to original
      expect(updated.compareAtPrice).toBeNull() // compare price cleared
      expect(updated.flashSaleEnabled).toBe(false) // flash sale disabled
      expect(updated.flashSaleEndDate).toBeNull() // end date cleared
    })

    it('handles SKU without compareAtPrice gracefully', async () => {
      const user = await createTestUser()
      const { variation } = await createStyleAndVariation(user)

      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      const sku = await createTestSku(variation.id, {
        price: 50,
        compareAtPrice: null,
        flashSaleEnabled: true,
        flashSaleEndDate: oneHourAgo.toISOString(),
      })

      // Simulate the cron's update logic (no compareAtPrice to restore)
      const originalPrice = sku.compareAtPrice as number | undefined

      await payload.update({
        collection: 'skus',
        id: sku.id,
        data: {
          ...(originalPrice ? { price: originalPrice } : {}),
          compareAtPrice: null,
          flashSaleEnabled: false,
          flashSaleEndDate: null,
        },
      })

      const updated = await payload.findByID({
        collection: 'skus',
        id: sku.id,
        depth: 0,
      })

      expect(updated.price).toBe(50) // price unchanged (no compare price to restore)
      expect(updated.compareAtPrice).toBeNull()
      expect(updated.flashSaleEnabled).toBe(false)
      expect(updated.flashSaleEndDate).toBeNull()
    })

    it('sellingPrice is recalculated after price restoration', async () => {
      const user = await createTestUser()
      const { variation } = await createStyleAndVariation(user)

      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)

      const sku = await createTestSku(variation.id, {
        price: 50,
        compareAtPrice: 100,
        flashSaleEnabled: true,
        flashSaleEndDate: oneHourAgo.toISOString(),
      })

      // Before expiry: sellingPrice = 50 * 1.1 = 55
      expect(sku.sellingPrice).toBe(55)

      // Simulate cron expiry
      await payload.update({
        collection: 'skus',
        id: sku.id,
        data: {
          price: 100,
          compareAtPrice: null,
          flashSaleEnabled: false,
          flashSaleEndDate: null,
        },
      })

      const updated = await payload.findByID({
        collection: 'skus',
        id: sku.id,
        depth: 0,
      })

      // After expiry: sellingPrice = 100 * 1.1 = 110
      expect(updated.price).toBe(100)
      expect(updated.sellingPrice).toBe(110)
    })
  })

  describe('Multiple SKUs batch processing', () => {
    it('expires multiple SKUs in one batch', async () => {
      const user = await createTestUser()
      const { variation } = await createStyleAndVariation(user)

      const twoHoursAgo = new Date()
      twoHoursAgo.setHours(twoHoursAgo.getHours() - 2)

      // Create 3 expired SKUs with different prices
      const sku1 = await createTestSku(variation.id, {
        price: 30,
        compareAtPrice: 60,
        flashSaleEnabled: true,
        flashSaleEndDate: twoHoursAgo.toISOString(),
      })

      // Need a second variation for additional SKUs (unique SKU options constraint)
      const { variation: variation2 } = await createStyleAndVariation(user)
      const sku2 = await createTestSku(variation2.id, {
        price: 80,
        compareAtPrice: 150,
        flashSaleEnabled: true,
        flashSaleEndDate: twoHoursAgo.toISOString(),
      })

      const { variation: variation3 } = await createStyleAndVariation(user)
      const sku3 = await createTestSku(variation3.id, {
        price: 25,
        compareAtPrice: 40,
        flashSaleEnabled: true,
        flashSaleEndDate: twoHoursAgo.toISOString(),
      })

      // Query expired SKUs like the cron does
      const now = new Date().toISOString()
      const expiredSkus = await payload.find({
        collection: 'skus',
        where: {
          and: [
            { flashSaleEnabled: { equals: true } },
            { flashSaleEndDate: { less_than: now } },
            { id: { in: [sku1.id, sku2.id, sku3.id] } },
          ],
        },
        depth: 0,
      })

      expect(expiredSkus.docs.length).toBe(3)

      // Process each expired SKU
      for (const sku of expiredSkus.docs) {
        const originalPrice = sku.compareAtPrice as number | undefined
        await payload.update({
          collection: 'skus',
          id: sku.id,
          data: {
            ...(originalPrice ? { price: originalPrice } : {}),
            compareAtPrice: null,
            flashSaleEnabled: false,
            flashSaleEndDate: null,
          },
        })
      }

      // Verify all were updated
      const updated1 = await payload.findByID({ collection: 'skus', id: sku1.id, depth: 0 })
      const updated2 = await payload.findByID({ collection: 'skus', id: sku2.id, depth: 0 })
      const updated3 = await payload.findByID({ collection: 'skus', id: sku3.id, depth: 0 })

      expect(updated1.price).toBe(60)
      expect(updated1.flashSaleEnabled).toBe(false)
      expect(updated1.compareAtPrice).toBeNull()

      expect(updated2.price).toBe(150)
      expect(updated2.flashSaleEnabled).toBe(false)
      expect(updated2.compareAtPrice).toBeNull()

      expect(updated3.price).toBe(40)
      expect(updated3.flashSaleEnabled).toBe(false)
      expect(updated3.compareAtPrice).toBeNull()
    })

    it('only expires past-due SKUs, leaves active ones untouched', async () => {
      const user = await createTestUser()

      const oneHourAgo = new Date()
      oneHourAgo.setHours(oneHourAgo.getHours() - 1)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      // Expired SKU
      const { variation: v1 } = await createStyleAndVariation(user)
      const expiredSku = await createTestSku(v1.id, {
        price: 50,
        compareAtPrice: 100,
        flashSaleEnabled: true,
        flashSaleEndDate: oneHourAgo.toISOString(),
      })

      // Active flash sale SKU (should not be touched)
      const { variation: v2 } = await createStyleAndVariation(user)
      const activeSku = await createTestSku(v2.id, {
        price: 70,
        compareAtPrice: 120,
        flashSaleEnabled: true,
        flashSaleEndDate: tomorrow.toISOString(),
      })

      // Query expired only
      const now = new Date().toISOString()
      const expiredSkus = await payload.find({
        collection: 'skus',
        where: {
          and: [
            { flashSaleEnabled: { equals: true } },
            { flashSaleEndDate: { less_than: now } },
            { id: { in: [expiredSku.id, activeSku.id] } },
          ],
        },
        depth: 0,
      })

      // Should only find the expired one
      expect(expiredSkus.docs.length).toBe(1)
      expect(expiredSkus.docs[0].id).toBe(expiredSku.id)

      // Process the expired one
      for (const sku of expiredSkus.docs) {
        const originalPrice = sku.compareAtPrice as number
        await payload.update({
          collection: 'skus',
          id: sku.id,
          data: {
            price: originalPrice,
            compareAtPrice: null,
            flashSaleEnabled: false,
            flashSaleEndDate: null,
          },
        })
      }

      // Verify expired SKU was updated
      const updatedExpired = await payload.findByID({ collection: 'skus', id: expiredSku.id, depth: 0 })
      expect(updatedExpired.price).toBe(100)
      expect(updatedExpired.flashSaleEnabled).toBe(false)

      // Verify active SKU was NOT touched
      const updatedActive = await payload.findByID({ collection: 'skus', id: activeSku.id, depth: 0 })
      expect(updatedActive.price).toBe(70)
      expect(updatedActive.compareAtPrice).toBe(120)
      expect(updatedActive.flashSaleEnabled).toBe(true)
      expect(updatedActive.flashSaleEndDate).not.toBeNull()
    })
  })

  describe('Edge cases', () => {
    it('handles no expired flash sales gracefully', async () => {
      const now = new Date().toISOString()
      const expiredSkus = await payload.find({
        collection: 'skus',
        where: {
          and: [
            { flashSaleEnabled: { equals: true } },
            { flashSaleEndDate: { less_than: now } },
            // Impossible condition to ensure empty result
            { id: { equals: '000000000000000000000000' } },
          ],
        },
        depth: 0,
      })

      expect(expiredSkus.docs.length).toBe(0)
    })

    it('handles flash sale that just expired (edge of time boundary)', async () => {
      const user = await createTestUser()
      const { variation } = await createStyleAndVariation(user)

      // Create a SKU with flash sale ending 1 second ago
      const justExpired = new Date()
      justExpired.setSeconds(justExpired.getSeconds() - 1)

      const sku = await createTestSku(variation.id, {
        price: 40,
        compareAtPrice: 80,
        flashSaleEnabled: true,
        flashSaleEndDate: justExpired.toISOString(),
      })

      const now = new Date().toISOString()
      const expiredSkus = await payload.find({
        collection: 'skus',
        where: {
          and: [
            { flashSaleEnabled: { equals: true } },
            { flashSaleEndDate: { less_than: now } },
            { id: { equals: sku.id } },
          ],
        },
        depth: 0,
      })

      expect(expiredSkus.docs.length).toBe(1)
    })
  })
})
