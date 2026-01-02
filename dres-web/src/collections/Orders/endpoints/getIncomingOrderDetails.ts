import type { PayloadHandler } from 'payload'

interface IncomingOrderItem {
  id: string
  variationId: string | null
  variationTitle: string | null
  brandName: string | null
  skuTitle: string | null
  imageUrl: string | null
  price: number
  originalPrice: number
  quantity: number
  shippingFee: number
  shippingStatus: string
  returnReason: string | null
  returnImage: string | null
  statusLogs: Array<{ status: string; timestamp: string; note?: string }>
}

interface IncomingOrderDetails {
  id: string
  orderId: string
  status: string
  items: IncomingOrderItem[]
  shipping: {
    customerName: string
    address: string
    city: string | null
    region: string | null
    phone: string | null
  } | null
  itemCount: number
  itemsTotal: number
  shippingFee: number
  subtotal: number
  createdAt: string
}

/**
 * GET /api/orders/:id/incoming-details/:sellerId
 * Fetch incoming order details for seller (only shows seller's items)
 */
export const getIncomingOrderDetails: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req
  const orderId = routeParams?.id as string
  const sellerId = routeParams?.sellerId as string

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!sellerId) {
    return Response.json({ error: 'Seller ID is required' }, { status: 400 })
  }

  if (!orderId) {
    return Response.json({ error: 'Order ID is required' }, { status: 400 })
  }

  // Check authorization - users can only view their own incoming orders
  if (user.role !== 'admin' && user.id !== sellerId) {
    return Response.json({ error: 'Forbidden - You can only view your own incoming orders' }, { status: 403 })
  }

  try {
    // Get the order with populated relationships
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 3,
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user is a seller in this order
    const sellers = order.sellers as Array<string | { id: string }>
    const sellerIds = sellers?.map(s => typeof s === 'object' ? s.id : s) || []
    
    if (user.role !== 'admin' && !sellerIds.includes(sellerId)) {
      return Response.json({ error: 'Not authorized to view this order' }, { status: 403 })
    }

    // Filter items to only show seller's items (or all for admin)
    const allItems = (order.items || []) as any[]
    const sellerItems = allItems.filter((item: any) => {
          const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
          return itemSellerId === sellerId
        })

    // Transform items
    const items: IncomingOrderItem[] = sellerItems.map((item: any) => {
      // Get variation details
      const variation = item.variation
      let imageUrl = item.variationImage || null

      if (!imageUrl && variation && typeof variation === 'object') {
        if (variation.images && variation.images.length > 0) {
          const firstImage = variation.images[0]
          if (firstImage?.image) {
            imageUrl = typeof firstImage.image === 'object' 
              ? firstImage.image.url 
              : firstImage.image
          }
        }
      }

      // Get return image URL if exists
      let returnImageUrl = null
      if (item.returnImage) {
        const returnImg = item.returnImage
        returnImageUrl = typeof returnImg === 'object' ? returnImg.url : returnImg
      }

      // Map return reason value to label
      const returnReasonLabels: Record<string, string> = {
        'wrong_item': 'Wrong item sent',
        'fake_item': 'Fake / Not Authentic',
        'damaged': 'Item arrived damaged',
        'not_as_described': 'Item not as described',
      }
      const returnReasonLabel = item.returnReason ? returnReasonLabels[item.returnReason] || item.returnReason : null

      return {
        id: item.id,
        variationId: typeof variation === 'object' ? variation.id : variation,
        variationTitle: item.variationTitle || null,
        brandName: item.brandName || null,
        skuTitle: item.skuTitle || null,
        imageUrl,
        price: item.price || 0,
        originalPrice: item.originalPrice || 0,
        quantity: item.quantity || 1,
        shippingFee: item.shippingFee || 0,
        shippingStatus: item.shippingStatus || 'placed',
        returnReason: returnReasonLabel,
        returnImage: returnImageUrl,
        statusLogs: item.statusLogs || [],
      }
    })

    // Calculate totals for seller's items only (only placed, delivered, out_for_delivery)
    // Use originalPrice (seller's price) not selling price for incoming orders
    const eligibleItems = items.filter(item => 
      item.shippingStatus === 'placed' || 
      item.shippingStatus === 'new' ||
      item.shippingStatus === 'delivered' || 
      item.shippingStatus === 'out_for_delivery'
    )
    const itemCount = eligibleItems.length
    const itemsTotal = eligibleItems.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0)
    // Only count shipping fee once (from first eligible item)
    const shippingFee = eligibleItems.length > 0 ? eligibleItems[0].shippingFee : 0
    const subtotal = itemsTotal + shippingFee

    // Get shipping details
    const shippingDetails = order.shippingDetails as any
    let shipping = null
    if (shippingDetails) {
      shipping = {
        customerName: shippingDetails.fullName || '',
        address: shippingDetails.address || '',
        city: shippingDetails.city || null,
        region: shippingDetails.region || null,
        phone: shippingDetails.phone || null,
      }
    }

    const response: IncomingOrderDetails = {
      id: order.id,
      orderId: order.orderId as string,
      status: order.status as string,
      items,
      shipping,
      itemCount,
      itemsTotal: Math.round(itemsTotal * 100) / 100,
      shippingFee: Math.round(shippingFee * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      createdAt: order.createdAt as string,
    }

    return Response.json(response)
  } catch (error) {
    payload.logger.error(`Error fetching incoming order details: ${error}`)
    return Response.json({ error: 'Failed to fetch order details' }, { status: 500 })
  }
}
