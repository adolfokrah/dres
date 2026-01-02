import type { PayloadHandler } from 'payload'

interface SellerGroup {
  sellerId: string
  sellerName: string
  sellerImage: string | null
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
}

/**
 * GET /api/orders/:id/purchase-details
 * Get complete purchase details with items grouped by seller and delivery codes
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

    // Fetch all delivery codes for this order
    const deliveryCodes = await payload.find({
      collection: 'delivery-codes' as any,
      where: {
        order: { equals: orderId },
      },
      depth: 0,
    })

    // Create a map of sellerId -> code
    const codesBySeller: Record<string, string> = {}
    for (const doc of deliveryCodes.docs as any[]) {
      const sellerId = typeof doc.seller === 'object' ? doc.seller.id : doc.seller
      if (sellerId) {
        codesBySeller[sellerId] = doc.code
      }
    }

    // Group items by seller
    const items = (order.items || []) as any[]
    const sellerGroupsMap = new Map<string, SellerGroup>()

    for (const item of items) {
      const seller = item.seller || {}
      const sellerId = typeof seller === 'object' ? seller.id : seller

      if (!sellerId) continue

      if (!sellerGroupsMap.has(sellerId)) {
        // Get seller info from item (stored at purchase time) or from relation
        const sellerName = item.sellerName || seller.firstName || seller.username || 'Unknown Seller'
        const sellerImage = item.sellerImage || seller.profilePhoto?.url || null

        sellerGroupsMap.set(sellerId, {
          sellerId,
          sellerName,
          sellerImage,
          isTrustedSeller: seller.trustedSeller || false,
          items: [],
          shippingFee: item.shippingFee || 0, // One shipping fee per seller
          buyerProtectionFee: 0,
          itemsTotal: 0,
          total: 0,
          deliveryCode: codesBySeller[sellerId] || null,
        })
      }

      const group = sellerGroupsMap.get(sellerId)!
      
      // Add item to group
      group.items.push({
        id: item.id,
        productTitle: item.productTitle,
        variationTitle: item.variationTitle,
        variationImage: item.variationImage,
        skuTitle: item.skuTitle,
        quantity: item.quantity,
        price: item.price,
        shippingStatus: item.shippingStatus,
        statusLogs: item.statusLogs || [],
        buyerProtectionFee: item.buyerProtectionFee || 0,
      })

      // Accumulate totals
      group.buyerProtectionFee += item.buyerProtectionFee || 0
      group.itemsTotal += (item.price || 0) * (item.quantity || 1)
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
    }

    return Response.json(purchaseDetails)
  } catch (error) {
    payload.logger.error(`Error fetching purchase details: ${error}`)
    return Response.json({ error: 'Failed to fetch purchase details' }, { status: 500 })
  }
}
