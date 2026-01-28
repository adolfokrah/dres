import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleChargeSuccess } from '@/collections/Transactions/webhookHandlers/handleChargeSuccess'
import * as handleOrderPaymentModule from '@/collections/Transactions/webhookHandlers/handleOrderPayment'
import * as handleBoostPaymentModule from '@/collections/Transactions/webhookHandlers/handleBoostPayment'
import * as paystackModule from '@/utilities/paystack'
import type { Payload } from 'payload'

// Mock the handlers
vi.mock('@/collections/Transactions/webhookHandlers/handleOrderPayment', () => ({
  handleOrderPayment: vi.fn(),
}))

vi.mock('@/collections/Transactions/webhookHandlers/handleBoostPayment', () => ({
  handleBoostPayment: vi.fn(),
}))

vi.mock('@/utilities/paystack', () => ({
  verifyPayment: vi.fn(),
  fromSmallestUnit: vi.fn((amount: number) => amount / 100),
}))

describe('handleChargeSuccess', () => {
  let mockPayload: Payload

  const mockChargeData = {
    id: 123456,
    domain: 'test',
    status: 'success',
    reference: 'TXN-CHARGE-123',
    amount: 10000, // 100.00 in smallest unit
    message: null,
    gateway_response: 'Successful',
    paid_at: '2026-01-28T10:05:00.000Z',
    created_at: '2026-01-28T10:00:00.000Z',
    channel: 'card',
    currency: 'GHS',
    ip_address: '127.0.0.1',
    metadata: {
      orderId: 'order-123',
      orderNumber: 'ORD-123',
      transactionId: 'TXN-CHARGE-123',
      customerId: 'customer-123',
    },
    fees: 150, // 1.50 in smallest unit
    customer: {
      id: 456789,
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      customer_code: 'CUS_xyz',
      phone: '+233123456789',
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

    vi.clearAllMocks()
  })

  it('should update transaction to completed and route to order payment handler', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-CHARGE-123',
      status: 'pending',
      type: 'deposit',
      order: 'order-123',
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    vi.mocked(paystackModule.verifyPayment).mockResolvedValueOnce({
      success: true,
      data: { status: 'success' },
    } as any)

    await handleChargeSuccess(mockPayload, mockChargeData)

    // Verify transaction was found
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'transactions',
      where: {
        transactionId: { equals: 'TXN-CHARGE-123' },
      },
      limit: 1,
    })

    // Verify payment was verified with Paystack
    expect(paystackModule.verifyPayment).toHaveBeenCalledWith('TXN-CHARGE-123')

    // Verify transaction was updated to completed
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'transactions',
      id: 'trans-123',
      data: {
        status: 'completed',
        paystackFees: 1.5,
        notes: 'Payment completed via Paystack. Gateway response: Successful',
      },
    })

    // Verify order payment handler was called with verification data
    expect(handleOrderPaymentModule.handleOrderPayment).toHaveBeenCalledWith(
      mockPayload,
      mockTransaction,
      { status: 'success' }
    )

    // Verify boost payment handler was NOT called
    expect(handleBoostPaymentModule.handleBoostPayment).not.toHaveBeenCalled()
  })

  it('should route to boost payment handler for boost transactions', async () => {
    const mockTransaction = {
      id: 'trans-456',
      transactionId: 'TXN-CHARGE-123',
      status: 'pending',
      type: 'boost_payment',
    }

    const boostChargeData = {
      ...mockChargeData,
      metadata: {
        ...mockChargeData.metadata,
        styleId: 'style-123',
        tierId: 'tier-123',
        tierDuration: 7,
      },
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    vi.mocked(paystackModule.verifyPayment).mockResolvedValueOnce({
      success: true,
      data: { status: 'success' },
    } as any)

    await handleChargeSuccess(mockPayload, boostChargeData)

    // Verify transaction was updated
    expect(mockPayload.update).toHaveBeenCalled()

    // Verify boost payment handler was called
    expect(handleBoostPaymentModule.handleBoostPayment).toHaveBeenCalledWith(
      mockPayload,
      mockTransaction,
      boostChargeData.metadata
    )

    // Verify order payment handler was NOT called
    expect(handleOrderPaymentModule.handleOrderPayment).not.toHaveBeenCalled()
  })

  it('should skip if transaction not found', async () => {
    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [],
    } as any)

    await handleChargeSuccess(mockPayload, mockChargeData)

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleChargeSuccess: Transaction not found for reference TXN-CHARGE-123'
    )
    expect(mockPayload.update).not.toHaveBeenCalled()
    expect(handleOrderPaymentModule.handleOrderPayment).not.toHaveBeenCalled()
    expect(handleBoostPaymentModule.handleBoostPayment).not.toHaveBeenCalled()
  })

  it('should skip if transaction already completed (idempotency)', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-CHARGE-123',
      status: 'completed', // Already completed
      type: 'deposit',
      order: 'order-123',
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleChargeSuccess(mockPayload, mockChargeData)

    expect(mockPayload.logger.info).toHaveBeenCalledWith(
      '🔔 handleChargeSuccess: Transaction TXN-CHARGE-123 already completed, skipping'
    )
    expect(paystackModule.verifyPayment).not.toHaveBeenCalled()
    expect(mockPayload.update).not.toHaveBeenCalled()
    expect(handleOrderPaymentModule.handleOrderPayment).not.toHaveBeenCalled()
  })

  it('should skip if Paystack verification fails', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-CHARGE-123',
      status: 'pending',
      type: 'deposit',
      order: 'order-123',
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    vi.mocked(paystackModule.verifyPayment).mockResolvedValueOnce({
      success: false,
      error: 'Verification failed',
    } as any)

    await handleChargeSuccess(mockPayload, mockChargeData)

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleChargeSuccess: Verification failed for TXN-CHARGE-123: Verification failed'
    )
    expect(mockPayload.update).not.toHaveBeenCalled()
    expect(handleOrderPaymentModule.handleOrderPayment).not.toHaveBeenCalled()
  })

  it('should skip if Paystack status is not success', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-CHARGE-123',
      status: 'pending',
      type: 'deposit',
      order: 'order-123',
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    vi.mocked(paystackModule.verifyPayment).mockResolvedValueOnce({
      success: true,
      data: { status: 'failed' }, // Not success
    } as any)

    await handleChargeSuccess(mockPayload, mockChargeData)

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleChargeSuccess: Verification failed for TXN-CHARGE-123: undefined'
    )
    expect(mockPayload.update).not.toHaveBeenCalled()
  })

  it('should handle zero fees', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-CHARGE-123',
      status: 'pending',
      type: 'deposit',
      order: 'order-123',
    }

    const dataWithNoFees = {
      ...mockChargeData,
      fees: null,
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    vi.mocked(paystackModule.verifyPayment).mockResolvedValueOnce({
      success: true,
      data: { status: 'success' },
    } as any)

    await handleChargeSuccess(mockPayload, dataWithNoFees)

    // Verify paystackFees is 0 when fees is null
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'transactions',
      id: 'trans-123',
      data: {
        status: 'completed',
        paystackFees: 0,
        notes: 'Payment completed via Paystack. Gateway response: Successful',
      },
    })
  })
})
