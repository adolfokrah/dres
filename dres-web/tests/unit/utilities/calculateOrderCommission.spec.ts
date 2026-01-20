import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateOrderCommission } from '@/utilities/calculateOrderCommission'
import type { Payload } from 'payload'

// Mock order and transaction data factories
const createMockOrder = (
  items: Array<{
    seller?: string
    price?: number
    shippingFee?: number
    buyerProtection?: boolean
    buyerProtectionFee?: number
    shippingStatus?: string
  }>,
  options: { discountAmount?: number; pointsDiscount?: number } = {},
) => ({
  id: 'order-123',
  items: items.map((item, idx) => ({
    id: `item-${idx}`,
    seller: item.seller ?? `seller-${idx}`,
    price: item.price ?? 100,
    shippingFee: item.shippingFee ?? 0,
    buyerProtection: item.buyerProtection ?? false,
    buyerProtectionFee: item.buyerProtectionFee ?? 0,
    shippingStatus: item.shippingStatus ?? 'placed',
  })),
  discountAmount: options.discountAmount ?? 0,
  pointsDiscount: options.pointsDiscount ?? 0,
})

const createMockTransaction = (
  type: 'deposit' | 'refund' | 'order_payment' | 'shipping_payment',
  data: { fees?: number; paystackFees?: number } = {},
) => ({
  type,
  fees: data.fees ?? 0,
  paystackFees: data.paystackFees ?? 0,
})

// Create mock payload
const createMockPayload = (
  order: ReturnType<typeof createMockOrder> | null,
  transactions: ReturnType<typeof createMockTransaction>[],
) => {
  return {
    findByID: vi.fn().mockResolvedValue(order),
    find: vi.fn().mockResolvedValue({ docs: transactions }),
    logger: {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
    },
  } as unknown as Payload
}

