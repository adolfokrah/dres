import type { PayloadHandler } from 'payload'

/**
 * GET /api/styles/:id/stats
 * Get analytics/statistics for a style (for sellers with boosted styles)
 * 
 * Returns:
 * - Overview metrics (views, favorites, sales, revenue, reviews)
 * - Per-variation breakdown
 * - Conversion rate and other insights
 */
export const getStyleStats: PayloadHandler = async (req) => {
  const { payload, user } = req
  const styleId = req.routeParams?.id as string

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!styleId) {
    return Response.json({ error: 'Style ID is required' }, { status: 400 })
  }

  try {
    // Fetch the style to verify ownership
    const style = await payload.findByID({
      collection: 'styles',
      id: styleId,
      depth: 0,
    })

    if (!style) {
      return Response.json({ error: 'Style not found' }, { status: 404 })
    }

    // Check ownership (unless admin)
    const sellerId = typeof style.seller === 'object' ? style.seller?.id : style.seller
    if (user.role !== 'admin' && sellerId !== user.id) {
      return Response.json({ error: 'You can only view stats for your own styles' }, { status: 403 })
    }

    // Get user's currency for display
    let currencySymbol = '₵'
    let currencyCode = 'GHS'
    let exchangeRateToGHS = 1

    if (user?.country) {
      const fullUser = await payload.findByID({
        collection: 'users',
        id: user.id,
        depth: 2,
      })

      const userCountry = fullUser?.country
      if (userCountry && typeof userCountry === 'object') {
        const currency = (userCountry as any).currency
        if (currency && typeof currency === 'object') {
          currencySymbol = currency.symbol || '₵'
          currencyCode = currency.code || 'GHS'
          exchangeRateToGHS = currency.exchangeRateToGHS || 1
        }
      }
    }

    // Helper to convert GHS to user's currency
    const convertGHSToUserCurrency = (amountInGHS: number): number => {
      if (exchangeRateToGHS === 1) return amountInGHS
      return Math.round((amountInGHS / exchangeRateToGHS) * 100) / 100
    }

    // Get all variations for this style
    const variationsResult = await payload.find({
      collection: 'variations',
      where: {
        style: { equals: styleId },
      },
      limit: 100,
      depth: 0,
    })

    const variationIds = variationsResult.docs.map(v => v.id)

    if (variationIds.length === 0) {
      return Response.json({
        success: true,
        style: {
          id: style.id,
          title: style.title,
        },
        overview: {
          totalViews: 0,
          uniqueViewers: 0,
          totalFavorites: 0,
          totalItemsSold: 0,
          totalRevenue: 0,
          totalOrders: 0,
          totalReviews: 0,
          averageRating: 0,
          waitlistCount: 0,
          conversionRate: 0,
          lastSaleAt: null,
        },
        variations: [],
      })
    }

    // Aggregate views from variation-views
    const viewsResult = await payload.find({
      collection: 'variation-views',
      where: {
        variation: { in: variationIds },
      },
      limit: 1000,
      depth: 0,
    })

    // Calculate total views and unique viewers
    let totalViews = 0
    const uniqueViewerIds = new Set<string>()
    const viewsByVariation = new Map<string, { views: number; uniqueViewers: Set<string> }>()

    for (const view of viewsResult.docs) {
      const variationId = typeof view.variation === 'object' ? view.variation?.id : view.variation
      if (!variationId) continue

      const users = (view.users || []) as Array<string | { id: string }>
      const userCount = users.length

      totalViews += userCount

      // Track unique viewers
      for (const u of users) {
        const uid = typeof u === 'object' ? u.id : u
        if (uid) uniqueViewerIds.add(uid)
      }

      // Track per variation
      if (!viewsByVariation.has(variationId)) {
        viewsByVariation.set(variationId, { views: 0, uniqueViewers: new Set() })
      }
      const varViews = viewsByVariation.get(variationId)!
      varViews.views += userCount
      for (const u of users) {
        const uid = typeof u === 'object' ? u.id : u
        if (uid) varViews.uniqueViewers.add(uid)
      }
    }

    // Aggregate favorites
    const favoritesResult = await payload.find({
      collection: 'favorites',
      where: {
        variation: { in: variationIds },
      },
      limit: 1000,
      depth: 0,
    })

    const totalFavorites = favoritesResult.totalDocs
    const favoritesByVariation = new Map<string, number>()
    for (const fav of favoritesResult.docs) {
      const variationId = typeof fav.variation === 'object' ? fav.variation?.id : fav.variation
      if (!variationId) continue
      favoritesByVariation.set(variationId, (favoritesByVariation.get(variationId) || 0) + 1)
    }

    // Aggregate sales from variation-stats (stored in GHS, we'll convert to user currency)
    const statsResult = await payload.find({
      collection: 'variation-stats',
      where: {
        variation: { in: variationIds },
      },
      limit: 1000,
      depth: 0,
    })

    let totalItemsSold = 0
    let totalRevenueGHS = 0
    let totalOrders = 0
    let lastSaleAt: string | null = null
    const salesByVariation = new Map<string, { itemsSold: number; revenueGHS: number; orders: number }>()

    for (const stat of statsResult.docs) {
      const variationId = typeof stat.variation === 'object' ? stat.variation?.id : stat.variation
      if (!variationId) continue

      const itemsSold = (stat.totalItemsSold as number) || 0
      const revenueGHS = (stat.totalSales as number) || 0
      const orders = (stat.totalOrders as number) || 0
      const saleAt = stat.lastSaleAt as string | null

      totalItemsSold += itemsSold
      totalRevenueGHS += revenueGHS
      totalOrders += orders

      if (saleAt && (!lastSaleAt || new Date(saleAt) > new Date(lastSaleAt))) {
        lastSaleAt = saleAt
      }

      if (!salesByVariation.has(variationId)) {
        salesByVariation.set(variationId, { itemsSold: 0, revenueGHS: 0, orders: 0 })
      }
      const varSales = salesByVariation.get(variationId)!
      varSales.itemsSold += itemsSold
      varSales.revenueGHS += revenueGHS
      varSales.orders += orders
    }

    // Get reviews for the style
    const reviewsResult = await payload.find({
      collection: 'reviews',
      where: {
        style: { equals: styleId },
      },
      limit: 1000,
      depth: 0,
    })

    const totalReviews = reviewsResult.totalDocs
    let averageRating = 0
    if (totalReviews > 0) {
      const sumRatings = reviewsResult.docs.reduce((sum, r) => sum + ((r.rating as number) || 0), 0)
      averageRating = Math.round((sumRatings / totalReviews) * 10) / 10
    }

    // Get waitlist (stock notifications) for SKUs of these variations
    // First get all SKUs for these variations
    const skusResult = await payload.find({
      collection: 'skus',
      where: {
        variation: { in: variationIds },
      },
      limit: 500,
      depth: 0,
    })
    const skuIds = skusResult.docs.map(s => s.id)

    let waitlistCount = 0
    const waitlistByVariation = new Map<string, number>()

    if (skuIds.length > 0) {
      const notificationsResult = await payload.find({
        collection: 'stock-notifications',
        where: {
          sku: { in: skuIds },
        },
        limit: 1000,
        depth: 0,
      })
      waitlistCount = notificationsResult.totalDocs

      // Map SKU to variation for waitlist by variation
      const skuToVariation = new Map<string, string>()
      for (const sku of skusResult.docs) {
        const varId = typeof sku.variation === 'object' ? sku.variation?.id : sku.variation
        if (varId) skuToVariation.set(sku.id, varId)
      }

      for (const notif of notificationsResult.docs) {
        const skuId = typeof notif.sku === 'object' ? notif.sku?.id : notif.sku
        if (!skuId) continue
        const variationId = skuToVariation.get(skuId)
        if (variationId) {
          waitlistByVariation.set(variationId, (waitlistByVariation.get(variationId) || 0) + 1)
        }
      }
    }

    // Calculate conversion rate (orders / unique viewers * 100)
    // This shows what % of unique viewers made a purchase
    const conversionRate = uniqueViewerIds.size > 0 
      ? Math.round((totalOrders / uniqueViewerIds.size) * 10000) / 100 
      : 0

    // Build per-variation breakdown
    const variationsBreakdown = variationsResult.docs.map(v => {
      const views = viewsByVariation.get(v.id)
      const favorites = favoritesByVariation.get(v.id) || 0
      const sales = salesByVariation.get(v.id)
      const waitlist = waitlistByVariation.get(v.id) || 0

      const varViews = views?.views || 0
      const varUniqueViewers = views?.uniqueViewers.size || 0
      const varItemsSold = sales?.itemsSold || 0
      const varRevenueGHS = sales?.revenueGHS || 0
      const varOrders = sales?.orders || 0
      // Conversion rate per variation: orders / unique viewers
      const varConversion = varUniqueViewers > 0 
        ? Math.round((varOrders / varUniqueViewers) * 10000) / 100 
        : 0

      return {
        id: v.id,
        title: v.title || 'Untitled',
        slug: v.slug,
        views: varViews,
        uniqueViewers: varUniqueViewers,
        favorites,
        itemsSold: varItemsSold,
        revenue: convertGHSToUserCurrency(varRevenueGHS),
        orders: varOrders,
        waitlist,
        conversionRate: varConversion,
      }
    })

    // Sort variations by views (most viewed first)
    variationsBreakdown.sort((a, b) => b.views - a.views)

    return Response.json({
      success: true,
      style: {
        id: style.id,
        title: style.title,
      },
      overview: {
        totalViews,
        uniqueViewers: uniqueViewerIds.size,
        totalFavorites,
        totalItemsSold,
        totalRevenue: convertGHSToUserCurrency(totalRevenueGHS),
        totalOrders,
        totalReviews,
        averageRating,
        waitlistCount,
        conversionRate,
        lastSaleAt,
      },
      variations: variationsBreakdown,
      currency: {
        symbol: currencySymbol,
        code: currencyCode,
      },
    })
  } catch (error) {
    payload.logger.error(`Error fetching style stats: ${error}`)
    return Response.json(
      { error: 'Failed to fetch style stats' },
      { status: 500 },
    )
  }
}
