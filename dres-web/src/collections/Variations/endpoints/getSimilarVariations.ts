import type { PayloadHandler } from 'payload'
import { transformVariations } from '../utils/transformVariation'
import { getUserCountryInfo } from '../../../utilities/countryUtils'

/**
 * GET /api/variations/:id/similar
 * Fetch similar variations based on category and department, excluding same style
 */
export const getSimilarVariations: PayloadHandler = async (req) => {
  const { payload } = req
  const { id } = req.routeParams || {}
  const limit = parseInt(req.query?.limit as string) || 20

  // Get user's country for currency and filtering
  const userCountry = await getUserCountryInfo(req)

  if (!id) {
    return Response.json(
      { error: 'Variation ID is required' },
      { status: 400 }
    )
  }

  try {
    // First, fetch the current variation to get its style, category, and department
    const currentVariation = await payload.findByID({
      collection: 'variations',
      id: id as string,
      depth: 2,
    })

    if (!currentVariation) {
      return Response.json(
        { error: 'Variation not found' },
        { status: 404 }
      )
    }

    // Get the style
    const styleData = typeof currentVariation.style === 'object' 
      ? currentVariation.style 
      : await payload.findByID({
          collection: 'styles',
          id: currentVariation.style as string,
          depth: 2,
        })

    if (!styleData) {
      return Response.json(
        { error: 'Style not found' },
        { status: 404 }
      )
    }

    // Extract category and department IDs
    const categoryId = typeof (styleData as any).category === 'object' 
      ? (styleData as any).category.id 
      : (styleData as any).category
    const departmentId = typeof (styleData as any).department === 'object' 
      ? (styleData as any).department.id 
      : (styleData as any).department

    if (!categoryId || !departmentId) {
      return Response.json({
        variations: [],
        total: 0,
      })
    }

    // Find all styles with the same category and department, excluding the current style
    const similarStyles = await payload.find({
      collection: 'styles',
      where: {
        and: [
          {
            status: {
              equals: 'published',
            },
          },
          {
            category: {
              equals: categoryId,
            },
          },
          {
            department: {
              equals: departmentId,
            },
          },
          {
            id: {
              not_equals: typeof styleData === 'object' && 'id' in styleData ? styleData.id : styleData,
            },
          },
        ],
      },
      limit: 100, // Get enough styles to find variations
      depth: 2,
    })

    if (similarStyles.docs.length === 0) {
      return Response.json({
        variations: [],
        total: 0,
      })
    }

    // Get style IDs
    const styleIds = similarStyles.docs.map((s: any) => s.id)

    // Find variations from these styles
    const similarVariations = await payload.find({
      collection: 'variations',
      where: {
        and: [
          {
            // Only show active variations (not archived)
            status: {
              not_equals: 'archived',
            },
          },
          {
            style: {
              in: styleIds,
            },
          },
          // Filter by seller's country
          ...(userCountry.countryId ? [{
            'style.seller.country': {
              equals: userCountry.countryId,
            },
          }] : []),
        ],
      },
      limit,
      depth: 5,
      sort: '-createdAt', // Newest first
    })

    // Fetch full style with boost data and SKUs for each variation
    const variationsWithFullData = await Promise.all(
      similarVariations.docs.map(async (variation: any) => {
        if (!variation?.id) return variation

        try {
          // Fetch the full style with boost data
          const styleId = typeof variation.style === 'object' ? variation.style.id : variation.style
          let fullStyle = variation.style

          if (styleId) {
            fullStyle = await payload.findByID({
              collection: 'styles',
              id: styleId,
              depth: 4, // Need depth 4 for: style -> boost (join) -> tier (relationship) -> tier fields
            })
          }

          // Fetch SKUs for this variation
          const skusResult = await payload.find({
            collection: 'skus',
            where: { variation: { equals: variation.id } },
            depth: 2,
            limit: 100,
          })

          return {
            ...variation,
            style: fullStyle,
            skus: { docs: skusResult.docs },
          }
        } catch (err) {
          return {
            ...variation,
            skus: { docs: [] },
          }
        }
      })
    )

    // Sort to prioritize boosted items (check boost dates, not just status)
    const now = new Date()
    const sortedVariations = variationsWithFullData.sort((a: any, b: any) => {
      const checkBoosted = (v: any) => {
        const boosts = v?.style?.boost?.docs || []
        return boosts.some((boost: any) => {
          if (boost.status === 'cancelled') return false
          const start = boost.startDate ? new Date(boost.startDate) : null
          const end = boost.endDate ? new Date(boost.endDate) : null
          return (!start || now >= start) && (!end || now <= end)
        })
      }

      const aIsBoosted = checkBoosted(a)
      const bIsBoosted = checkBoosted(b)

      // Boosted items come first
      if (aIsBoosted && !bIsBoosted) return -1
      if (!aIsBoosted && bIsBoosted) return 1

      return 0
    })

    // Transform variations
    const transformed = transformVariations(sortedVariations, false)

    return Response.json({
      variations: transformed,
      total: similarVariations.totalDocs,
      currency: {
        code: userCountry.currencyCode,
        symbol: userCountry.currencySymbol,
      },
    })
  } catch (error: any) {
    payload.logger.error(`Error fetching similar variations: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch similar variations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
