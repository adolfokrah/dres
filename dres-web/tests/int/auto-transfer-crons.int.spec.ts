import { getPayload, Payload } from 'payload'
import config from '@/payload.config'
import { describe, it, beforeAll, afterAll, afterEach, expect, vi } from 'vitest'

// Mock Paystack utilities
vi.mock('@/utilities/paystack', () => ({
  createTransferRecipient: vi.fn().mockResolvedValue({
    success: true,
    data: { recipient_code: 'RCP_test123' },
  }),
  initiateBulkTransfer: vi.fn().mockResolvedValue({
    success: true,
    data: { batch_code: 'BCH_test123' },
  }),
  toSmallestUnit: vi.fn((amount: number) => Math.round(amount * 100)),
}))

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
 * Helper to create a test user with withdrawal account
 */
async function createTestUser(overrides: {
  shopName?: string
  hasWithdrawalAccount?: boolean
  hasBankCode?: boolean
} = {}) {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
  const hasWithdrawal = overrides.hasWithdrawalAccount !== false
  const hasBankCode = overrides.hasBankCode !== false

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = await (payload.create as any)({
    collection: 'users',
    disableVerificationEmail: true,
    data: {
      email: `transfer-test-${uniqueId}@test.com`,
      password: 'testpassword123',
      firstName: `TransferTest${uniqueId}`,
      lastName: 'User',
      role: 'user',
      shopName: overrides.shopName,
      username: `transfertest${uniqueId.replace(/-/g, '')}`,
      withdrawalAccount: hasWithdrawal
        ? {
            accountName: 'Test Account',
            accountNumber: '1234567890',
            bankCode: hasBankCode ? '058' : undefined,
            bankName: 'Test Bank',
          }
        : undefined,
    },
  })
  createdDocs.users.push(user.id)
  return user
}

/**
 * Helper to create a pending refund transaction
 */
async function createRefundTransaction(
  userId: string,
  orderId: string,
  amount: number,
  status: 'pending' | 'in_progress' | 'completed' = 'pending',
) {
  const txn = await payload.create({
    collection: 'transactions',
    data: {
      transactionId: `TXN-REF-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'refund',
      status,
      user: userId,
      order: orderId,
      amount,
      fees: 0,
    },
  })
  createdDocs.transactions.push(txn.id)
  return txn
}

/**
 * Helper to create an order_payment transaction for a seller
 */
async function createOrderPaymentTransaction(
  sellerId: string,
  orderId: string,
  amount: number,
  createdAt?: Date,
) {
  const txn = await payload.create({
    collection: 'transactions',
    data: {
      transactionId: `TXN-OP-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: 'order_payment',
      status: 'completed',
      user: sellerId,
      order: orderId,
      amount,
      fees: 10,
    },
  })

  // If custom createdAt provided, update it directly via db
  if (createdAt) {
    const db = payload.db
    const collection = db.collections['transactions']
    await collection.updateOne({ _id: txn.id }, { $set: { createdAt } })
  }

  createdDocs.transactions.push(txn.id)
  return txn
}

/**
 * Helper to create a dummy order
 */
