import type { Payload } from 'payload'

export interface CommissionBreakdown {
  totalTransactionFees: number
  totalPaystackFees: number
  totalBuyerProtectionFees: number
  buyerProtectionCosts: number // Shipping + transfer fees paid from BP on refunds
  discountAmount: number
  pointsDiscount: number
  totalCommission: number
}

/**
 * Calculate commission for an order and return the breakdown
 * Does NOT update the order - caller is responsible for that
 * 
 * Formula:
 * Total Commission = Total Transaction Fees - Total Paystack Fees + (BP Fees - BP Costs) - Discounts
 */
export async function calculateOrderCommission(payload: Payload, orderId: string): Promise<CommissionBreakdown | null> {
  const order = await payload.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
  })

  if (!order) {
    payload.logger.error(`[Commission] Order ${orderId} not found`)
    return null
  }

  const items = (order.items || []) as Array<{ buyerProtectionFee?: number; shippingFee?: number; buyerProtection?: boolean; shippingStatus?: string }>
  const totalBuyerProtectionFees = items.reduce((sum, item) => {
    return sum + (item.buyerProtectionFee || 0)
  }, 0)

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

  // Paystack fees = deposit fees + all transfer fees (costs)
  const totalPaystackFees = transactions.docs.reduce((sum, txn) => {
    return sum + (txn.paystackFees || 0)
  }, 0)

  // Count fees from:
  // - deposit: platform markup (income)
  // - refund: fee deducted from customer refund (income when no BP)
  // Don't count: shipping_payment fees (that's a cost)
  const totalFees = transactions.docs.reduce((sum, txn) => {
    if (txn.type === 'shipping_payment') {
      return sum // Don't count shipping payment fees as income
    }
    return sum + (txn.fees || 0)
  }, 0)

  // Calculate BP costs: shipping + transfer fees for items with BP that were refunded
  let buyerProtectionCosts = 0
  for (const item of items) {
    const isReturned = item.shippingStatus === 'returned' || item.shippingStatus === 'not_available'
    if (item.buyerProtection && isReturned) {
      // BP covers: shipping fee + refund transfer (1) + seller shipping transfer (1)
      const shippingFee = item.shippingFee || 0
      buyerProtectionCosts += shippingFee + 2 // 2 = refund transfer + shipping payment transfer
    }
  }

  const discountAmount = order.discountAmount || 0
  const pointsDiscount = order.pointsDiscount || 0

  // Net BP = what platform keeps from BP after covering refund costs
  const netBuyerProtection = totalBuyerProtectionFees - buyerProtectionCosts
  const totalCommission = totalFees - totalPaystackFees + netBuyerProtection - discountAmount - pointsDiscount

  return {
    totalTransactionFees: totalFees,
    totalPaystackFees,
    totalBuyerProtectionFees,
    buyerProtectionCosts,
    discountAmount,
    pointsDiscount,
    totalCommission,
  }
}
   