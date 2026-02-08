import type { Payload } from 'payload'
import { formatCompactNumberWithPlus } from '../../../utilities/formatNumber'

export async function getSellerData(payload: Payload, sellerId: string | null) {
  if (!sellerId) return null

  // Fetch the seller user
  const seller = await payload.findByID({
    collection: 'users',
    id: sellerId,
    depth: 2,
  })

  if (!seller) return null

  // Get sales history from orders
  const allOrders = await payload.find({
    collection: 'orders',
    where: {
      sellers: {
        contains: sellerId,
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
        if (itemSellerId === sellerId) {
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

  // Build full name
  const firstName = (seller as any).firstName || ''
  const lastName = (seller as any).lastName || ''
  const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'User'

  return {
    id: seller.id,
    name: (seller as any).shopName || fullName,
    username: (seller as any).username || null,
    profileImage: typeof (seller as any).photo === 'object' ? (seller as any).photo?.url || null : null,
    trustedSeller: (seller as any).trustedSeller || false,
    vacationMode: (seller as any).vacationMode || false,
    usuallyShipsIn: '24 hours',
    salesHistory: {
      itemsSold: formatCompactNumberWithPlus(itemsSold),
      shipped: formatCompactNumberWithPlus(shipped),
      cancelled: formatCompactNumberWithPlus(cancelled),
    },
    memberSince: seller.createdAt,
  }
}
