import type { CollectionAfterChangeHook } from 'payload'
import type { Payload } from 'payload'

interface OrderItem {
  buyerProtectionFee?: number
}

interface CommissionBreakdown {
  totalTransactionFees?: number
  totalPaystackFees?: number
  totalBuyerProtectionFees?: number
  discountAmount?: number
  pointsDiscount?: number
  totalCommission?: number
}

/**
 * Calculate platform commission from transactions:
 * Total Commission = Total Transaction Fees - Total Paystack Fees + Total Buyer Protection Fees - Discount Amount - Points Discount
 * 
 * Where:
 * - Total Transaction Fees = sum of 'fees' from all transactions for this order
 * - Total Paystack Fees = sum of 'paystackFees' from all transactions for this order
 * - Total Buyer Protection Fees = sum of buyer protection fees from ALL order items (non-refundable)
 * - Discount Amount = discount applied to the order
 * - Points Discount = points redeemed as discount
 * 
 * This runs AFTER order changes - deferred to avoid MongoDB write conflicts
 */

// Helper function to retry operations on write conflict
async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 200
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error: unknown) {
      lastError = error
      const isWriteConflict = error instanceof Error && 
        (error.message.includes('Write conflict') || 
         error.message.includes('WriteConflict') ||
         (error as { code?: number }).code === 112)
      
      if (isWriteConflict && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt))
        continue
      }
      throw error
    }
  }
  throw lastError
}

// Standalone function to calculate commission (can be called from anywhere)
export async function recalculateOrderCommission(
  payload: Payload,
  orderId: string,
): Promise<void> {
  try {
    // Get the order
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
    })

    if (!order) {
      payload.logger.error(`[Commission] Order ${orderId} not found`)
      return
    }

    const items = (order.items || []) as OrderItem[]
    const discountAmount = order.discountAmount || 0
    const pointsDiscount = order.pointsDiscount || 0

    payload.logger.info(`[Commission] Calculating commission for order ${orderId}`)

    // Get all non-cancelled transactions for this order
    const transactions = await payload.find({
      collection: 'transactions',
      where: {
        and: [
          { order: { equals: orderId } },
          { status: { not_equals: 'cancelled' } },
        ],
      },
      limit: 100,
    })

    payload.logger.info(`[Commission] Found ${transactions.docs.length} non-cancelled transactions for order ${orderId}`)

    // Sum up fees from all non-cancelled transactions
    const totalTransactionFees = transactions.docs.reduce((sum, txn) => {
      return sum + (txn.fees || 0)
    }, 0)

    // Sum up paystack fees only from 'transfer' type transactions (actual payouts)
    const totalPaystackFees = transactions.docs.reduce((sum, txn) => {
      if (txn.type === 'transfer') {
        return sum + (txn.paystackFees || 0)
      }
      return sum
    }, 0)

    // Calculate total buyer protection fees from ALL items (non-refundable)
    const totalBuyerProtectionFees = items.reduce((sum, item) => {
      return sum + (item.buyerProtectionFee || 0)
    }, 0)

    // Total Commission = Total Transaction Fees - Total Paystack Fees + Buyer Protection Fees - Discounts
    const totalCommission = totalTransactionFees - totalPaystackFees + totalBuyerProtectionFees - discountAmount - pointsDiscount
    
    // Round all values
    const roundedTransactionFees = Math.round(totalTransactionFees * 100) / 100
    const roundedPaystackFees = Math.round(totalPaystackFees * 100) / 100
    const roundedBuyerProtectionFees = Math.round(totalBuyerProtectionFees * 100) / 100
    const roundedDiscountAmount = Math.round(discountAmount * 100) / 100
    const roundedPointsDiscount = Math.round(pointsDiscount * 100) / 100
    const roundedCommission = Math.round(totalCommission * 100) / 100

    // Check if any values have changed
    const currentBreakdown = (order.commissionBreakdown || {}) as CommissionBreakdown
    const hasChanged = 
      currentBreakdown.totalTransactionFees !== roundedTransactionFees ||
      currentBreakdown.totalPaystackFees !== roundedPaystackFees ||
      currentBreakdown.totalBuyerProtectionFees !== roundedBuyerProtectionFees ||
      currentBreakdown.discountAmount !== roundedDiscountAmount ||
      currentBreakdown.pointsDiscount !== roundedPointsDiscount ||
      currentBreakdown.totalCommission !== roundedCommission

    if (hasChanged) {
      // Use retry to handle potential write conflicts
      await withRetry(async () => {
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: {
            commissionBreakdown: {
              totalTransactionFees: roundedTransactionFees,
              totalPaystackFees: roundedPaystackFees,
              totalBuyerProtectionFees: roundedBuyerProtectionFees,
              discountAmount: roundedDiscountAmount,
              pointsDiscount: roundedPointsDiscount,
              totalCommission: roundedCommission,
            },
          },
          context: {
            skipCommissionCalculation: true,
          },
        })
      })

      payload.logger.info(
        `[Commission] Order ${orderId} updated: Transaction Fees: ${roundedTransactionFees}, Paystack Fees: ${roundedPaystackFees}, Buyer Protection: ${roundedBuyerProtectionFees}, Discount: ${roundedDiscountAmount}, Points: ${roundedPointsDiscount}, Total: ${roundedCommission}`,
      )
    } else {
      payload.logger.info(`[Commission] No changes needed for order ${orderId}`)
    }
  } catch (error) {
    payload.logger.error(`[Commission] Error calculating commission for order ${orderId}: ${error}`)
  }
}

export const calculateTotalCommission: CollectionAfterChangeHook = async ({
  doc,
  req,
  context,
}) => {
  // Skip if this update was triggered by commission calculation (prevent infinite loop)
  if (context?.skipCommissionCalculation) {
    return doc
  }

  // Only calculate commission when order status is 'completed'
  // Commission is only relevant once the order is fully delivered
  if (doc?.status !== 'completed') {
    return doc
  }

  const payload = req.payload
  const orderId = doc?.id

  if (!orderId) {
    return doc
  }

  // Defer the commission calculation to avoid MongoDB write conflicts
  setTimeout(() => {
    recalculateOrderCommission(payload, orderId).catch((error) => {
      payload.logger.error(`[Commission] Deferred calculation failed: ${error}`)
    })
  }, 500) // 500ms delay

  return doc
}
