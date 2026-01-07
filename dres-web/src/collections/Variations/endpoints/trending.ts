import type { PayloadHandler, PayloadRequest, Where } from 'payload'
import { transformVariations } from '../utils/transformVariation'
import { getUserCountryInfo } from '../../../utilities/countryUtils'
import { resolveDepartmentId } from '../../../utilities/departmentUtils'

type SupportedLocale = 'en' | 'fr' | 'de' | 'es' | 'it'

/**
 * GET /api/variations/trending
 * 
 * Fetches trending variations based on view counts within a time period.
 * Filters by seller's country matching the user's country (default: Ghana)
 * 
 * Query params:
 * - limit: number of variations to return (default: 10, max: 50)
 * - days: time period in days (default: 7)
 * - department: filter by department ID or slug (e.g., "men", "women")
 * - category: filter by category ID
 * - locale: language code (default: en)
 */
export const trendingVariations: PayloadHandler = async (req: PayloadRequest) => {
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
  
  // Debug logging
  console.log(`[trending] departmentParam: ${departmentParam}, resolved department ID: ${department}`)

  try {
    // Build where clause for filtering variations
    const variationsWhere: Where = {
      // Only show active variations (not archived)
      status: {
        not_equals: 'archived'
      },
      // Only show variations from published styles
      'style.status': {
        equals: 'published'
      },
      // Filter by time period - only variations updated within the days
      updatedAt: {
        greater_than: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    }

    // Filter by seller's country
    if (userCountry.countryId) {
      variationsWhere['style.seller.country'] = {
        equals: userCountry.countryId
      }
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

    // Step 1: Get all variation views within the time period
    const allViews = await req.payload.find({
      collection: 'variation-views',
      limit: 1000, // Get a large number to aggregate
      locale,
      depth: 0, // We only need the variation IDs
      where: {
        createdAt: {
          greater_than: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        }
      },
    })

    // Step 2: Count views per variation (count unique users per variation)
    const viewCounts = new Map<string, number>()
    
    allViews.docs.forEach((view: any) => {
      const variationId = typeof view.variation === 'string' ? view.variation : view.variation?.id
      if (variationId) {
        // Count unique users (if users array exists, count its length, otherwise count as 1)
        const userCount = Array.isArray(view.users) ? view.users.length : (view.users ? 1 : 1)
        viewCounts.set(variationId, (viewCounts.get(variationId) || 0) + userCount)
      }
    })

    // Step 3: Sort variations by view count and get top ones
    const sortedVariationIds = Array.from(viewCounts.entries())
      .sort((a, b) => b[1] - a[1]) // Sort by count descending
      .slice(0, limit)
      .map(([id]) => id)

    if (sortedVariationIds.length === 0) {
      return Response.json({
        docs: [],
        totalDocs: 0,
        limit,
        page: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      })
    }

    // Step 4: Fetch the actual variation data
    const variationsResult = await req.payload.find({
      collection: 'variations',
      where: {
        id: { in: sortedVariationIds },
        ...variationsWhere
      },
      limit,
      locale,
      depth: 5,
    })

    // Sort the results to match the view count order
    const sortedVariations = sortedVariationIds
      .map(id => variationsResult.docs.find((v: any) => v.id === id))
      .filter(Boolean)
    
    // Fetch SKUs for each variation separately since it's a join field
    const variationsWithSKUs = await Promise.all(
      sortedVariations.map(async (variation: any) => {
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
              depth: 3, // Increased depth to ensure boost is fully populated
            })
            fullStyle = styleResult
          }

          // Fetch SKUs for this variation with full details
          const skusResult = await req.payload.find({
            collection: 'skus',
            where: {
              variation: { equals: variation.id }
            },
            depth: 3, // Include variant details
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
            style: fullStyle, // Use the fully populated style
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
      totalDocs: sortedVariationIds.length,
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
    console.error('Error fetching trending variations:', error)
    return Response.json(
      { 
        error: 'Failed to fetch trending variations',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
