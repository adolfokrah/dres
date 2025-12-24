import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  buyerProtectionFee?: number
  shippingStatus?: string
}

/**
 * Calculate platform commission using simple formula:
 * Total Commission = Commission Fees (from transactions) + Buyer Protection Fees - Discount Amount - Points Discount
 * 
 * Where:
 * - Commission Fees = Sum of commissionFees from all transfer transactions for this order
 * - Buyer Protection Fees = Sum of buyer protection fees from delivered items
 * - Discount Amount = Discount applied to the order
 * - Points Discount = Points redeemed as discount
 * 
 * This runs AFTER order changes, so transactions are already created
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

    // Get delivered items for buyer protection fees
    const deliveredItems = items.filter((item) => item.shippingStatus === 'delivered')

    // Calculate total buyer protection fees from delivered items
    const totalBuyerProtectionFee = deliveredItems.reduce((sum, item) => {
      return sum + (item.buyerProtectionFee || 0)
    }, 0)

    // Get commission fees from transactions for this order
    let totalCommissionFees = 0

    if (orderId) {
      const transactions = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { order: { equals: orderId } },
            { type: { equals: 'transfer' } },
          ],
        },
        limit: 100,
      })

      totalCommissionFees = transactions.docs.reduce((sum, tx) => {
        return sum + ((tx.commissionFees as number) || 0)
      }, 0)
    }

    // Total Commission = Commission Fees + Buyer Protection Fees - Discount Amount - Points Discount
    // Can be negative (for accounting purposes)
    const totalCommission = totalCommissionFees + totalBuyerProtectionFee - discountAmount - pointsDiscount
    const roundedCommission = Math.round(totalCommission * 100) / 100

    // Only update if commission has changed
    if (doc.totalCommission !== roundedCommission) {
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: {
          totalCommission: roundedCommission,
        },
        // Prevent infinite loop - don't trigger hooks
        context: {
          skipCommissionCalculation: true,
        },
      })

      payload.logger.info(
        `Order commission updated: Commission Fees: ${totalCommissionFees}, Buyer Protection: ${totalBuyerProtectionFee}, Discount: ${discountAmount}, Points Discount: ${pointsDiscount}, Total: ${roundedCommission}`,
      )
    }
  } catch (error) {
    payload.logger.error(`Error calculating total commission: ${error}`)
  }

  return doc
}
