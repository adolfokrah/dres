import type { PayloadHandler } from 'payload'

interface SellerGroup {
  sellerId: string
  sellerName: string
  sellerImage: string | null
  sellerPhone: string | null
  isTrustedSeller: boolean
  items: any[]
  shippingFee: number
  buyerProtectionFee: number
  itemsTotal: number
  total: number
  deliveryCode: string | null
}

interface PurchaseDetails {
  order: {
    id: string
    orderId: string
    status: string
    createdAt: string
    updatedAt: string
  }
  shippingAddress: any | null
  sellerGroups: SellerGroup[]
  summary: {
    totalItems: number
    subtotal: number
    totalShipping: number
    totalBuyerProtection: number
    totalDiscount: number
    grandTotal: number
  }
  currencySymbol: string
}

/**
 * GET /api/orders/:id/purchase-details
 * Get complete purchase details with items grouped by seller and delivery codes per seller
 */
export const getPurchaseDetails: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req
  const orderId = routeParams?.id as string

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!orderId) {
    return Response.json({ error: 'Order ID is required' }, { status: 400 })
  }

  try {
    // Fetch the order with depth for populated relations
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 3,
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user is the buyer or admin
    const customerId = typeof order.customer === 'object' ? (order.customer as any).id : order.customer
    if (user.role !== 'admin' && user.id !== customerId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch all delivery codes for this order (one per seller)
    const deliveryCodesResult = await payload.find({
      collection: 'delivery-codes' as any,
      where: {
        order: { equals: orderId },
      },
      limit: 100,
      depth: 0,
    })
    
    // Map seller ID to delivery code
    const deliveryCodesBySeller = new Map<string, string>()
    for (const doc of deliveryCodesResult.docs) {
      const codeDoc = doc as any
      const sellerId = typeof codeDoc.seller === 'object' ? codeDoc.seller.id : codeDoc.seller
      if (sellerId) {
        deliveryCodesBySeller.set(sellerId, codeDoc.code)
      }
    }

    // Group items by seller
    const items = (order.items || []) as any[]
    const sellerGroupsMap = new Map<string, SellerGroup>()

    // Collect unique seller IDs to fetch their photos
    const sellerIds = new Set<string>()
    for (const item of items) {
      const seller = item.seller || {}
      const sellerId = typeof seller === 'object' ? seller.id : seller
      if (sellerId) sellerIds.add(sellerId)
    }

    // Fetch all sellers with their photos in one query
    const sellersMap = new Map<string, any>()
    if (sellerIds.size > 0) {
      const sellersResult = await payload.find({
        collection: 'users',
        where: {
          id: { in: Array.from(sellerIds) },
        },
        depth: 1, // To get photo.url
        limit: sellerIds.size,
      })
      for (const seller of sellersResult.docs) {
        sellersMap.set(seller.id, seller)
      }
    }

    for (const item of items) {
      const itemSeller = item.seller || {}
      const sellerId = typeof itemSeller === 'object' ? itemSeller.id : itemSeller

      if (!sellerId) continue

      // Get full seller data from our fetched map
      const seller = sellersMap.get(sellerId) || itemSeller

      if (!sellerGroupsMap.has(sellerId)) {
        // Get seller info from item (stored at purchase time) or from relation
        // Priority: stored sellerName > shopName > firstName lastName > username
        let sellerName = item.sellerName
        if (!sellerName && typeof seller === 'object') {
          sellerName = seller.shopName ||
            `${seller.firstName || ''} ${seller.lastName || ''}`.trim() ||
            seller.username ||
            'Unknown Seller'
        }
        sellerName = sellerName || 'Unknown Seller'

        // Get seller image - check stored image, then fetched seller's photo
        let sellerImage = item.sellerImage || null
        if (!sellerImage && seller.photo) {
          if (typeof seller.photo === 'object' && seller.photo.url) {
            sellerImage = seller.photo.url
          }
        }

        const sellerPhone = typeof seller === 'object' ? seller.phone || null : null

        sellerGroupsMap.set(sellerId, {
          sellerId,
          sellerName,
          sellerImage,
          sellerPhone,
          isTrustedSeller: seller.trustedSeller || false,
          items: [],
          shippingFee: item.shippingFee || 0, // One shipping fee per seller
          buyerProtectionFee: 0,
          itemsTotal: 0,
          total: 0,
          deliveryCode: deliveryCodesBySeller.get(sellerId) || null,
        })
      }

      const group = sellerGroupsMap.get(sellerId)!
      
      // Calculate item total
      const itemTotal = (item.price || 0) * (item.quantity || 1)
      
      // Add item to group
      group.items.push({
        id: item.id,
        productTitle: item.productTitle,
        variationTitle: item.variationTitle,
        variationImage: item.variationImage,
        skuTitle: item.skuTitle,
        quantity: item.quantity,
        price: item.price,
        total: itemTotal,
        shippingStatus: item.shippingStatus,
        statusLogs: item.statusLogs || [],
        buyerProtectionFee: item.buyerProtectionFee || 0,
      })

      // Accumulate totals
      group.buyerProtectionFee += item.buyerProtectionFee || 0
      group.itemsTotal += itemTotal
    }

    // Calculate totals for each group
    const sellerGroups: SellerGroup[] = []
    for (const group of sellerGroupsMap.values()) {
      group.total = group.itemsTotal + group.shippingFee + group.buyerProtectionFee
      sellerGroups.push(group)
    }

    // Calculate summary
    const summary = {
      totalItems: order.totalItems || items.length,
      subtotal: order.subtotal || 0,
      totalShipping: sellerGroups.reduce((sum, g) => sum + g.shippingFee, 0),
      totalBuyerProtection: sellerGroups.reduce((sum, g) => sum + g.buyerProtectionFee, 0),
      totalDiscount: (order.discountAmount || 0) + (order.pointsDiscount || 0),
      grandTotal: order.grandTotal || 0,
    }

    // Get currency symbol from order's currency relation
    const currency = order.currency as { symbol?: string; code?: string } | string | null
    let currencySymbol = '₵' // Default to Ghana Cedi
    if (currency && typeof currency === 'object' && currency.symbol) {
      currencySymbol = currency.symbol
    }

    const purchaseDetails: PurchaseDetails = {
      order: {
        id: order.id,
        orderId: order.orderId || '',
        status: order.status || 'new',
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
      shippingAddress: (order as any).shippingAddress || null,
      sellerGroups,
      summary,
      currencySymbol,
    }

    return Response.json(purchaseDetails)
  } catch (error) {
    payload.logger.error(`Error fetching purchase details: ${error}`)
    return Response.json({ error: 'Failed to fetch purchase details' }, { status: 500 })
  }
}
