import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleBoostPayment } from '@/collections/Transactions/webhookHandlers/handleBoostPayment'
import type { Payload } from 'payload'

describe('handleBoostPayment', () => {
  let mockPayload: Payload

  beforeEach(() => {
    mockPayload = {
      logger: {
        info: vi.fn(),
        error: vi.fn(),
      },
      findByID: vi.fn(),
      create: vi.fn(),
    } as unknown as Payload
  })

  it('should create StyleBoost with metadata duration', async () => {
    const mockTransaction = {
      id: 'trans-boost-123',
      transactionId: 'TXN-BOOST-123',
      user: 'user-123',
    }

    const metadata = {
      styleId: 'style-456',
      tierId: 'tier-789',
      tierDuration: 14, // 14 days
    }

    const mockStyleBoost = {
      id: 'boost-123',
    }

    vi.mocked(mockPayload.create).mockResolvedValueOnce(mockStyleBoost as any)

    await handleBoostPayment(mockPayload, mockTransaction, metadata)

    // Verify StyleBoost was created
    const createCall = vi.mocked(mockPayload.create).mock.calls[0][0]
    expect(createCall.collection).toBe('style-boosts')
    expect(createCall.data.style).toBe('style-456')
    expect(createCall.data.tier).toBe('tier-789')
    expect(createCall.data.status).toBe('active')
    expect(createCall.data.transaction).toBe('trans-boost-123')
    expect(createCall.overrideAccess).toBe(true)

    // Verify dates
    const startDate = new Date(createCall.data.startDate)
    const endDate = new Date(createCall.data.endDate)
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(14)

    // Verify notes
    expect(createCall.data.notes).toBe('Boost activated via payment. Duration: 14 days.')
  })

  it('should handle tierDuration as string', async () => {
    const mockTransaction = {
      id: 'trans-boost-123',
      transactionId: 'TXN-BOOST-123',
      user: 'user-123',
    }

    const metadata = {
      styleId: 'style-456',
      tierId: 'tier-789',
      tierDuration: '7', // String instead of number
    }

    vi.mocked(mockPayload.create).mockResolvedValueOnce({ id: 'boost-123' } as any)

    await handleBoostPayment(mockPayload, mockTransaction, metadata)

    const createCall = vi.mocked(mockPayload.create).mock.calls[0][0]
    const startDate = new Date(createCall.data.startDate)
    const endDate = new Date(createCall.data.endDate)
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(7)
    expect(createCall.data.notes).toBe('Boost activated via payment. Duration: 7 days.')
  })

  it('should fetch tier duration if not in metadata', async () => {
    const mockTransaction = {
      id: 'trans-boost-123',
      transactionId: 'TXN-BOOST-123',
      user: 'user-123',
    }

    const metadata = {
      styleId: 'style-456',
      tierId: 'tier-789',
      // No tierDuration in metadata
    }

    const mockTier = {
      id: 'tier-789',
      duration: 30,
    }

    vi.mocked(mockPayload.findByID).mockResolvedValueOnce(mockTier as any)
    vi.mocked(mockPayload.create).mockResolvedValueOnce({ id: 'boost-123' } as any)

    await handleBoostPayment(mockPayload, mockTransaction, metadata)

    // Verify tier was fetched
    expect(mockPayload.findByID).toHaveBeenCalledWith({
      collection: 'boost-tiers',
      id: 'tier-789',
      depth: 0,
    })

    const createCall = vi.mocked(mockPayload.create).mock.calls[0][0]
    const startDate = new Date(createCall.data.startDate)
    const endDate = new Date(createCall.data.endDate)
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(30)
  })

  it('should use default 7 days if tier duration not found', async () => {
    const mockTransaction = {
      id: 'trans-boost-123',
      transactionId: 'TXN-BOOST-123',
      user: 'user-123',
    }

    const metadata = {
      styleId: 'style-456',
      tierId: 'tier-789',
    }

    const mockTier = {
      id: 'tier-789',
      duration: null, // No duration
    }

    vi.mocked(mockPayload.findByID).mockResolvedValueOnce(mockTier as any)
    vi.mocked(mockPayload.create).mockResolvedValueOnce({ id: 'boost-123' } as any)

    await handleBoostPayment(mockPayload, mockTransaction, metadata)

    const createCall = vi.mocked(mockPayload.create).mock.calls[0][0]
    const startDate = new Date(createCall.data.startDate)
    const endDate = new Date(createCall.data.endDate)
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(7) // Default fallback
  })

  it('should skip if styleId missing', async () => {
    const mockTransaction = {
      id: 'trans-boost-123',
      transactionId: 'TXN-BOOST-123',
      user: 'user-123',
    }

    const metadata = {
      // No styleId
      tierId: 'tier-789',
      tierDuration: 14,
    }

    await handleBoostPayment(mockPayload, mockTransaction, metadata)

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleBoostPayment: Missing styleId or tierId in metadata'
    )
    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('should skip if tierId missing', async () => {
    const mockTransaction = {
      id: 'trans-boost-123',
      transactionId: 'TXN-BOOST-123',
      user: 'user-123',
    }

    const metadata = {
      styleId: 'style-456',
      // No tierId
      tierDuration: 14,
    }

    await handleBoostPayment(mockPayload, mockTransaction, metadata)

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleBoostPayment: Missing styleId or tierId in metadata'
    )
    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('should skip if metadata is undefined', async () => {
    const mockTransaction = {
      id: 'trans-boost-123',
      transactionId: 'TXN-BOOST-123',
      user: 'user-123',
    }

    await handleBoostPayment(mockPayload, mockTransaction, undefined)

    expect(mockPayload.logger.error).toHaveBeenCalledWith(
      '🔔 handleBoostPayment: Missing styleId or tierId in metadata'
    )
    expect(mockPayload.create).not.toHaveBeenCalled()
  })

  it('should handle invalid tierDuration string gracefully', async () => {
    const mockTransaction = {
      id: 'trans-boost-123',
      transactionId: 'TXN-BOOST-123',
      user: 'user-123',
    }

    const metadata = {
      styleId: 'style-456',
      tierId: 'tier-789',
      tierDuration: 'invalid-number', // Invalid string that won't parse to int
    }

    const mockTier = {
      id: 'tier-789',
      duration: 21,
    }

    vi.mocked(mockPayload.findByID).mockResolvedValueOnce(mockTier as any)
    vi.mocked(mockPayload.create).mockResolvedValueOnce({ id: 'boost-123' } as any)

    await handleBoostPayment(mockPayload, mockTransaction, metadata)

    // Should fall back to fetching tier duration
    expect(mockPayload.findByID).toHaveBeenCalled()

    const createCall = vi.mocked(mockPayload.create).mock.calls[0][0]
    const startDate = new Date(createCall.data.startDate)
    const endDate = new Date(createCall.data.endDate)
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    expect(diffDays).toBe(21)
  })

  it('should create StyleBoost with correct ISO date format', async () => {
    const mockTransaction = {
      id: 'trans-boost-123',
      transactionId: 'TXN-BOOST-123',
      user: 'user-123',
    }

    const metadata = {
      styleId: 'style-456',
      tierId: 'tier-789',
      tierDuration: 7,
    }

    vi.mocked(mockPayload.create).mockResolvedValueOnce({ id: 'boost-123' } as any)

    await handleBoostPayment(mockPayload, mockTransaction, metadata)

    const createCall = vi.mocked(mockPayload.create).mock.calls[0][0]

    // Verify dates are in ISO string format
    expect(typeof createCall.data.startDate).toBe('string')
    expect(typeof createCall.data.endDate).toBe('string')
    expect(createCall.data.startDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    expect(createCall.data.endDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
  })
})