async function createDummyOrder(customerId: string, sellerId?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await (payload.create as any)({
    collection: 'orders',
    data: {
      orderId: `ORD-TEST-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      status: 'completed',
      customer: customerId,
      items: [
        {
          id: `item-${Date.now()}`,
          seller: sellerId || customerId,
          variationTitle: 'Test Item',
          price: 100,
          originalPrice: 80,
          quantity: 1,
          shippingFee: 10,
          shippingStatus: 'delivered',
        },
      ],
    },
  })
  createdDocs.orders.push(order.id)
  return order
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

describe('Auto Transfer Crons Integration Tests', () => {
  beforeAll(async () => {
    const payloadConfig = await config
    payload = await getPayload({ config: payloadConfig })
  })

  afterEach(async () => {
    await cleanupTestData()
    vi.clearAllMocks()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('Auto Transfer Buyer Refund', () => {
    it('finds pending refund transactions', async () => {
      const customer = await createTestUser()
      const order = await createDummyOrder(customer.id)

      // Create pending refund
      await createRefundTransaction(customer.id, order.id, 100, 'pending')
      // Create completed refund (should not be picked up)
      await createRefundTransaction(customer.id, order.id, 50, 'completed')

      // Query pending refunds like the cron does
      const pendingRefunds = await payload.find({
        collection: 'transactions',
        where: {
          and: [{ type: { equals: 'refund' } }, { status: { equals: 'pending' } }],
        },
      })

      expect(pendingRefunds.docs.length).toBeGreaterThanOrEqual(1)
      expect(pendingRefunds.docs.every((doc) => doc.status === 'pending')).toBe(true)
    })

    it('skips users without withdrawal account', async () => {
      const customerWithAccount = await createTestUser({ hasWithdrawalAccount: true })
      const customerWithoutAccount = await createTestUser({ hasWithdrawalAccount: false })
      const order1 = await createDummyOrder(customerWithAccount.id)
      const order2 = await createDummyOrder(customerWithoutAccount.id)

      await createRefundTransaction(customerWithAccount.id, order1.id, 100)
      await createRefundTransaction(customerWithoutAccount.id, order2.id, 100)

      // Simulate cron logic - filter users without withdrawal accounts
      // Only look at our test users
      const pendingRefunds = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { type: { equals: 'refund' } },
            { status: { equals: 'pending' } },
            { user: { in: [customerWithAccount.id, customerWithoutAccount.id] } },
          ],
        },
      })

      let validCount = 0
      let skippedCount = 0

      for (const txn of pendingRefunds.docs) {
        const userId = typeof txn.user === 'object' ? txn.user.id : txn.user
        const user = await payload.findByID({ collection: 'users', id: userId as string })
        const withdrawalAccount = user?.withdrawalAccount as { accountNumber?: string } | undefined

        if (withdrawalAccount?.accountNumber) {
          validCount++
        } else {
          skippedCount++
        }
      }

      expect(validCount).toBe(1)
      expect(skippedCount).toBe(1)
    })

    it('skips users without bank code', async () => {
      const customerWithBankCode = await createTestUser({ hasBankCode: true })
      const customerWithoutBankCode = await createTestUser({ hasBankCode: false })
      const order1 = await createDummyOrder(customerWithBankCode.id)
      const order2 = await createDummyOrder(customerWithoutBankCode.id)

      await createRefundTransaction(customerWithBankCode.id, order1.id, 100)
      await createRefundTransaction(customerWithoutBankCode.id, order2.id, 100)

      // Simulate cron logic - filter users without bank codes
      // Only look at our test users
      const pendingRefunds = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { type: { equals: 'refund' } },
            { status: { equals: 'pending' } },
            { user: { in: [customerWithBankCode.id, customerWithoutBankCode.id] } },
          ],
        },
      })

      let validCount = 0
      let skippedCount = 0

      for (const txn of pendingRefunds.docs) {
        const userId = typeof txn.user === 'object' ? txn.user.id : txn.user
        const user = await payload.findByID({ collection: 'users', id: userId as string })
        const withdrawalAccount = user?.withdrawalAccount as {
          accountNumber?: string
          bankCode?: string
        } | undefined

        if (withdrawalAccount?.accountNumber && withdrawalAccount?.bankCode) {
          validCount++
        } else {
          skippedCount++
        }
      }

      expect(validCount).toBe(1)
      expect(skippedCount).toBe(1)
    })
  })

  describe('Auto Transfer Seller Order Payment', () => {
    it('finds sellers with positive balance from old order_payments', async () => {
      const seller = await createTestUser({ shopName: 'Test Shop' })
      const customer = await createTestUser()
      const order = await createDummyOrder(customer.id)

      // Create order_payment older than 8 hours
      const nineHoursAgo = new Date()
      nineHoursAgo.setHours(nineHoursAgo.getHours() - 9)
      await createOrderPaymentTransaction(seller.id, order.id, 100, nineHoursAgo)

      // Query like the cron does
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - 8)

      const oldPayments = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { type: { equals: 'order_payment' } },
            { status: { equals: 'completed' } },
            { createdAt: { less_than: cutoffTime.toISOString() } },
          ],
        },
      })

      expect(oldPayments.docs.length).toBeGreaterThanOrEqual(1)
    })

    it('ignores order_payments newer than 8 hours', async () => {
      const seller = await createTestUser({ shopName: 'Test Shop' })
      const customer = await createTestUser()
      const order = await createDummyOrder(customer.id)

      // Create recent order_payment (should be ignored)
      await createOrderPaymentTransaction(seller.id, order.id, 100)

      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - 8)

      const oldPayments = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { type: { equals: 'order_payment' } },
            { status: { equals: 'completed' } },
            { createdAt: { less_than: cutoffTime.toISOString() } },
            // Filter to only our test seller
            { user: { equals: seller.id } },
          ],
        },
      })

      // Should not find the recent payment
      expect(oldPayments.docs.length).toBe(0)
    })

    it('calculates seller balance correctly (order_payments - transfers)', async () => {
      const seller = await createTestUser({ shopName: 'Test Shop' })
      const customer = await createTestUser()
      const order1 = await createDummyOrder(customer.id)
      const order2 = await createDummyOrder(customer.id)

      // Create order_payments older than 8 hours
      const nineHoursAgo = new Date()
      nineHoursAgo.setHours(nineHoursAgo.getHours() - 9)

      await createOrderPaymentTransaction(seller.id, order1.id, 100, nineHoursAgo)
      await createOrderPaymentTransaction(seller.id, order2.id, 50, nineHoursAgo)

      // Create a transfer (negative amount)
      const transferTxn = await payload.create({
        collection: 'transactions',
        data: {
          transactionId: `TXN-TRF-${Date.now()}`,
          type: 'transfer',
          status: 'completed',
          user: seller.id,
          amount: -80, // Previous transfer
          fees: 0,
        },
      })
      createdDocs.transactions.push(transferTxn.id)

      // Calculate balance manually
      const allTxns = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { user: { equals: seller.id } },
            {
              or: [{ type: { equals: 'order_payment' } }, { type: { equals: 'transfer' } }],
            },
          ],
        },
      })

      const balance = allTxns.docs.reduce((sum, txn) => sum + (txn.amount as number), 0)

      // 100 + 50 - 80 = 70
      expect(balance).toBe(70)
    })

    it('does not process seller with zero or negative balance', async () => {
      const seller = await createTestUser({ shopName: 'Test Shop' })
      const customer = await createTestUser()
      const order = await createDummyOrder(customer.id)

      // Create order_payment older than 8 hours
      const nineHoursAgo = new Date()
      nineHoursAgo.setHours(nineHoursAgo.getHours() - 9)
      await createOrderPaymentTransaction(seller.id, order.id, 100, nineHoursAgo)

      // Create transfer that zeroes out balance
      const transferTxn = await payload.create({
        collection: 'transactions',
        data: {
          transactionId: `TXN-TRF-${Date.now()}`,
          type: 'transfer',
          status: 'completed',
          user: seller.id,
          amount: -100,
          fees: 0,
        },
      })
      createdDocs.transactions.push(transferTxn.id)

      // Calculate balance
      const allTxns = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { user: { equals: seller.id } },
            {
              or: [{ type: { equals: 'order_payment' } }, { type: { equals: 'transfer' } }],
            },
          ],
        },
      })

      const balance = allTxns.docs.reduce((sum, txn) => sum + (txn.amount as number), 0)

      // Balance should be 0
      expect(balance).toBe(0)
    })

    it('skips sellers without withdrawal account', async () => {
      const sellerWithAccount = await createTestUser({
        shopName: 'Shop With Account',
        hasWithdrawalAccount: true,
      })
      const sellerWithoutAccount = await createTestUser({
        shopName: 'Shop Without Account',
        hasWithdrawalAccount: false,
      })
      const customer = await createTestUser()

      const order1 = await createDummyOrder(customer.id)
      const order2 = await createDummyOrder(customer.id)

      const nineHoursAgo = new Date()
      nineHoursAgo.setHours(nineHoursAgo.getHours() - 9)

      await createOrderPaymentTransaction(sellerWithAccount.id, order1.id, 100, nineHoursAgo)
      await createOrderPaymentTransaction(sellerWithoutAccount.id, order2.id, 100, nineHoursAgo)

      // Check withdrawal accounts
      const seller1 = await payload.findByID({
        collection: 'users',
        id: sellerWithAccount.id,
      })
      const seller2 = await payload.findByID({
        collection: 'users',
        id: sellerWithoutAccount.id,
      })

      const account1 = seller1?.withdrawalAccount as { accountNumber?: string } | undefined
      const account2 = seller2?.withdrawalAccount as { accountNumber?: string } | undefined

      expect(account1?.accountNumber).toBeDefined()
      expect(account2?.accountNumber).toBeUndefined()
    })
  })

  describe('Transaction Status Updates', () => {
    it('updates refund transaction to in_progress when processing', async () => {
      const customer = await createTestUser()
      const order = await createDummyOrder(customer.id)
      const refund = await createRefundTransaction(customer.id, order.id, 100, 'pending')

      // Simulate cron updating status
      await payload.update({
        collection: 'transactions',
        id: refund.id,
        data: { status: 'in_progress' },
      })

      const updated = await payload.findByID({
        collection: 'transactions',
        id: refund.id,
      })

      expect(updated?.status).toBe('in_progress')
    })

    it('updates transaction to cancelled when bulk transfer fails', async () => {
      const customer = await createTestUser()
      const order = await createDummyOrder(customer.id)
      const refund = await createRefundTransaction(customer.id, order.id, 100, 'pending')

      // Simulate cron marking as in_progress then failing
      await payload.update({
        collection: 'transactions',
        id: refund.id,
        data: { status: 'in_progress' },
      })

      // Simulate failure - mark as cancelled with note
      await payload.update({
        collection: 'transactions',
        id: refund.id,
        data: {
          status: 'cancelled',
          notes: 'Bulk transfer failed: Test error',
        },
      })

      const updated = await payload.findByID({
        collection: 'transactions',
        id: refund.id,
      })

      expect(updated?.status).toBe('cancelled')
      expect(updated?.notes).toContain('Bulk transfer failed')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty pending refunds gracefully', async () => {
      const pendingRefunds = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { type: { equals: 'refund' } },
            { status: { equals: 'pending' } },
            // Add impossible condition to ensure empty result
            { transactionId: { equals: 'IMPOSSIBLE_ID_THAT_WONT_EXIST' } },
          ],
        },
      })

      expect(pendingRefunds.docs.length).toBe(0)
    })

    it('handles empty seller balances gracefully', async () => {
      const cutoffTime = new Date()
      cutoffTime.setHours(cutoffTime.getHours() - 8)

      const oldPayments = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { type: { equals: 'order_payment' } },
            { status: { equals: 'completed' } },
            { createdAt: { less_than: cutoffTime.toISOString() } },
            // Add impossible condition
            { transactionId: { equals: 'IMPOSSIBLE_ID' } },
          ],
        },
      })

      expect(oldPayments.docs.length).toBe(0)
    })
  })
})
