import type { Payload } from 'payload'

export async function getSellerData(payload: Payload, seller: any) {
  if (!seller) return null

  // Get sales history from orders
  const allOrders = await payload.find({
    collection: 'orders',
    where: {
      sellers: {
        contains: seller.id,
      },
    },
    limit: 1000,
  })

  // Count items by status
  let itemsSold = 0
  let shipped = 0
  let cancelled = 0

  allOrders.docs.forEach((order: any) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
        if (itemSellerId === seller.id) {
          itemsSold += item.quantity || 1
          if (item.shippingStatus === 'delivered' || item.shippingStatus === 'out_for_delivery') {
            shipped += item.quantity || 1
          } else if (item.shippingStatus === 'returned' || item.shippingStatus === 'not_available') {
            cancelled += item.quantity || 1
          }
        }
      })
    }
  })

  return {
    id: seller.id,
    name: (seller as any).shopName || (seller as any).firstName || '',
    username: `@${(seller as any).username || 'user'}`,
    profileImage: typeof (seller as any).photo === 'object' ? (seller as any).photo?.url || null : null,
    verified: true,
    vacationMode: (seller as any).vacationMode || false,
    usuallyShipsIn: '24 hours',
    salesHistory: {
      itemsSold: itemsSold,
      shipped: shipped,
      cancelled: cancelled,
    },
    memberSince: seller.createdAt,
  }
}
