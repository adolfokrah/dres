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
  originalPrice: number
  quantity: number
  status: string
}

interface Purchase {
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
 * GET /api/orders/purchases
 * Fetch user's purchases (orders where user is the customer)
 * 
 * Query params:
 * - status: Filter by status (optional)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
export const getPurchases: PayloadHandler = async (req) => {
  const { payload, user } = req
  const url = new URL(req.url || '', 'http://localhost')
  const status = url.searchParams.get('status')
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '10', 10)

  // Check authorization
  if (!user) {
    return Response.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const userId = user.id

  try {
    // Build query - find orders where user is the customer
    const where: any = {
      customer: { equals: userId },
    }

    // Filter by status if provided
    if (status && status !== 'all') {
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

    // Transform orders to simplified purchase format
    const purchases: Purchase[] = ordersResult.docs.map((order: any) => {
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
          originalPrice: item.originalPrice || 0,
          quantity: item.quantity || 1,
          status: item.shippingStatus || 'placed',
        }
      })

      // Calculate total
      const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)

      return {
        id: order.id,
        orderId: order.orderId,
        status: order.status,
        items,
        shippingAddress,
        totalAmount,
        createdAt: order.createdAt,
      }
    })

    return Response.json({
      docs: purchases,
      totalDocs: ordersResult.totalDocs ?? purchases.length,
      totalPages: ordersResult.totalPages ?? 1,
      page: ordersResult.page ?? page,
      limit,
      hasNextPage: ordersResult.hasNextPage ?? false,
      hasPrevPage: ordersResult.hasPrevPage ?? page > 1,
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
