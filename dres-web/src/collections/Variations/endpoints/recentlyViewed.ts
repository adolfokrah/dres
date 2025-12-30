import type { PayloadHandler, PayloadRequest } from 'payload'
import { transformVariations } from '../utils/transformVariation'
import { getUserCountryInfo } from '../../../utilities/countryUtils'

/**
 * GET /api/variations/recently-viewed
 * 
 * Fetches recently viewed variations for the logged-in user.
 * Returns variations the user has viewed, sorted by most recent view.
 * 
 * Query params:
 * - limit: number of variations to return (default: 10, max: 50)
 * - locale: language code (default: en)
 */
export const recentlyViewedVariations: PayloadHandler = async (req: PayloadRequest) => {
  const { payload, user } = req
  const searchParams = req.searchParams

  // Parse query params
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
  const localeParam = searchParams.get('locale') || 'en'
  const locale = (['en', 'fr', 'de', 'es', 'it'].includes(localeParam) ? localeParam : 'en') as 'en' | 'fr' | 'de' | 'es' | 'it'

  // Get user's country for currency info
  const userCountry = await getUserCountryInfo(req)

  // User must be logged in to get recently viewed
  if (!user) {
    return Response.json({
      docs: [],
      totalDocs: 0,
      limit,
      page: 1,
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
      currency: {
        code: userCountry.currencyCode,
        symbol: userCountry.currencySymbol,
      },
    })
  }

  try {
    // Get variation views where this user is in the users array
    // Sort by updatedAt descending to get most recently viewed first
    const viewsResult = await payload.find({
      collection: 'variation-views',
      where: {
        users: {
          contains: user.id,
        },
      },
      sort: '-updatedAt',
      limit: limit,
      depth: 0,
    })

    if (viewsResult.docs.length === 0) {
      return Response.json({
        docs: [],
        totalDocs: 0,
        limit,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        currency: {
          code: userCountry.currencyCode,
          symbol: userCountry.currencySymbol,
        },
      })
    }

    // Extract variation IDs
    const variationIds = viewsResult.docs
      .map((view: any) => typeof view.variation === 'string' ? view.variation : view.variation?.id)
      .filter(Boolean)

    if (variationIds.length === 0) {
      return Response.json({
        docs: [],
        totalDocs: 0,
        limit,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
        currency: {
          code: userCountry.currencyCode,
          symbol: userCountry.currencySymbol,
        },
      })
    }

    // Fetch the actual variations with full data
    const variationsResult = await payload.find({
      collection: 'variations',
      where: {
        id: { in: variationIds },
        // Filter by seller's country
        ...(userCountry.countryId ? {
          'style.seller.country': {
            equals: userCountry.countryId,
          },
        } : {}),
      },
      locale,
      depth: 5,
      limit: limit,
    })

    // Fetch SKUs and style for each variation
    const variationsWithSKUs = await Promise.all(
      variationsResult.docs.map(async (variation: any) => {
        if (!variation?.id) return variation

        try {
          // Fetch the full style with boost data
          const styleId = typeof variation.style === 'object' ? variation.style.id : variation.style
          let fullStyle = variation.style
          
          if (styleId) {
            const styleResult = await payload.findByID({
              collection: 'styles',
              id: styleId,
              depth: 3,
            })
            fullStyle = styleResult
          }

          // Fetch SKUs for this variation
          const skusResult = await payload.find({
            collection: 'skus',
            where: {
              variation: { equals: variation.id }
            },
            depth: 2,
            limit: 100,
          })

          return {
            ...variation,
            style: fullStyle,
            skus: { docs: skusResult.docs },
          }
        } catch (err) {
          console.error(`Error fetching data for variation ${variation.id}:`, err)
          return {
            ...variation,
            skus: { docs: [] },
          }
        }
      })
    )

    // Sort variations to match the order from views (most recently viewed first)
    const sortedVariations = variationIds
      .map((id: string) => variationsWithSKUs.find((v: any) => v?.id === id))
      .filter(Boolean)
    
    const transformedDocs = transformVariations(sortedVariations, false)

    return Response.json({
      docs: transformedDocs,
      totalDocs: transformedDocs.length,
      limit,
      page: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
      currency: {
        code: userCountry.currencyCode,
        symbol: userCountry.currencySymbol,
      },
    })
  } catch (error) {
    console.error('Error fetching recently viewed variations:', error)
    return Response.json(
      {
        error: 'Failed to fetch recently viewed variations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
