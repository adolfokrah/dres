import type { PayloadHandler } from 'payload'
import { transformVariation } from '../utils/transformVariation'

export const filteredVariations: PayloadHandler = async (req) => {
  const { payload } = req
  const { department, category, collection, brand, filterType, limit = 20, page = 1 } = req.query

  try {
    // Build the where clause for styles using IDs
    const styleWhere: any = {}
    const variationWhere: any = {}
    
    if (department) {
      styleWhere.department = { equals: department }
    }
    
    if (collection) {
      styleWhere.collection = { equals: collection }
    }
    
    if (category) {
      styleWhere.category = { equals: category }
    }

    // Add brand filter if provided
    if (brand) {
      variationWhere.brand = { equals: brand }
    }

    // Apply filter type to variations
    if (filterType) {
      switch (filterType) {
        case 'on-sale':
          // Variations with discount > 0
          variationWhere.discount = { greater_than: 0 }
          break
        case 'we-love':
          // Boosted/featured variations
          variationWhere.isBoosted = { equals: true }
          break
        case 'designers':
          // This is handled by navigating to brands screen, not filtering here
          break
        case 'new-arrivals':
          // Most recent variations - handled by sort, no where clause needed
          break
      }
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

    // Build final where clause for variations
    const finalWhere: any = { ...variationWhere }
    if (styleIds.length > 0) {
      finalWhere.style = { in: styleIds }
    }

    // Determine sort order based on filter type
    let sortOrder = '-createdAt'
    if (filterType === 'new-arrivals') {
      sortOrder = '-createdAt' // Most recent first
    } else if (filterType === 'on-sale') {
      sortOrder = '-discount' // Highest discount first
    }

    // Now find variations that belong to these styles
    const variations = await payload.find({
      collection: 'variations',
      where: Object.keys(finalWhere).length > 0 ? finalWhere : undefined,
      limit: Number(limit),
      page: Number(page),
      depth: 2,
      sort: sortOrder,
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
