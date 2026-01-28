import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleOrderPayment } from '@/collections/Transactions/webhookHandlers/handleOrderPayment'
import type { Payload } from 'payload'

describe('handleOrderPayment', () => {
  let mockPayload: Payload

  beforeEach(() => {
    mockPayload = {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
      },
      findByID: vi.fn(),
      update: vi.fn(),
    } as unknown as Payload
  })

  it('should update order status from new to placed', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-123',
      order: 'order-123',
    }

    const mockOrder = {
      id: 'order-123',
      status: 'new',
    }

    vi.mocked(mockPayload.findByID).mockResolvedValueOnce(mockOrder as any)

    await handleOrderPayment(mockPayload, mockTransaction)

    // Verify order was fetched
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'orders',
      id: 'order-123',
      depth: 0,
    })

    // Verify order status was updated to placed
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'orders',
      id: 'order-123',
      data: {
        status: 'placed',
      },
    })
  })

  it('should handle order as object with id property', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-123',
      order: { id: 'order-456' },
    }

    const mockOrder = {
      id: 'order-456',
      status: 'new',
    }

    vi.mocked(mockPayload.findByID).mockResolvedValueOnce(mockOrder as any)

    await handleOrderPayment(mockPayload, mockTransaction)

    // Verify order was fetched with correct ID
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'orders',
      id: 'order-456',
      depth: 0,
    })

    // Verify order was updated
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'orders',
      id: 'order-456',
      data: {
        status: 'placed',
      },
    })
  })

  it('should skip if no order linked to transaction', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-123',
      order: null, // No order
    }

    await handleOrderPayment(mockPayload, mockTransaction)

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleOrderPayment: No order linked to transaction TXN-123'
    )
    expect(mockPayload.findByID).not.toHaveBeenCalled()
    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('should skip if order status is not new (idempotency)', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-123',
      order: 'order-123',
    }

    const mockOrder = {
      id: 'order-123',
      status: 'placed', // Already placed
    }

    vi.mocked(mockPayload.findByID).mockResolvedValueOnce(mockOrder as any)

    await handleOrderPayment(mockPayload, mockTransaction)

    // Order should be fetched to check status
    expect(mockPayload.findByID).toHaveBeenCalled()

    // But should not update since status is not 'new'
    expect(mockPayload.logger.info).toHaveBeenCalledWith(
      "🔔 handleOrderPayment: Order order-123 already has status 'placed', skipping update"
    )
    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('should skip if order status is delivered', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-123',
      order: 'order-123',
    }

    const mockOrder = {
      id: 'order-123',
      status: 'delivered',
    }

    vi.mocked(mockPayload.findByID).mockResolvedValueOnce(mockOrder as any)

    await handleOrderPayment(mockPayload, mockTransaction)

    // Should skip update for delivered orders
    expect(mockPayload.logger.info).toHaveBeenCalledWith(
      "🔔 handleOrderPayment: Order order-123 already has status 'delivered', skipping update"
    )
    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('should skip if order status is cancelled', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-123',
      order: 'order-123',
    }

    const mockOrder = {
      id: 'order-123',
      status: 'cancelled',
    }

    vi.mocked(mockPayload.findByID).mockResolvedValueOnce(mockOrder as any)

    await handleOrderPayment(mockPayload, mockTransaction)

    // Should skip update for cancelled orders
    expect(mockPayload.logger.info).toHaveBeenCalledWith(
      "🔔 handleOrderPayment: Order order-123 already has status 'cancelled', skipping update"
    )
    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('should handle order as undefined', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-123',
      order: undefined,
    }

    await handleOrderPayment(mockPayload, mockTransaction)

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleOrderPayment: No order linked to transaction TXN-123'
    )
    expect(mockPayload.findByID).not.toHaveBeenCalled()
    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('should handle order as object with null id', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-123',
      order: { id: null },
    }

    await handleOrderPayment(mockPayload, mockTransaction)

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleOrderPayment: No order linked to transaction TXN-123'
    )
    expect(mockPayload.findByID).not.toHaveBeenCalled()
  })
})
