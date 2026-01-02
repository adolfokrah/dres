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
  sellerStatus: string // Status based on seller's items only
  items: IncomingOrderItem[]
  shippingAddress: {
    city: string | null
    region: string | null
  } | null
  totalAmount: number
  createdAt: string
}

/**
 * GET /api/orders/incoming
 * Fetch seller's incoming orders (orders where user is the seller of items)
 * 
 * Query params:
 * - status: Filter by status (optional)
 *   - 'new' or 'placed': Show orders with items in 'placed' shippingStatus (pending items)
 *   - 'in_progress': Show orders with items in 'out_for_delivery' status
 *   - 'completed': Show completed orders
 *   - 'cancelled': Show cancelled orders
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
export const getIncomingOrders: PayloadHandler = async (req) => {
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

  const sellerId = user.id

  try {
    // Build query - find orders where user is in the sellers array
    const where: any = {
      sellers: { contains: sellerId },
    }

    // Map filter status to order-level status for initial query
    // We'll do additional filtering by item shippingStatus after fetching
    if (status === 'completed') {
      where.status = { equals: 'completed' }
    } else if (status === 'cancelled') {
      where.status = { equals: 'cancelled' }
    }
    // For 'new'/'placed' and 'in_progress', we need to fetch all non-completed orders
    // and filter by item shippingStatus

    // Fetch orders with populated relationships
    const ordersResult = await payload.find({
      collection: 'orders',
      where,
      sort: '-createdAt',
      page,
      limit: status === 'new' || status === 'placed' || status === 'in_progress' ? 100 : limit, // Fetch more for post-filtering
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
      let filteredItems = (order.items || [])
        .filter((item: any) => {
          const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
          return itemSellerId === sellerId
        })

      // Apply item-level status filter
      if (status === 'new' || status === 'placed') {
        // Show only items with 'placed' shippingStatus (new/pending items)
        filteredItems = filteredItems.filter((item: any) => 
          item.shippingStatus === 'placed' || item.shippingStatus === 'new'
        )
      } else if (status === 'in_progress') {
        // Show only items that are out for delivery
        filteredItems = filteredItems.filter((item: any) => 
          item.shippingStatus === 'out_for_delivery'
        )
      }

      const items: IncomingOrderItem[] = filteredItems.map((item: any) => {
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

      // Calculate seller-specific status based on seller's items only
      const itemStatuses = items.map(item => item.status)
      let sellerStatus: string
      
      const completedStatuses = ['delivered', 'returned', 'not_available', 'cancelled']
      const allCompleted = itemStatuses.length > 0 && itemStatuses.every(s => completedStatuses.includes(s))
      const hasOutForDelivery = itemStatuses.some(s => s === 'out_for_delivery')
      const hasReturnInProgress = itemStatuses.some(s => s === 'return_in_progress')
      const allPlaced = itemStatuses.every(s => s === 'placed' || s === 'new')
      const allCancelled = itemStatuses.every(s => s === 'cancelled' || s === 'not_available')
      
      if (allCancelled) {
        sellerStatus = 'cancelled'
      } else if (allCompleted) {
        sellerStatus = 'completed'
      } else if (hasReturnInProgress) {
        sellerStatus = 'return_in_progress'
      } else if (hasOutForDelivery) {
        sellerStatus = 'in_progress'
      } else if (allPlaced) {
        sellerStatus = 'placed'
      } else {
        sellerStatus = 'in_progress' // Mixed statuses default to in_progress
      }

      return {
        id: order.id,
        orderId: order.orderId,
        status: order.status,
        sellerStatus,
        items,
        shippingAddress,
        totalAmount: sellerTotalAmount,
        createdAt: order.createdAt,
      }
    }).filter((order: IncomingOrder) => order.items.length > 0) // Only include orders with seller's items

    // Apply pagination for post-filtered results
    const needsPostFilterPagination = status === 'new' || status === 'placed' || status === 'in_progress'
    let paginatedOrders = incomingOrders
    let totalDocs = incomingOrders.length
    let totalPages = Math.ceil(totalDocs / limit)
    let currentPage = page
    let hasNextPage = false
    let hasPrevPage = page > 1

    if (needsPostFilterPagination) {
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      paginatedOrders = incomingOrders.slice(startIndex, endIndex)
      hasNextPage = endIndex < totalDocs
    } else {
      paginatedOrders = incomingOrders
      totalDocs = ordersResult.totalDocs ?? incomingOrders.length
      totalPages = ordersResult.totalPages ?? 1
      currentPage = ordersResult.page ?? page
      hasNextPage = ordersResult.hasNextPage ?? false
      hasPrevPage = ordersResult.hasPrevPage ?? page > 1
    }

    return Response.json({
      docs: paginatedOrders,
      totalDocs,
      totalPages,
      page: currentPage,
      limit,
      hasNextPage,
      hasPrevPage,
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
