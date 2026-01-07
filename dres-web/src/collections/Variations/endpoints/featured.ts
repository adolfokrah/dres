import type { PayloadHandler, PayloadRequest, Where } from 'payload'
import { transformVariations } from '../utils/transformVariation'
import { getUserCountryInfo } from '../../../utilities/countryUtils'
import { resolveDepartmentId } from '../../../utilities/departmentUtils'

type SupportedLocale = 'en' | 'fr' | 'de' | 'es' | 'it'

/**
 * GET /api/variations/featured
 * 
 * Fetches featured variations - variations from styles with active boosts.
 * Filters by seller's country matching the user's country (default: Ghana)
 * 
 * Query params:
 * - limit: number of variations to return (default: 10, max: 50)
 * - department: filter by department ID or slug (e.g., "men", "women")
 * - category: filter by category ID
 * - locale: language code (default: en)
 */
export const featuredVariations: PayloadHandler = async (req: PayloadRequest) => {
  const searchParams = req.searchParams

  // Parse query params
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
  const departmentParam = searchParams.get('department')
  const category = searchParams.get('category')
  const localeParam = searchParams.get('locale') || 'en'
  const locale = (['en', 'fr', 'de', 'es', 'it'].includes(localeParam) ? localeParam : 'en') as SupportedLocale

  // Get user's country for filtering sellers
  const userCountry = await getUserCountryInfo(req)

  // Resolve department slug to ID
  const department = await resolveDepartmentId(req.payload, departmentParam)

  try {
    // Step 1: Get all active style boosts
    const now = new Date()
    const activeBoosts = await req.payload.find({
      collection: 'style-boosts',
      limit: 1000,
      where: {
        and: [
          {
            or: [
              { startDate: { exists: false } },
              { startDate: { less_than_equal: now.toISOString() } }
            ]
          },
          {
            or: [
              { endDate: { exists: false } },
              { endDate: { greater_than_equal: now.toISOString() } }
            ]
          }
        ]
      }
    })

    if (activeBoosts.docs.length === 0) {
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

    // Step 2: Get style IDs from active boosts
    const boostedStyleIds = activeBoosts.docs
      .map((boost: any) => typeof boost.style === 'string' ? boost.style : boost.style?.id)
      .filter(Boolean)

    if (boostedStyleIds.length === 0) {
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

    // Step 3: Build where clause for variations
    const variationsWhere: Where = {
      'style': { in: boostedStyleIds },
      // Only show active variations (not archived)
      status: {
        not_equals: 'archived'
      },
      // Only show variations from published styles
      'style.status': {
        equals: 'published'
      }
    }

    // Filter by seller's country - show products from:
    // 1. Sellers in the same country as the user
    // 2. Sellers without a country set (default to showing)
    if (userCountry.countryId) {
      variationsWhere.or = [
        { 'style.seller.country': { equals: userCountry.countryId } },
        { 'style.seller.country': { exists: false } },
      ]
    }

    // Add department filter if provided
    if (department) {
      variationsWhere['style.department'] = {
        equals: department
      }
    }

    // Add category filter if provided
    if (category) {
      variationsWhere['style.category'] = {
        equals: category
      }
    }

    // Step 4: Fetch featured variations
    const featuredResult = await req.payload.find({
      collection: 'variations',
      limit,
      locale,
      depth: 5,
      sort: '-createdAt', // Show newest boosted items first
      where: variationsWhere,
    })

    // Fetch SKUs and style for each variation
    const variationsWithSKUs = await Promise.all(
      featuredResult.docs.map(async (variation: any) => {
        if (!variation?.id) return variation

        try {
          // Fetch the full style with boost data
          const styleId = typeof variation.style === 'object' ? variation.style.id : variation.style
          let fullStyle = variation.style
          
          if (styleId) {
            // Always fetch the full style object with populated boost relationship
            const styleResult = await req.payload.findByID({
              collection: 'styles',
              id: styleId,
              depth: 3,
            })
            fullStyle = styleResult
          }

          // Fetch SKUs for this variation with full details
          const skusResult = await req.payload.find({
            collection: 'skus',
            where: {
              variation: { equals: variation.id }
            },
            depth: 3,
            limit: 100,
          })

          // Fetch related variations (same style, different variation)
          let relatedVariations: any[] = []
          
          if (styleId) {
            const relatedResult = await req.payload.find({
              collection: 'variations',
              where: {
                style: { equals: styleId },
                id: { not_equals: variation.id },
                status: { equals: 'active' }
              },
              limit: 10,
              depth: 2,
            })

            // Fetch SKUs for each related variation
            relatedVariations = await Promise.all(
              relatedResult.docs.map(async (relatedVar: any) => {
                const relatedSKUs = await req.payload.find({
                  collection: 'skus',
                  where: {
                    variation: { equals: relatedVar.id }
                  },
                  depth: 3,
                  limit: 100,
                })

                return {
                  ...relatedVar,
                  skus: { docs: relatedSKUs.docs }
                }
              })
            )
          }

          return {
            ...variation,
            style: fullStyle,
            skus: { docs: skusResult.docs },
            relatedVariations: { docs: relatedVariations }
          }
        } catch (err) {
          console.error(`Error fetching SKUs for variation ${variation.id}:`, err)
          return {
            ...variation,
            skus: { docs: [] },
            relatedVariations: { docs: [] }
          }
        }
      })
    )
    
    const transformedDocs = transformVariations(variationsWithSKUs, false)
 
    return Response.json({
      docs: transformedDocs,
      totalDocs: featuredResult.totalDocs,
      limit: featuredResult.limit,
      page: featuredResult.page,
      totalPages: featuredResult.totalPages,
      hasNextPage: featuredResult.hasNextPage,
      hasPrevPage: featuredResult.hasPrevPage,
      currency: {
        code: userCountry.currencyCode,
        symbol: userCountry.currencySymbol,
      },
    })
  } catch (error) {
    console.error('Error fetching featured variations:', error)
    return Response.json(
      {
        error: 'Failed to fetch featured variations',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
