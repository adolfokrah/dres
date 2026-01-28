import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleChargeFailed } from '@/collections/Transactions/webhookHandlers/handleChargeFailed'
import type { Payload } from 'payload'

describe('handleChargeFailed', () => {
  let mockPayload: Payload

  const mockChargeData = {
    id: 123456,
    domain: 'test',
    status: 'failed',
    reference: 'TXN-CHARGE-FAILED',
    amount: 10000,
    message: 'Insufficient funds',
    gateway_response: 'Declined',
    paid_at: null,
    created_at: '2026-01-28T10:00:00.000Z',
    channel: 'card',
    currency: 'GHS',
    ip_address: '127.0.0.1',
    metadata: {
      orderId: 'order-456',
      orderNumber: 'ORD-456',
      transactionId: 'TXN-CHARGE-FAILED',
      customerId: 'customer-456',
    },
    fees: null,
    customer: {
      id: 456789,
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane@example.com',
      customer_code: 'CUS_abc',
      phone: '+233987654321',
    },
  }

  beforeEach(() => {
    mockPayload = {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
      },
      find: vi.fn(),
      update: vi.fn(),
    } as unknown as Payload
  })

  it('should update transaction and order to cancelled', async () => {
    const mockTransaction = {
      id: 'trans-456',
      transactionId: 'TXN-CHARGE-FAILED',
      status: 'pending',
      order: 'order-456',
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleChargeFailed(mockPayload, mockChargeData)

    // Verify transaction was found
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'transactions',
      where: {
        transactionId: { equals: 'TXN-CHARGE-FAILED' },
      },
      limit: 1,
    })

    // Verify transaction was updated to cancelled
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'transactions',
      id: 'trans-456',
      data: {
        status: 'cancelled',
        notes: 'Payment failed. Gateway response: Declined',
      },
    })

    // Verify order was updated to cancelled
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'orders',
      id: 'order-456',
      data: {
        status: 'cancelled',
      },
    })
  })

  it('should handle order as object with id property', async () => {
    const mockTransaction = {
      id: 'trans-456',
      transactionId: 'TXN-CHARGE-FAILED',
      status: 'pending',
      order: { id: 'order-789' },
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleChargeFailed(mockPayload, mockChargeData)

    // Verify order was updated with correct ID
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'orders',
      id: 'order-789',
      data: {
        status: 'cancelled',
      },
    })
  })

  it('should skip if transaction not found', async () => {
    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [],
    } as any)

    await handleChargeFailed(mockPayload, mockChargeData)

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleChargeFailed: Transaction not found for reference TXN-CHARGE-FAILED'
    )
    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('should skip order update if no order linked', async () => {
    const mockTransaction = {
      id: 'trans-456',
      transactionId: 'TXN-CHARGE-FAILED',
      status: 'pending',
      order: null, // No order linked
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleChargeFailed(mockPayload, mockChargeData)

    // Transaction should still be updated
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'transactions',
      id: 'trans-456',
      data: {
        status: 'cancelled',
        notes: 'Payment failed. Gateway response: Declined',
      },
    })

    // But no order update should happen
    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleChargeFailed: No order linked to transaction TXN-CHARGE-FAILED'
    )

    // Verify only one update call (transaction, not order)
    expect(mockPayload.update).toHaveBeenCalledTimes(1)
  })

  it('should handle different gateway responses', async () => {
    const mockTransaction = {
      id: 'trans-456',
      transactionId: 'TXN-CHARGE-FAILED',
      status: 'pending',
      order: 'order-456',
    }

    const dataWithDifferentResponse = {
      ...mockChargeData,
      gateway_response: 'Card expired',
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleChargeFailed(mockPayload, dataWithDifferentResponse)

    // Verify notes include the gateway response
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'transactions',
      id: 'trans-456',
      data: {
        status: 'cancelled',
        notes: 'Payment failed. Gateway response: Card expired',
      },
    })
  })

  it('should handle order as object with null value', async () => {
    const mockTransaction = {
      id: 'trans-456',
      transactionId: 'TXN-CHARGE-FAILED',
      status: 'pending',
      order: { id: null }, // Object but id is null
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleChargeFailed(mockPayload, mockChargeData)

    // Transaction should be updated
    expect(mockPayload.update).toHaveBeenCalledTimes(1)

    // Order should not be updated
    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleChargeFailed: No order linked to transaction TXN-CHARGE-FAILED'
    )
  })
})
