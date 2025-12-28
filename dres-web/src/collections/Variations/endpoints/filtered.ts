import type { PayloadHandler } from 'payload'
import { transformVariation } from '../utils/transformVariation'

export const filteredVariations: PayloadHandler = async (req) => {
  const { payload } = req
  const { department, category, collection, limit = 20, page = 1 } = req.query

  try {
    // Build the where clause for styles using IDs
    const styleWhere: any = {}
    
    if (department) {
      styleWhere.department = { equals: department }
    }
    
    if (collection) {
      styleWhere.collection = { equals: collection }
    }
    
    if (category) {
      styleWhere.category = { equals: category }
    }

    // First, find matching styles
    const styles = await payload.find({
      collection: 'styles',
      where: Object.keys(styleWhere).length > 0 ? styleWhere : undefined,
      pagination: false,
      depth: 0,
    })

    const styleIds = styles.docs.map(style => style.id)

    // If no styles found with the filters, return empty
    if (styleIds.length === 0 && Object.keys(styleWhere).length > 0) {
      return Response.json({
        variations: [],
        totalDocs: 0,
        totalPages: 0,
        page: 1,
        limit: Number(limit),
        hasNextPage: false,
        hasPrevPage: false,
      })
    }

    // Now find variations that belong to these styles
    const variations = await payload.find({
      collection: 'variations',
      where: styleIds.length > 0 
        ? { style: { in: styleIds } }
        : undefined,
      limit: Number(limit),
      page: Number(page),
      depth: 2,
      sort: '-createdAt',
    })

    // Transform all variations
    const transformedVariations = variations.docs.map(variation => 
      transformVariation(variation)
    )

    return Response.json({
      variations: transformedVariations,
      totalDocs: variations.totalDocs,
      totalPages: variations.totalPages,
      page: variations.page,
      limit: variations.limit,
      hasNextPage: variations.hasNextPage,
      hasPrevPage: variations.hasPrevPage,
    })
  } catch (error) {
    payload.logger.error(`Error fetching filtered variations: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch variations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
