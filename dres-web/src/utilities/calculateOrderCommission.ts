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

  const items = (order.items || []) as Array<{ 
    buyerProtectionFee?: number
    shippingFee?: number
    buyerProtection?: boolean
    shippingStatus?: string
    seller?: string | { id: string }
  }>
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

  // Calculate BP costs: only shipping fees for items with BP that were refunded
  // Transfer fees are already counted in totalPaystackFees, so don't include them here
  let buyerProtectionCosts = 0
  
  // Group items by seller
  const itemsBySeller = new Map<string, typeof items>()
  for (const item of items) {
    const sellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
    if (!sellerId) continue
    if (!itemsBySeller.has(sellerId)) {
      itemsBySeller.set(sellerId, [])
    }
    itemsBySeller.get(sellerId)!.push(item)
  }
  
  // Calculate BP costs per seller - only shipping fees, NOT transfer fees
  for (const [, sellerItems] of itemsBySeller) {
    const returnedItems = sellerItems.filter(item => 
      (item.shippingStatus === 'returned' || item.shippingStatus === 'not_available') && item.buyerProtection
    )
    
    if (returnedItems.length === 0) continue
    
    const allSellerItemsReturned = sellerItems.every(item => 
      item.shippingStatus === 'returned' || item.shippingStatus === 'not_available'
    )
    
    if (allSellerItemsReturned) {
      // ALL items returned: BP covers the shipping fee (transfer fees are in Paystack fees)
      const shippingFee = sellerItems.find(item => item.shippingFee && item.shippingFee > 0)?.shippingFee || 0
      buyerProtectionCosts += shippingFee
    }
    // If SOME delivered: shipping goes with order_payment, no cost from BP
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
   