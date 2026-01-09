import type { Payload } from 'payload'

interface OrderItem {
  buyerProtectionFee?: number
}

interface Order {
  id: string
  items?: OrderItem[]
  discountAmount?: number
  pointsDiscount?: number
  commissionBreakdown?: {
    totalTransactionFees?: number
    totalPaystackFees?: number
    totalBuyerProtectionFees?: number
    discountAmount?: number
    pointsDiscount?: number
    totalCommission?: number
  }
}

/**
 * Calculate platform commission from transactions for a specific order.
 * This is a utility function that can be called from anywhere.
 * 
 * Total Commission = Total Transaction Fees - Total Paystack Fees + Total Buyer Protection Fees - Discount Amount - Points Discount
 */
export async function calculateCommissionForOrder(
  payload: Payload,
  orderId: string,
): Promise<void> {
  try {
    // Fetch the order
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
    }) as Order | null

    if (!order) {
      payload.logger.error(`Order ${orderId} not found for commission calculation`)
      return
    }

    const items = (order.items || []) as OrderItem[]
    const discountAmount = order.discountAmount || 0
    const pointsDiscount = order.pointsDiscount || 0

    // Get all COMPLETED transactions for this order (not just non-cancelled)
    // Commission should only count transactions that have been fully processed
    const transactions = await payload.find({
      collection: 'transactions',
      where: {
        and: [
          { order: { equals: orderId } },
          { status: { equals: 'completed' } },
        ],
      },
      limit: 100,
    })

    payload.logger.info(`Found ${transactions.docs.length} completed transactions for order ${orderId}`)

    // Sum up fees from all non-cancelled transactions
    const totalTransactionFees = transactions.docs.reduce((sum, txn) => {
      const fees = txn.fees || 0
      payload.logger.info(`Transaction ${txn.transactionId}: type=${txn.type}, fees=${fees}`)
      return sum + fees
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
    const currentBreakdown = order.commissionBreakdown || {}
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
        context: {
          skipCommissionCalculation: true,
        },
      })

      payload.logger.info(
        `Order ${orderId} commission updated: Transaction Fees: ${roundedTransactionFees}, Paystack Fees: ${roundedPaystackFees}, Buyer Protection: ${roundedBuyerProtectionFees}, Discount: ${roundedDiscountAmount}, Points: ${roundedPointsDiscount}, Total: ${roundedCommission}`,
      )
    } else {
      payload.logger.info(`Order ${orderId} commission unchanged`)
    }
  } catch (error) {
    payload.logger.error(`Error calculating commission for order ${orderId}: ${error}`)
  }
}
