import { describe, it, expect, vi, beforeEach } from 'vitest'
import { calculateUserBalance } from '@/utilities/calculateUserBalance'
import type { BasePayload } from 'payload'

// Helper to create a mock transaction
const createTxn = (type: string, status: string, amount: number) => ({
  type,
  status,
  amount,
})

// Helper to create a mock payload
const createMockPayload = (docs: ReturnType<typeof createTxn>[]) => {
  return {
    find: vi.fn().mockResolvedValue({ docs }),
  } as unknown as BasePayload
}

describe('calculateUserBalance', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns 0 when there are no transactions', async () => {
    const payload = createMockPayload([])
    const balance = await calculateUserBalance(payload, 'user-1')

    expect(balance).toBe(0)
  })

  it('sums order_payment transactions correctly', async () => {
    const payload = createMockPayload([
      createTxn('order_payment', 'completed', 100),
      createTxn('order_payment', 'completed', 50),
    ])

    const balance = await calculateUserBalance(payload, 'user-1')
    expect(balance).toBe(150)
  })

  it('subtracts transfer (withdrawal) amounts from balance', async () => {
    const payload = createMockPayload([
      createTxn('order_payment', 'completed', 200),
      createTxn('transfer', 'completed', -150), // Withdrawal is negative
    ])

    const balance = await calculateUserBalance(payload, 'user-1')
    expect(balance).toBe(50)
  })

  it('includes refund transactions in balance', async () => {
    const payload = createMockPayload([
      createTxn('order_payment', 'completed', 100),
      createTxn('refund', 'completed', 30),
    ])

    const balance = await calculateUserBalance(payload, 'user-1')
    expect(balance).toBe(130)
  })

  it('includes return_charge transactions in balance', async () => {
    const payload = createMockPayload([
      createTxn('order_payment', 'completed', 100),
      createTxn('return_charge', 'completed', -20),
    ])

    const balance = await calculateUserBalance(payload, 'user-1')
    expect(balance).toBe(80)
  })

  it('includes deposit transactions in balance', async () => {
    const payload = createMockPayload([
      createTxn('deposit', 'completed', 50),
    ])

    const balance = await calculateUserBalance(payload, 'user-1')
    expect(balance).toBe(50)
  })

  it('handles mixed transaction types correctly', async () => {
    const payload = createMockPayload([
      createTxn('order_payment', 'completed', 500),
      createTxn('order_payment', 'completed', 200),
      createTxn('transfer', 'completed', -300),
      createTxn('refund', 'completed', 50),
      createTxn('return_charge', 'completed', -25),
      createTxn('deposit', 'completed', 100),
    ])

    const balance = await calculateUserBalance(payload, 'user-1')
    // 500 + 200 - 300 + 50 - 25 + 100 = 525
    expect(balance).toBe(525)
  })

  it('rounds to 2 decimal places', async () => {
    const payload = createMockPayload([
      createTxn('order_payment', 'completed', 10.333),
      createTxn('order_payment', 'completed', 20.666),
    ])

    const balance = await calculateUserBalance(payload, 'user-1')
    expect(balance).toBe(31)
  })

  it('queries with correct filters (excludes boost_payment)', async () => {
    const payload = createMockPayload([])
    await calculateUserBalance(payload, 'user-123')

    expect(payload.find).toHaveBeenCalledWith({
      collection: 'transactions',
      where: {
        user: { equals: 'user-123' },
        status: { in: ['completed', 'in_progress'] },
        type: { in: ['order_payment', 'transfer', 'refund', 'return_charge', 'deposit'] },
      },
      limit: 0,
    })
  })

  it('does NOT include boost_payment in balance', async () => {
    // The mock simulates what payload.find returns AFTER filtering
    // This test verifies the query doesn't include boost_payment type
    const payload = createMockPayload([
      createTxn('order_payment', 'completed', 100),
    ])

    await calculateUserBalance(payload, 'user-1')

    const callArgs = (payload.find as any).mock.calls[0][0]
    const typeFilter = callArgs.where.type.in

    expect(typeFilter).not.toContain('boost_payment')
    expect(typeFilter).toEqual(['order_payment', 'transfer', 'refund', 'return_charge', 'deposit'])
  })

  it('does NOT include pending transactions', async () => {
    const payload = createMockPayload([])
    await calculateUserBalance(payload, 'user-1')

    const callArgs = (payload.find as any).mock.calls[0][0]
    const statusFilter = callArgs.where.status.in

    expect(statusFilter).not.toContain('pending')
    expect(statusFilter).toEqual(['completed', 'in_progress'])
  })

  it('handles transactions with zero or missing amounts', async () => {
    const payload = createMockPayload([
      createTxn('order_payment', 'completed', 100),
      { type: 'order_payment', status: 'completed', amount: 0 },
      { type: 'order_payment', status: 'completed', amount: undefined } as any,
    ])

    const balance = await calculateUserBalance(payload, 'user-1')
    expect(balance).toBe(100)
  })

  it('can return negative balance', async () => {
    const payload = createMockPayload([
      createTxn('order_payment', 'completed', 50),
      createTxn('transfer', 'completed', -100),
    ])

    const balance = await calculateUserBalance(payload, 'user-1')
    expect(balance).toBe(-50)
  })
})
