import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  price?: number
  quantity?: number
  buyerProtectionFee?: number
  shippingStatus?: string
}

/**
 * Calculate platform commission using simple formula:
 * Total Commission = Platform Fee (10% of subtotal) + Buyer Protection Fees - Discount Amount - Points Discount
 * 
 * Where:
 * - Platform Fee = 10% of subtotal from active items (excludes returned/return_in_progress/not_available)
 * - Buyer Protection Fees = Sum of buyer protection fees from active items
 * - Discount Amount = Discount applied to the order
 * - Points Discount = Points redeemed as discount
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

    // Get active items (exclude returned/return_in_progress/not_available)
    const activeItems = items.filter((item) => 
      item.shippingStatus !== 'returned' && 
      item.shippingStatus !== 'return_in_progress' &&
      item.shippingStatus !== 'not_available'
    )

    // Calculate subtotal from active items
    const subtotal = activeItems.reduce((sum, item) => {
      return sum + ((item.price || 0) * (item.quantity || 0))
    }, 0)

    // Platform fee = 10% of subtotal
    const platformFee = subtotal * 0.1

    // Calculate total buyer protection fees from active items
    const totalBuyerProtectionFee = activeItems.reduce((sum, item) => {
      return sum + (item.buyerProtectionFee || 0)
    }, 0)

    // Total Commission = Platform Fee + Buyer Protection Fees - Discount Amount - Points Discount
    // Can be negative (for accounting purposes)
    const totalCommission = platformFee + totalBuyerProtectionFee - discountAmount - pointsDiscount
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
        `Order commission updated: Platform Fee (10%): ${platformFee.toFixed(2)}, Buyer Protection: ${totalBuyerProtectionFee}, Discount: ${discountAmount}, Points Discount: ${pointsDiscount}, Total: ${roundedCommission}`,
      )
    }
  } catch (error) {
    payload.logger.error(`Error calculating total commission: ${error}`)
  }

  return doc
}
