import type { CollectionAfterChangeHook, Payload } from 'payload'
import { calculateOrderCommission, CommissionBreakdown } from '@/utilities/calculateOrderCommission'

/**
 * Deep compare two commission breakdown objects
 */
function isCommissionEqual(a: CommissionBreakdown | null, b: unknown): boolean {
  if (!a || !b || typeof b !== 'object') return false
  const breakdown = b as Partial<CommissionBreakdown>
  return (
    a.totalTransactionFees === breakdown.totalTransactionFees &&
    a.totalPaystackFees === breakdown.totalPaystackFees &&
    a.totalBuyerProtectionFees === breakdown.totalBuyerProtectionFees &&
    a.buyerProtectionCosts === breakdown.buyerProtectionCosts &&
    a.discountAmount === breakdown.discountAmount &&
    a.pointsDiscount === breakdown.pointsDiscount &&
    a.totalCommission === breakdown.totalCommission
  )
}

/**
 * Deferred commission update - runs outside the current transaction
 */
async function updateCommissionDeferred(
  payload: Payload,
  orderId: string,
  currentCommission: unknown
) {
  try {
    // Calculate commission based on current transactions
    const commissionBreakdown = await calculateOrderCommission(payload, orderId)
    payload.logger.info(`[Commission] Calculated breakdown for order ${orderId}: ${JSON.stringify(commissionBreakdown)}`)
    if (commissionBreakdown) {
      if (!isCommissionEqual(commissionBreakdown, currentCommission)) {
        payload.logger.info(`[Commission] Deferred update for order ${orderId}: ${JSON.stringify(commissionBreakdown)}`)
        
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: {
            commissionBreakdown,
          },
          context: {
            skipHooks: true,
          },
        })
      } else {
        payload.logger.info(`[Commission] No change for order ${orderId} - skipping update`)
      }
    }
  } catch (error) {
    payload.logger.error(`[Commission] Deferred error for order ${orderId}: ${error}`)
  }
}

/**
 * Calculate and update order commission after any order change
 * This hook runs last to ensure all transactions are created/updated first
 */
export const calculateCommissionOnOrderChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Skip if context indicates we should skip hooks
  if (req.context?.skipHooks) return doc
  
  // Only calculate on update (transactions are created during updates)
  if (operation !== 'update') return doc

  const payload = req.payload


  // Defer the commission calculation to run after the current transaction completes
  // This prevents MongoDB write conflicts
  setImmediate(() => {
    updateCommissionDeferred(payload, doc.id, doc.commissionBreakdown || {})
  })

  return doc
}
