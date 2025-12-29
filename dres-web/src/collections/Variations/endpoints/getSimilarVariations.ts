import type { PayloadHandler } from 'payload'
import { transformVariations } from '../utils/transformVariation'

/**
 * GET /api/variations/:id/similar
 * Fetch similar variations based on category and department, excluding same style
 */
export const getSimilarVariations: PayloadHandler = async (req) => {
  const { payload } = req
  const { id } = req.routeParams || {}
  const limit = parseInt(req.query?.limit as string) || 20

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
        style: {
          in: styleIds,
        },
      },
      limit,
      depth: 5,
      sort: '-createdAt', // Newest first
    })

    // Transform variations
    const transformed = transformVariations(similarVariations.docs, false)

    return Response.json({
      variations: transformed,
      total: similarVariations.totalDocs,
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
