import type { PayloadHandler, PayloadRequest, Where } from 'payload'

type SupportedLocale = 'en' | 'fr' | 'de' | 'es' | 'it'

/**
 * GET /api/variations/trending
 * 
 * Fetches trending variations based on view counts within a time period.
 * 
 * Query params:
 * - limit: number of variations to return (default: 10, max: 50)
 * - days: time period in days (default: 7)
 * - department: filter by department ID
 * - category: filter by category ID
 * - locale: language code (default: en)
 */
export const trendingVariations: PayloadHandler = async (req: PayloadRequest) => {
  const { payload } = req
  const searchParams = req.searchParams

  // Parse query params
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
  const days = parseInt(searchParams.get('days') || '7')
  const department = searchParams.get('department')
  const category = searchParams.get('category')
  const localeParam = searchParams.get('locale') || 'en'
  const locale = (['en', 'fr', 'de', 'es', 'it'].includes(localeParam) ? localeParam : 'en') as SupportedLocale

  // Calculate date range
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  try {
    // Aggregate views by variation within the time period
    const viewsCollection = payload.db.collections['variation-views']
    
    // Build match conditions
    const matchConditions: Record<string, unknown> = {
      viewedAt: { $gte: startDate },
    }

    // Aggregate to get view counts per variation
    const aggregation = await viewsCollection.aggregate([
      { $match: matchConditions },
      {
        $group: {
          _id: '$variation',
          viewCount: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' },
          lastViewed: { $max: '$viewedAt' },
        },
      },
      {
        $project: {
          variationId: '$_id',
          viewCount: 1,
          uniqueUserCount: { $size: '$uniqueUsers' },
          lastViewed: 1,
        },
      },
      { $sort: { viewCount: -1 } },
      { $limit: limit * 2 },
    ])

    const trendingVariationIds = aggregation.map((item: { _id: string }) => item._id)

    if (trendingVariationIds.length === 0) {
      // Fallback: return newest variations if no views
      const fallbackVariations = await payload.find({
        collection: 'variations',
        limit,
        locale,
        sort: '-createdAt',
      })

      return Response.json({
        docs: fallbackVariations.docs,
        totalDocs: fallbackVariations.totalDocs,
        source: 'fallback',
        period: `${days} days`,
      })
    }

    // Build variation query
    const variationWhere: Where = {
      id: { in: trendingVariationIds },
    }

    // Fetch the actual variations
    const variations = await payload.find({
      collection: 'variations',
      where: variationWhere,
      limit,
      locale,
      depth: 2,
    })

    // Sort variations by view count (maintain trending order)
    const viewCountMap = new Map(
      aggregation.map((item: { _id: string; viewCount: number }) => [
        item._id.toString(),
        item.viewCount,
      ])
    )

    const sortedVariations = variations.docs.sort((a, b) => {
      const aViews = viewCountMap.get(a.id.toString()) || 0
      const bViews = viewCountMap.get(b.id.toString()) || 0
      return bViews - aViews
    })

    return Response.json({
      docs: sortedVariations.slice(0, limit),
      totalDocs: sortedVariations.length,
      viewCounts: Object.fromEntries(viewCountMap),
      period: `${days} days`,
    })
  } catch (error) {
    console.error('Error fetching trending variations:', error)
    return Response.json(
      { error: 'Failed to fetch trending variations' },
      { status: 500 }
    )
  }
}