describe('calculateOrderCommission (Unit Tests)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Happy Path - Delivered Orders', () => {
    it('calculates commission for single item, single seller, delivered', async () => {
      const order = createMockOrder([
        {
          seller: 'seller-1',
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'delivered',
        },
      ])

      const transactions = [
        createMockTransaction('deposit', { fees: 5, paystackFees: 1.5 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      expect(result).not.toBeNull()
      expect(result?.totalTransactionFees).toBe(5)
      expect(result?.totalPaystackFees).toBe(1.5)
      expect(result?.totalBuyerProtectionFees).toBe(8)
      expect(result?.buyerProtectionCosts).toBe(0)
      // Commission = 5 - 1.5 + 8 = 11.5
      expect(result?.totalCommission).toBe(11.5)
    })

    it('calculates commission for multiple items from same seller, all delivered', async () => {
      const order = createMockOrder([
        {
          seller: 'seller-1',
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'delivered',
        },
        {
          seller: 'seller-1',
          price: 50,
          shippingFee: 0,
          buyerProtection: true,
          buyerProtectionFee: 4,
          shippingStatus: 'delivered',
        },
      ])

      const transactions = [
        createMockTransaction('deposit', { fees: 10, paystackFees: 2 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      expect(result?.totalBuyerProtectionFees).toBe(12) // 8 + 4
      expect(result?.buyerProtectionCosts).toBe(0)
      // Commission = 10 - 2 + 12 = 20
      expect(result?.totalCommission).toBe(20)
    })

    it('calculates commission for multi-seller order, all delivered', async () => {
      const order = createMockOrder([
        {
          seller: 'seller-1',
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'delivered',
        },
        {
          seller: 'seller-2',
          price: 80,
          shippingFee: 8,
          buyerProtection: true,
          buyerProtectionFee: 6,
          shippingStatus: 'delivered',
        },
      ])

      const transactions = [
        createMockTransaction('deposit', { fees: 15, paystackFees: 3 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      expect(result?.totalBuyerProtectionFees).toBe(14) // 8 + 6
      expect(result?.buyerProtectionCosts).toBe(0)
      // Commission = 15 - 3 + 14 = 26
      expect(result?.totalCommission).toBe(26)
    })

    it('calculates commission with discount code', async () => {
      const order = createMockOrder(
        [{ seller: 'seller-1', price: 100, shippingStatus: 'delivered' }],
        { discountAmount: 10 },
      )

      const transactions = [
        createMockTransaction('deposit', { fees: 5, paystackFees: 1.5 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      expect(result?.discountAmount).toBe(10)
      // Commission = 5 - 1.5 - 10 = -6.5
      expect(result?.totalCommission).toBe(-6.5)
    })

    it('calculates commission with points discount', async () => {
      const order = createMockOrder(
        [{ seller: 'seller-1', price: 100, shippingStatus: 'delivered' }],
        { pointsDiscount: 5 },
      )

      const transactions = [
        createMockTransaction('deposit', { fees: 5, paystackFees: 1.5 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      expect(result?.pointsDiscount).toBe(5)
      // Commission = 5 - 1.5 - 5 = -1.5
      expect(result?.totalCommission).toBe(-1.5)
    })
  })

  describe('Partial Returns', () => {
    it('does NOT charge BP costs when some items returned, some delivered (same seller)', async () => {
      const order = createMockOrder([
        {
          seller: 'seller-1',
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'delivered',
        },
        {
          seller: 'seller-1',
          price: 50,
          shippingFee: 0,
          buyerProtection: true,
          buyerProtectionFee: 4,
          shippingStatus: 'returned',
        },
      ])

      const transactions = [
        createMockTransaction('deposit', { fees: 10, paystackFees: 2 }),
        createMockTransaction('refund', { fees: 0, paystackFees: 1 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      // BP costs = 0 because NOT all seller items returned
      expect(result?.buyerProtectionCosts).toBe(0)
      expect(result?.totalBuyerProtectionFees).toBe(12) // 8 + 4
      // Commission = 10 - 3 + 12 = 19
      expect(result?.totalCommission).toBe(19)
    })

    it('handles item with BP returned - BP covers shipping only when ALL returned', async () => {
      // This tests that partial return does NOT trigger BP costs
      const order = createMockOrder([
        {
          seller: 'seller-1',
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'returned',
        },
        {
          seller: 'seller-1',
          price: 50,
          shippingFee: 0,
          buyerProtection: false,
          shippingStatus: 'delivered',
        },
      ])

      const transactions = [
        createMockTransaction('deposit', { fees: 10, paystackFees: 2 }),
        createMockTransaction('refund', { fees: 3, paystackFees: 1 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      // BP costs = 0 because not ALL seller items returned
      expect(result?.buyerProtectionCosts).toBe(0)
    })
  })

  describe('Full Returns', () => {
    it('calculates BP costs when all items returned (single seller)', async () => {
      const order = createMockOrder([
        {
          seller: 'seller-1',
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'returned',
        },
      ])

      const transactions = [
        createMockTransaction('deposit', { fees: 5, paystackFees: 1.5 }),
        createMockTransaction('refund', { fees: 0, paystackFees: 1 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      expect(result?.buyerProtectionCosts).toBe(10) // Shipping fee as BP cost
      expect(result?.totalBuyerProtectionFees).toBe(8)
      // Commission = 5 - 2.5 + (8 - 10) = 0.5
      expect(result?.totalCommission).toBe(0.5)
    })

    it('treats not_available same as returned for BP costs', async () => {
      const order = createMockOrder([
        {
          seller: 'seller-1',
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'not_available',
        },
      ])

      const transactions = [
        createMockTransaction('deposit', { fees: 5, paystackFees: 1.5 }),
        createMockTransaction('refund', { fees: 0, paystackFees: 1 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      expect(result?.buyerProtectionCosts).toBe(10)
    })

    it('calculates commission near zero when all returned with BP', async () => {
      const order = createMockOrder([
        {
          seller: 'seller-1',
          price: 100,
          shippingFee: 8,
          buyerProtection: true,
          buyerProtectionFee: 8, // BP fee equals shipping fee
          shippingStatus: 'returned',
        },
      ])

      const transactions = [
        createMockTransaction('deposit', { fees: 2, paystackFees: 2 }),
        createMockTransaction('refund', { fees: 0, paystackFees: 1 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      // BP net = 8 - 8 = 0
      // Commission = 2 - 3 + 0 = -1
      expect(result?.totalCommission).toBe(-1)
    })
  })

  describe('Multi-Seller Complex Scenarios', () => {
    it('calculates BP costs independently per seller (3 sellers with mixed statuses)', async () => {
      const order = createMockOrder([
        // Seller 1: all returned
        {
          seller: 'seller-1',
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'returned',
        },
        // Seller 2: delivered
        {
          seller: 'seller-2',
          price: 80,
          shippingFee: 8,
          buyerProtection: true,
          buyerProtectionFee: 6,
          shippingStatus: 'delivered',
        },
        // Seller 3: partial (one returned, one delivered)
        {
          seller: 'seller-3',
          price: 60,
          shippingFee: 6,
          buyerProtection: true,
          buyerProtectionFee: 5,
          shippingStatus: 'returned',
        },
        {
          seller: 'seller-3',
          price: 40,
          shippingFee: 0,
          buyerProtection: true,
          buyerProtectionFee: 3,
          shippingStatus: 'delivered',
        },
      ])

      const transactions = [
        createMockTransaction('deposit', { fees: 20, paystackFees: 4 }),
        createMockTransaction('refund', { fees: 0, paystackFees: 1 }),
        createMockTransaction('refund', { fees: 0, paystackFees: 1 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      // BP costs = 10 (only seller-1, all returned)
      // Seller-2: delivered, no costs
      // Seller-3: partial, no costs
      expect(result?.buyerProtectionCosts).toBe(10)
      expect(result?.totalBuyerProtectionFees).toBe(22) // 8 + 6 + 5 + 3
      // Commission = 20 - 6 + (22 - 10) = 26
      expect(result?.totalCommission).toBe(26)
    })
  })

  describe('Edge Cases', () => {
    it('returns null for order not found', async () => {
      const payload = createMockPayload(null, [])
      const result = await calculateOrderCommission(payload, 'non-existent')

      expect(result).toBeNull()
      expect(payload.logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Order non-existent not found'),
      )
    })

    it('handles order with no transactions (commission = BP fees only)', async () => {
      const order = createMockOrder([
        {
          seller: 'seller-1',
          price: 100,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'placed',
        },
      ])

      const payload = createMockPayload(order, [])
      const result = await calculateOrderCommission(payload, 'order-123')

      expect(result?.totalTransactionFees).toBe(0)
      expect(result?.totalPaystackFees).toBe(0)
      expect(result?.totalBuyerProtectionFees).toBe(8)
      expect(result?.totalCommission).toBe(8)
    })

    it('excludes shipping_payment fees from income', async () => {
      const order = createMockOrder([
        {
          seller: 'seller-1',
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'returned',
        },
      ])

      const transactions = [
        createMockTransaction('deposit', { fees: 5, paystackFees: 1.5 }),
        createMockTransaction('shipping_payment', { fees: 10, paystackFees: 1 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      // shipping_payment fees (10) should NOT be in totalTransactionFees
      expect(result?.totalTransactionFees).toBe(5)
      // But its paystackFees (1) SHOULD be counted
      expect(result?.totalPaystackFees).toBe(2.5) // 1.5 + 1
    })

    it('skips items without seller ID gracefully', async () => {
      const order = createMockOrder([
        {
          seller: 'seller-1',
          price: 100,
          shippingFee: 10,
          buyerProtection: true,
          buyerProtectionFee: 8,
          shippingStatus: 'returned',
        },
        {
          seller: undefined, // No seller
          price: 50,
          shippingFee: 5,
          buyerProtection: true,
          buyerProtectionFee: 4,
          shippingStatus: 'returned',
        },
      ])

      const transactions = [
        createMockTransaction('deposit', { fees: 10, paystackFees: 2 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      // Only seller-1's shipping should count as BP cost
      expect(result?.buyerProtectionCosts).toBe(10)
      // Both items' BP fees should count
      expect(result?.totalBuyerProtectionFees).toBe(12)
    })

    it('allows negative commission (costs > fees)', async () => {
      const order = createMockOrder(
        [
          {
            seller: 'seller-1',
            price: 100,
            shippingFee: 20,
            buyerProtection: true,
            buyerProtectionFee: 5, // Low BP fee
            shippingStatus: 'returned',
          },
        ],
        { discountAmount: 15, pointsDiscount: 10 },
      )

      const transactions = [
        createMockTransaction('deposit', { fees: 5, paystackFees: 10 }), // High Paystack fees
        createMockTransaction('refund', { fees: 0, paystackFees: 5 }),
      ]

      const payload = createMockPayload(order, transactions)
      const result = await calculateOrderCommission(payload, 'order-123')

      // Commission = 5 - 15 + (5 - 20) - 15 - 10 = -50
      expect(result?.totalCommission).toBe(-50)
      expect(result?.totalCommission).toBeLessThan(0)
    })
  })
})
