import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleTransferFailed } from '@/collections/Transactions/webhookHandlers/handleTransferFailed'
import type { Payload } from 'payload'
import * as paystackUtils from '@/utilities/paystack'

// Mock the paystack utilities
vi.mock('@/utilities/paystack', () => ({
  verifyTransfer: vi.fn(),
}))

describe('handleTransferFailed', () => {
  let mockPayload: Payload

  const mockTransferData = {
    id: 123456,
    domain: 'test',
    status: 'failed',
    reference: 'TXN-TRANSFER-456',
    amount: 10000,
    currency: 'GHS',
    reason: 'Insufficient balance',
    transfer_code: 'TRF_failed123',
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
      update: vi.fn(),
      create: vi.fn(),
    } as unknown as Payload

    // Default mock for verifyTransfer - returns failed status
    vi.mocked(paystackUtils.verifyTransfer).mockResolvedValue({
      success: true,
      data: { status: 'failed', reason: 'Insufficient balance' },
    })
  })

  it('should update transaction to cancelled and send notification', async () => {
    const mockTransaction = {
      id: 'trans-456',
      transactionId: 'TXN-TRANSFER-456',
      status: 'in_progress',
      amount: -100.0,
      user: 'user-456',
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleTransferFailed(mockPayload, mockTransferData)

    // Verify transaction was found
    expect(mockPayload.find).toHaveBeenCalledWith({
      collection: 'transactions',
      where: {
        transactionId: { equals: 'TXN-TRANSFER-456' },
      },
      limit: 1,
    })

    // Verify transaction was updated to cancelled
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'transactions',
      id: 'trans-456',
      data: {
        status: 'cancelled',
        notes: 'Transfer failed or reversed. Reason: Insufficient balance, Status: failed',
      },
    })

    // Verify notification was created
    expect(mockPayload.create).toHaveBeenCalledWith({
      collection: 'notifications',
      data: {
        user: 'user-456',
        type: 'system',
        message:
          'Your withdrawal transfer failed. Please contact support or update your withdrawal account details.',
        path: '/profile?tab=transactions',
        read: false,
      },
    })
  })

  it('should handle transaction with user object', async () => {
    const mockTransaction = {
      id: 'trans-456',
      transactionId: 'TXN-TRANSFER-456',
      status: 'in_progress',
      amount: -50.0,
      user: { id: 'user-789' },
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleTransferFailed(mockPayload, mockTransferData)

    // Verify notification was created with correct user ID
    expect(mockPayload.create).toHaveBeenCalledWith({
      collection: 'notifications',
      data: {
        user: 'user-789',
        type: 'system',
        message:
          'Your withdrawal transfer failed. Please contact support or update your withdrawal account details.',
        path: '/profile?tab=transactions',
        read: false,
      },
    })
  })

  it('should skip if transaction not found', async () => {
    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [],
    } as any)

    await handleTransferFailed(mockPayload, mockTransferData)

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleTransferFailed: Transaction not found for reference TXN-TRANSFER-456'
    )
    expect(mockPayload.update).not.toHaveBeenCalled()
    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('should skip notification if no user linked', async () => {
    const mockTransaction = {
      id: 'trans-456',
      transactionId: 'TXN-TRANSFER-456',
      status: 'in_progress',
      amount: -100.0,
      user: null,
    }

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleTransferFailed(mockPayload, mockTransferData)

    // Transaction should still be updated
    expect(mockPayload.update).toHaveBeenCalled()

    // But no notification should be created
    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleTransferFailed: No user linked to transaction TXN-TRANSFER-456'
    )
    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('should handle null reason', async () => {
    const mockTransaction = {
      id: 'trans-456',
      transactionId: 'TXN-TRANSFER-456',
      status: 'in_progress',
      amount: -100.0,
      user: 'user-456',
    }

    const dataWithNullReason = {
      ...mockTransferData,
      reason: null,
    }

    // Mock verifyTransfer with no reason
    vi.mocked(paystackUtils.verifyTransfer).mockResolvedValueOnce({
      success: true,
      data: { status: 'failed', reason: null },
    })

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleTransferFailed(mockPayload, dataWithNullReason)

    // Verify notes use 'Unknown' when reason is null
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'transactions',
      id: 'trans-456',
      data: {
        status: 'cancelled',
        notes: 'Transfer failed or reversed. Reason: Unknown, Status: failed',
      },
    })
  })

  it('should handle reversed transfer status', async () => {
    const mockTransaction = {
      id: 'trans-456',
      transactionId: 'TXN-TRANSFER-456',
      status: 'in_progress',
      amount: -100.0,
      user: 'user-456',
    }

    const reversedData = {
      ...mockTransferData,
      status: 'reversed',
      reason: 'Manual reversal',
    }

    // Mock verifyTransfer with reversed status
    vi.mocked(paystackUtils.verifyTransfer).mockResolvedValueOnce({
      success: true,
      data: { status: 'reversed', reason: 'Manual reversal' },
    })

    vi.mocked(mockPayload.find).mockResolvedValueOnce({
      docs: [mockTransaction],
    } as any)

    await handleTransferFailed(mockPayload, reversedData)

    // Verify notes reflect reversed status
    expect(mockPayload.update).toHaveBeenCalledWith({
      collection: 'transactions',
      id: 'trans-456',
      data: {
        status: 'cancelled',
        notes: 'Transfer failed or reversed. Reason: Manual reversal, Status: reversed',
      },
    })
  })
})
