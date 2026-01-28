import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleTransferSuccess } from '@/collections/Transactions/webhookHandlers/handleTransferSuccess'
import type { Payload } from 'payload'
import * as paystackUtils from '@/utilities/paystack'

// Mock the paystack utilities
vi.mock('@/utilities/paystack', () => ({
  verifyTransfer: vi.fn(),
}))

describe('handleTransferSuccess', () => {
  let mockPayload: Payload

  const mockTransferData = {
    id: 123456,
    domain: 'test',
    status: 'success',
    reference: 'TXN-TRANSFER-123',
    amount: 10000, // 100.00 in smallest unit
    currency: 'GHS',
    reason: 'Seller payout',
    transfer_code: 'TRF_abc123',
    recipient: 'RCP_xyz789',
    created_at: '2026-01-28T10:00:00.000Z',
    updated_at: '2026-01-28T10:05:00.000Z',
    source: 'balance',
    source_details: null,
    titan_code: null,
  }

  beforeEach(() => {
    mockPayload = {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
        warn: vi.fn(),
      },
      find: vi.fn(),
      findByID: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    } as unknown as Payload

    // Default mock for verifyTransfer - returns success
    vi.mocked(paystackUtils.verifyTransfer).mockResolvedValue({
      success: true,
      data: { status: 'success' },
    })
  })

  it('should update transaction to completed and send notification', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-TRANSFER-123',
      status: 'in_progress',
      amount: -100.0, // Negative for transfer
      currency: 'curr-123',
      user: 'user-123',
    }

    const mockCurrency = {
      id: 'curr-123',
      symbol: '₵',
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    vi.mocked(mockPayload.findByID).mockResolvedValueOnce(mockCurrency as any)

    await handleTransferSuccess(mockPayload, mockTransferData)

    // Verify transaction was found
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'transactions',
      where: {
        transactionId: { equals: 'TXN-TRANSFER-123' },
      },
      limit: 1,
    })

    // Verify currency was fetched
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'currencies',
      id: 'curr-123',
      depth: 0,
    })

    // Verify transaction was updated to completed
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'transactions',
      id: 'trans-123',
      data: {
        status: 'completed',
        notes: 'Transfer completed via Paystack. Transfer code: TRF_abc123',
      },
    })

    // Verify notification was created
    expect(mockPayload.create).toHaveBeenCalledWith({
      collection: 'notifications',
      data: {
        user: 'user-123',
        type: 'system',
        message: 'An amount of ₵100.00 has been transferred to your withdrawal account 💰',
        path: '/profile?tab=transactions',
        read: false,
      },
    })
  })

  it('should handle transaction with user object instead of string', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-TRANSFER-123',
      status: 'in_progress',
      amount: -50.0,
      currency: { id: 'curr-123' },
      user: { id: 'user-456' },
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    vi.mocked(mockPayload.findByID).mockResolvedValueOnce({
      id: 'curr-123',
      symbol: '$',
    } as any)

    await handleTransferSuccess(mockPayload, mockTransferData)

    // Verify notification was created with correct user ID
    expect(mockPayload.create).toHaveBeenCalledWith({
      collection: 'notifications',
      data: {
        user: 'user-456',
        type: 'system',
        message: 'An amount of $50.00 has been transferred to your withdrawal account 💰',
        path: '/profile?tab=transactions',
        read: false,
      },
    })
  })

  it('should skip if transaction not found', async () => {
    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [],
    } as any)

    await handleTransferSuccess(mockPayload, mockTransferData)

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleTransferSuccess: Transaction not found for reference TXN-TRANSFER-123'
    )
    expect(mockPayload.update).not.toHaveBeenCalled()
    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('should skip if transaction already completed (idempotency)', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-TRANSFER-123',
      status: 'completed', // Already completed
      amount: -100.0,
      currency: 'curr-123',
      user: 'user-123',
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleTransferSuccess(mockPayload, mockTransferData)

    expect(mockPayload.logger.info).toHaveBeenCalledWith(
      '🔔 handleTransferSuccess: Transaction TXN-TRANSFER-123 already completed, skipping'
    )
    expect(mockPayload.update).not.toHaveBeenCalled()
    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('should skip notification if no user linked', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-TRANSFER-123',
      status: 'in_progress',
      amount: -100.0,
      currency: 'curr-123',
      user: null, // No user
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    vi.mocked(mockPayload.findByID).mockResolvedValueOnce({
      id: 'curr-123',
      symbol: '₵',
    } as any)

    await handleTransferSuccess(mockPayload, mockTransferData)

    // Transaction should still be updated
    expect(mockPayload.update).toHaveBeenCalled()

    // But no notification should be created
    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleTransferSuccess: No user linked to transaction TXN-TRANSFER-123'
    )
    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('should use default currency symbol if currency not found', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-TRANSFER-123',
      status: 'in_progress',
      amount: -75.5,
      currency: null, // No currency
      user: 'user-123',
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleTransferSuccess(mockPayload, mockTransferData)

    // Verify notification uses default ₵ symbol
    expect(mockPayload.create).toHaveBeenCalledWith({
      collection: 'notifications',
      data: {
        user: 'user-123',
        type: 'system',
        message: 'An amount of ₵75.50 has been transferred to your withdrawal account 💰',
        path: '/profile?tab=transactions',
        read: false,
      },
    })
  })

  it('should handle absolute value of negative amounts correctly', async () => {
    const mockTransaction = {
      id: 'trans-123',
      transactionId: 'TXN-TRANSFER-123',
      status: 'in_progress',
      amount: -250.75, // Large negative amount
      currency: 'curr-123',
      user: 'user-123',
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    vi.mocked(mockPayload.findByID).mockResolvedValueOnce({
      id: 'curr-123',
      symbol: '₦',
    } as any)

    await handleTransferSuccess(mockPayload, mockTransferData)

    // Verify notification shows positive amount
    expect(mockPayload.create).toHaveBeenCalledWith({
      collection: 'notifications',
      data: {
        user: 'user-123',
        type: 'system',
        message: 'An amount of ₦250.75 has been transferred to your withdrawal account 💰',
        path: '/profile?tab=transactions',
        read: false,
      },
    })
  })
})
