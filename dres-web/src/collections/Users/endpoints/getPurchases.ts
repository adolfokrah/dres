import type { PayloadHandler } from 'payload'

interface PurchaseItem {
  id: string
  variationId: string
  variationTitle: string | null
  imageUrl: string | null
  styleName: string | null
  brandName: string | null
  size: string | null
  color: string | null
  price: number
  quantity: number
  status: string
}

interface PurchaseOrder {
  id: string
  orderId: string
  status: string
  items: PurchaseItem[]
  shippingAddress: {
    city: string | null
    region: string | null
  } | null
  totalAmount: number
  createdAt: string
}

/**
 * GET /api/users/:id/purchases
 * Fetch user's purchase history (orders as a buyer)
 * 
 * Query params:
 * - status: Filter by order status (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
export const getUserPurchases: PayloadHandler = async (req) => {
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

  // Check authorization - users can only view their own purchases
  if (!user) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  if (user.role !== 'admin' && user.id !== id) {
    return Response.json(
      { error: 'Forbidden - You can only view your own purchases' },
      { status: 403 }
    )
  }

  try {
    // Build query
    const where: any = {
      customer: { equals: id },
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

    // Debug: log first order structure
    if (ordersResult.docs.length > 0) {
      const firstOrder = ordersResult.docs[0] as any
      payload.logger.info(`First order shippingDetails: ${JSON.stringify(firstOrder.shippingDetails)}`)
      if (firstOrder.items?.[0]) {
        const firstItem = firstOrder.items[0]
        payload.logger.info(`First item variationImage: ${firstItem.variationImage}`)
        payload.logger.info(`First item variation type: ${typeof firstItem.variation}`)
      }
    }

    // Transform orders to simplified purchase format
    const purchases: PurchaseOrder[] = ordersResult.docs.map((order: any) => {
      // Extract shipping address info from shippingDetails
      let shippingAddress = null
      if (order.shippingDetails) {
        shippingAddress = {
          city: order.shippingDetails.city || null,
          region: order.shippingDetails.region || null,
        }
      }

      // Transform items
      const items: PurchaseItem[] = (order.items || []).map((item: any) => {
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
          quantity: item.quantity || 1,
          status: item.status || 'pending',
        }
      })

      return {
        id: order.id,
        orderId: order.orderId,
        status: order.status,
        items,
        shippingAddress,
        totalAmount: order.totalAmount || 0,
        createdAt: order.createdAt,
      }
    })

    return Response.json({
      docs: purchases,
      totalDocs: ordersResult.totalDocs,
      totalPages: ordersResult.totalPages,
      page: ordersResult.page,
      limit: ordersResult.limit,
      hasNextPage: ordersResult.hasNextPage,
      hasPrevPage: ordersResult.hasPrevPage,
    })
  } catch (error: any) {
    payload.logger.error(`Error fetching purchases: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch purchases',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
