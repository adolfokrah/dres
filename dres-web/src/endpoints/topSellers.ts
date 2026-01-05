import type { PayloadHandler } from 'payload'

/**
 * GET /api/top-sellers
 *
 * Fetches top sellers based on variation stats
 * Query params:
 * - departmentId: Filter by department
 * - collectionId: Filter by collection
 * - categoryId: Filter by category
 * - limit: Number of sellers to return (default: 5)
 */
export const getTopSellers: PayloadHandler = async (req) => {
  const { payload } = req
  const url = new URL(req.url || '', 'http://localhost')

  const departmentId = url.searchParams.get('departmentId')
  const collectionId = url.searchParams.get('collectionId')
  const categoryId = url.searchParams.get('categoryId')
  const limit = parseInt(url.searchParams.get('limit') || '5', 10)

  try {
    // Build where clause based on filters
    const where: any = {}
    if (departmentId) where.department = { equals: departmentId }
    if (collectionId) where.collection = { equals: collectionId }
    if (categoryId) where.category = { equals: categoryId }

    // Fetch variation stats with seller info (depth: 2 to populate seller.photo)
    const statsResult = await payload.find({
      collection: 'variation-stats',
      where,
      depth: 2,
      pagination: false,
      sort: '-totalSales',
    })

    // Aggregate sales by seller
    const sellerSalesMap = new Map<string, { seller: any; totalSales: number; totalOrders: number }>()

    for (const stat of statsResult.docs) {
      const seller = stat.seller as any
      if (!seller || typeof seller === 'string') continue

      const sellerId = seller.id
      if (!sellerSalesMap.has(sellerId)) {
        sellerSalesMap.set(sellerId, {
          seller: {
            id: seller.id,
            name: seller.name || seller.shopName || seller.username || '',
            username: seller.username || null,
            shopName: seller.shopName || null,
            avatar: seller.photo && typeof seller.photo === 'object'
              ? { url: seller.photo.url }
              : null,
          },
          totalSales: 0,
          totalOrders: 0,
        })
      }

      const existing = sellerSalesMap.get(sellerId)!
      existing.totalSales += (stat.totalSales as number) || 0
      existing.totalOrders += (stat.totalOrders as number) || 0
    }

    // Sort by total sales and take top N
    const topSellers = Array.from(sellerSalesMap.values())
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, limit)
      .map(item => item.seller)

    return Response.json({
      sellers: topSellers,
      total: topSellers.length,
    })
  } catch (error) {
    payload.logger.error(`Error fetching top sellers: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return Response.json(
      {
        error: 'Failed to fetch top sellers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
