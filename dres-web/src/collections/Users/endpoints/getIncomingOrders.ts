import type { PayloadHandler } from 'payload'

interface IncomingOrderItem {
  id: string
  variationId: string
  variationTitle: string | null
  imageUrl: string | null
  styleName: string | null
  brandName: string | null
  size: string | null
  color: string | null
  price: number
  originalPrice: number
  quantity: number
  status: string
}

interface IncomingOrder {
  id: string
  orderId: string
  status: string
  items: IncomingOrderItem[]
  shippingAddress: {
    city: string | null
    region: string | null
  } | null
  totalAmount: number
  createdAt: string
}

/**
 * GET /api/users/:id/incoming-orders
 * Fetch seller's incoming orders (orders where user is the seller of items)
 * 
 * Query params:
 * - status: Filter by order status (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
export const getUserIncomingOrders: PayloadHandler = async (req) => {
  const { payload, user } = req
  const { id } = req.routeParams || {}
  const url = new URL(req.url || '', 'http://localhost')
  const status = url.searchParams.get('status')
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '10', 10)

  if (!id) {
    return Response.json(
      { error: 'User ID is required' },
      { status: 400 }
    )
  }

  // Check authorization - users can only view their own incoming orders
  if (!user) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (user.role !== 'admin' && user.id !== id) {
    return Response.json(
      { error: 'Forbidden - You can only view your own incoming orders' },
      { status: 403 }
    )
  }

  try {
    // Build query - find orders where user is in the sellers array
    const where: any = {
      sellers: { contains: id },
    }

    // Add status filter if provided
    if (status) {
      where.status = { equals: status }
    }

    // Fetch orders with populated relationships
    const ordersResult = await payload.find({
      collection: 'orders',
      where,
      sort: '-createdAt',
      page,
      limit,
      depth: 3, // Get nested relationships
    })

    // Transform orders to simplified incoming order format
    // Only include items where the user is the seller
    const incomingOrders: IncomingOrder[] = ordersResult.docs.map((order: any) => {
      // Extract shipping address info from shippingDetails
      let shippingAddress = null
      if (order.shippingDetails) {
        shippingAddress = {
          city: order.shippingDetails.city || null,
          region: order.shippingDetails.region || null,
        }
      }

      // Filter and transform items - only include items where user is the seller
      const items: IncomingOrderItem[] = (order.items || [])
        .filter((item: any) => {
          const sellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
          return sellerId === id
        })
        .map((item: any) => {
          // Get variation details
          const variation = item.variation
          let imageUrl = item.variationImage || null // Use stored image URL first
          let styleName = null
          let brandName = null

          if (variation && typeof variation === 'object') {
            // If no stored image, try to get from variation
            if (!imageUrl && variation.images && variation.images.length > 0) {
              const firstImage = variation.images[0]
              if (firstImage?.image) {
                imageUrl = typeof firstImage.image === 'object' 
                  ? firstImage.image.url 
                  : firstImage.image
              }
            }

            // Get style and brand
            if (variation.style && typeof variation.style === 'object') {
              styleName = variation.style.name
              if (variation.style.brand && typeof variation.style.brand === 'object') {
                brandName = variation.style.brand.name
              }
            }
          }

          // Use stored brandName if available
          if (!brandName && item.brandName) {
            brandName = item.brandName
          }

          return {
            id: item.id,
            variationId: typeof variation === 'object' ? variation.id : variation,
            variationTitle: item.variationTitle || (typeof variation === 'object' ? variation.title : null),
            imageUrl,
            styleName,
            brandName,
            size: item.size,
            color: item.color,
            price: item.price || 0,
            originalPrice: item.originalPrice || 0,
            quantity: item.quantity || 1,
            status: item.shippingStatus || 'placed',
          }
        })

      // Calculate total for seller's items only
      const sellerTotalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        id: order.id,
        orderId: order.orderId,
        status: order.status,
        items,
        shippingAddress,
        totalAmount: sellerTotalAmount,
        createdAt: order.createdAt,
      }
    }).filter((order: IncomingOrder) => order.items.length > 0) // Only include orders with seller's items

    return Response.json({
      docs: incomingOrders,
      totalDocs: ordersResult.totalDocs,
      totalPages: ordersResult.totalPages,
      page: ordersResult.page,
      limit: ordersResult.limit,
      hasNextPage: ordersResult.hasNextPage,
      hasPrevPage: ordersResult.hasPrevPage,
    })
  } catch (error: any) {
    payload.logger.error(`Error fetching incoming orders: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch incoming orders',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
