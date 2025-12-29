import type { PayloadHandler } from 'payload'

/**
 * GET /api/variations/:id/seller
 * Fetch the seller information for a variation's style
 */
export const getVariationSeller: PayloadHandler = async (req) => {
  const { payload } = req
  const { id } = req.routeParams || {}

  if (!id) {
    return Response.json(
      { error: 'Variation ID is required' },
      { status: 400 }
    )
  }

  try {
    // Fetch the variation
    const variation = await payload.findByID({
      collection: 'variations',
      id: id as string,
      depth: 1,
    })

    if (!variation) {
      return Response.json(
        { error: 'Variation not found' },
        { status: 404 }
      )
    }

    // Get the style ID
    const styleId = typeof variation.style === 'object' ? variation.style.id : variation.style

    if (!styleId) {
      return Response.json(
        { error: 'Style not found for this variation' },
        { status: 404 }
      )
    }

    // Fetch the style with seller information
    const style = await payload.findByID({
      collection: 'styles',
      id: styleId,
      depth: 3, // Deep enough to get full seller data
    })

    if (!style) {
      return Response.json(
        { error: 'Style not found' },
        { status: 404 }
      )
    }

    // Extract seller information
    const seller = typeof style.seller === 'object' ? style.seller : null

    if (!seller) {
      return Response.json(
        { error: 'Seller not found for this style' },
        { status: 404 }
      )
    }

    // Get sales history from orders
    const allOrders = await payload.find({
      collection: 'orders',
      where: {
        sellers: {
          contains: seller.id,
        },
      },
      limit: 1000, // Get enough orders to count items
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

    // Return seller data
    return Response.json({
      seller: {
        id: seller.id,
        name: (seller as any).shopName || (seller as any).firstName || '',
        username: `@${(seller as any).username || 'user'}`,
        profileImage: typeof (seller as any).photo === 'object' ? (seller as any).photo?.url || null : null,
        verified: true, // Default to true for now
        vacationMode: (seller as any).vacationMode || false,
        usuallyShipsIn: '24 hours',
        salesHistory: {
          itemsSold: itemsSold,
          shipped: shipped,
          cancelled: cancelled,
        },
        memberSince: seller.createdAt,
      }
    })

  } catch (error: any) {
    console.error('Error fetching variation seller:', error)
    return Response.json(
      { error: 'Failed to fetch seller information', details: error.message },
      { status: 500 }
    )
  }
}
