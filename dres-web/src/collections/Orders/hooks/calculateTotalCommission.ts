import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  buyerProtectionFee?: number
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
 * This runs AFTER order changes
 */
export const calculateTotalCommission: CollectionAfterChangeHook = async ({
  doc,
  req,
  context,
}) => {
  // Skip if this update was triggered by commission calculation (prevent infinite loop)
  if (context?.skipCommissionCalculation) {
    return doc
  }

  const payload = req.payload

  try {
    const items = (doc?.items || []) as OrderItem[]
    const orderId = doc?.id
    const discountAmount = doc?.discountAmount || 0
    const pointsDiscount = doc?.pointsDiscount || 0

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
    const currentBreakdown = doc.commissionBreakdown || {}
    const hasChanged = 
      currentBreakdown.totalTransactionFees !== roundedTransactionFees ||
      currentBreakdown.totalPaystackFees !== roundedPaystackFees ||
      currentBreakdown.totalBuyerProtectionFees !== roundedBuyerProtectionFees ||
      currentBreakdown.discountAmount !== roundedDiscountAmount ||
      currentBreakdown.pointsDiscount !== roundedPointsDiscount ||
      currentBreakdown.totalCommission !== roundedCommission

    if (hasChanged) {
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
        // Prevent infinite loop - don't trigger hooks
        context: {
          skipCommissionCalculation: true,
        },
      })

      payload.logger.info(
        `Order commission updated: Transaction Fees: ${roundedTransactionFees}, Paystack Fees: ${roundedPaystackFees}, Buyer Protection: ${roundedBuyerProtectionFees}, Discount: ${roundedDiscountAmount}, Points: ${roundedPointsDiscount}, Total: ${roundedCommission}`,
      )
    }
  } catch (error) {
    payload.logger.error(`Error calculating total commission: ${error}`)
  }

  return doc
}
