import type { PayloadHandler, PayloadRequest, Where } from 'payload'
import { transformVariations } from '../utils/transformVariation'

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
  const searchParams = req.searchParams

  // Parse query params
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
  const department = searchParams.get('department')
  const category = searchParams.get('category')
  const localeParam = searchParams.get('locale') || 'en'
  const locale = (['en', 'fr', 'de', 'es', 'it'].includes(localeParam) ? localeParam : 'en') as SupportedLocale

  try {
    // Build where clause for filtering
    const variationsWhere: Where = {
      // Filter by time period - only variations updated within the days
      updatedAt: {
        greater_than: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    }

    // Add department filter if provided (filter through variation's style relationship)
    if (department) {
      variationsWhere['variation.style.department'] = {
        equals: department
      }
    }

    // Add category filter if provided (filter through variation's style relationship)
    if (category) {
      variationsWhere['variation.style.category'] = {
        equals: category
      }
    }

    // Fetch trending variations: > minViews users, updated within days, limited
    const trendingViews = await req.payload.find({
      collection: 'variation-views',
      limit, // Apply limit at query level - no jumping records
      locale,
      depth: 5, // Increased depth to get style.boost data
      sort: '-updatedAt', // Most recently updated first
      where: variationsWhere,
    })

    // Extract and transform variations
    const variations = trendingViews.docs
      .map(viewDoc => viewDoc.variation)
      .filter(Boolean)
    
    // Fetch SKUs for each variation separately since it's a join field
    const variationsWithSKUs = await Promise.all(
      variations.map(async (variation: any) => {
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
                id: { not_equals: variation.id } // Exclude current variation
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
    
    const transformedDocs = transformVariations(variationsWithSKUs, true)
 
    return Response.json({
      docs: transformedDocs,
      totalDocs: trendingViews.totalDocs,
      limit: trendingViews.limit,
      page: trendingViews.page,
      totalPages: trendingViews.totalPages,
      hasNextPage: trendingViews.hasNextPage,
      hasPrevPage: trendingViews.hasPrevPage,
      includeRelated: false
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
