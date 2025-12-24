import type { CollectionBeforeChangeHook } from 'payload'

// Generate unique order ID: ORD-YYYYMMDD-XXXXXX-XXXX
const generateOrderId = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomUUID().split('-')[0].toUpperCase()
  return `ORD-${dateStr}-${timestamp}-${random}`
}

interface OrderItem {
  quantity?: number
  price?: number
  shippingFee?: number
  buyerProtectionFee?: number
  shippingStatus?: string
  seller?: string | { id: string }
}

export const calculateOrderTotalsAndStatus: CollectionBeforeChangeHook = ({ data, operation }) => {
  // Generate order ID on create
  if (operation === 'create' && !data?.orderId) {
    data.orderId = generateOrderId()
  }

  // Calculate totals from DELIVERED items only
  if (data?.items && Array.isArray(data.items)) {
    const items = data.items as OrderItem[]
    
    // Filter to delivered items only for totals
    const deliveredItems = items.filter((item) => item.shippingStatus === 'delivered')

    // Group delivered items by seller (for shipping fee - one per seller)
    const itemsBySeller = new Map<string, OrderItem[]>()
    for (const item of deliveredItems) {
      const sellerId = item.seller 
        ? (typeof item.seller === 'object' ? item.seller.id : item.seller)
        : 'unknown'
      
      if (!itemsBySeller.has(sellerId)) {
        itemsBySeller.set(sellerId, [])
      }
      itemsBySeller.get(sellerId)!.push(item)
    }

    // Calculate totals from delivered items
    // Total items = sum of quantities from delivered items
    data.totalItems = deliveredItems.reduce((total: number, item: OrderItem) => {
      return total + (item.quantity || 0)
    }, 0)

    // Subtotal = sum of (price × quantity) from delivered items
    const subtotal = deliveredItems.reduce((total: number, item: OrderItem) => {
      const quantity = item.quantity || 0
      const price = item.price || 0
      return total + quantity * price
    }, 0)

    // Total shipping = ONE shipping fee per seller (from first item of each seller)
    let totalShipping = 0
    let totalBuyerProtection = 0
    for (const [, sellerItems] of itemsBySeller) {
      // One shipping fee per seller
      totalShipping += sellerItems[0]?.shippingFee || 0
      // Sum all buyer protection fees
      for (const item of sellerItems) {
        totalBuyerProtection += item.buyerProtectionFee || 0
      }
    }

    // Grand total = subtotal + shipping + buyer protection - discounts
    const discountAmount = data.discountAmount || 0
    const pointsDiscount = data.pointsDiscount || 0
    const grandTotal = subtotal + totalShipping + totalBuyerProtection - discountAmount - pointsDiscount

    data.subtotal = Math.round(subtotal * 100) / 100
    data.grandTotal = Math.round(Math.max(0, grandTotal) * 100) / 100
    data.totalAmount = data.grandTotal // Keep totalAmount in sync

    // Auto-update order status based on item statuses (all items, not just delivered)
    const itemStatuses = items.map((item: OrderItem) => item.shippingStatus)

    if (itemStatuses.length > 0) {
      const allPlaced = itemStatuses.every((status) => status === 'placed')
      const allCancelled = itemStatuses.every(
        (status) => status === 'returned' || status === 'not_available',
      )
      const allFinished = itemStatuses.every(
        (status) => status === 'delivered' || status === 'returned' || status === 'not_available',
      )
      const hasOutForDelivery = itemStatuses.some((status) => status === 'out_for_delivery')
      const hasReturnInProgress = itemStatuses.some((status) => status === 'return_in_progress')

      if (allPlaced) {
        // All items are still placed - order is placed
        data.status = 'placed'
      } else if (allCancelled) {
        // All items returned or not available - order is cancelled (full refund)
        data.status = 'cancelled'
      } else if (allFinished) {
        // All items are either delivered, returned, or not available - order is completed
        data.status = 'completed'
      } else if (hasOutForDelivery || hasReturnInProgress) {
        // Some items are in transit - order is in progress
        data.status = 'in_progress'
      } else {
        // Mixed statuses - order is in progress
        data.status = 'in_progress'
      }
    }
  }

  return data
}
