import type { PayloadHandler, PayloadRequest, Where } from 'payload'
import { transformVariations } from '../utils/transformVariation'
import { getUserCountryInfo } from '../../../utilities/countryUtils'

type SupportedLocale = 'en' | 'fr' | 'de' | 'es' | 'it'

/**
 * GET /api/variations/new-arrivals
 * 
 * Fetches newly added variations sorted by creation date.
 * Filters by seller's country matching the user's country (default: Ghana)
 * 
 * Query params:
 * - limit: number of variations to return (default: 10, max: 50)
 * - department: filter by department ID
 * - category: filter by category ID
 * - locale: language code (default: en)
 */
export const newArrivals: PayloadHandler = async (req: PayloadRequest) => {
  const searchParams = req.searchParams

  // Parse query params
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
  const department = searchParams.get('department')
  const category = searchParams.get('category')
  const localeParam = searchParams.get('locale') || 'en'
  const locale = (['en', 'fr', 'de', 'es', 'it'].includes(localeParam) ? localeParam : 'en') as SupportedLocale

  // Get user's country for filtering sellers
  const userCountry = await getUserCountryInfo(req)

  try {
    // Build where clause for filtering
    const where: Where = {
      // Only show active variations (not archived)
      status: {
        not_equals: 'archived'
      },
      // Only show variations from published styles
      'style.status': {
        equals: 'published'
      }
    }

    // Filter by seller's country
    if (userCountry.countryId) {
      where['style.seller.country'] = {
        equals: userCountry.countryId
      }
    }

    // Add department filter if provided
    if (department) {
      where['style.department'] = {
        equals: department
      }
    }

    // Add category filter if provided
    if (category) {
      where['style.category'] = {
        equals: category
      }
    }

    // Fetch new arrivals: most recently created variations
    const newArrivalsResult = await req.payload.find({
      collection: 'variations',
      limit,
      locale,
      depth: 5,
      sort: '-createdAt', // Most recently created first
      where,
    })

    // Fetch SKUs and style for each variation
    const variationsWithSKUs = await Promise.all(
      newArrivalsResult.docs.map(async (variation: any) => {
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
      totalDocs: newArrivalsResult.totalDocs,
      limit: newArrivalsResult.limit,
      page: newArrivalsResult.page,
      totalPages: newArrivalsResult.totalPages,
      hasNextPage: newArrivalsResult.hasNextPage,
      hasPrevPage: newArrivalsResult.hasPrevPage,
      currency: {
        code: userCountry.currencyCode,
        symbol: userCountry.currencySymbol,
      },
    })
  } catch (error) {
    console.error('Error fetching new arrivals:', error)
    return Response.json(
      {
        error: 'Failed to fetch new arrivals',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
