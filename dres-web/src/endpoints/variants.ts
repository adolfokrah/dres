import type { Endpoint } from 'payload'
import { transformVariation } from '../utilities/transformVariation'

export const variantsEndpoint: Endpoint = {
  method: 'get',
  path: '/variants',
  handler: async (req) => {
    const { payload } = req
    const { department, category, collection, limit = 20, page = 1 } = req.query

    try {
      // Build the where clause for styles
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

      // Now find variations that belong to these styles
      const variations = await payload.find({
        collection: 'variations',
        where: styleIds.length > 0 
          ? { style: { in: styleIds } }
          : undefined,
        limit: Number(limit),
        page: Number(page),
        depth: 2, // Include style, images, etc.
        sort: '-createdAt',
      })

      // Transform all variations using the utility function
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
      payload.logger.error(`Error fetching variants: ${error}`)
      return Response.json(
        {
          error: 'Failed to fetch variants',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        { status: 500 },
      )
    }
  },
}
