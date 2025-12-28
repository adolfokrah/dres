import type { PayloadHandler } from 'payload'
import { Types } from 'mongoose'
import { transformVariation } from '../utils/transformVariation'

export const filteredVariations: PayloadHandler = async (req) => {
  const { payload } = req
  const { department, category, collection, brand, filterType, limit = 20, page = 1 } = req.query

  try {
    // Build the aggregation pipeline
    const pipeline: any[] = []

    // Lookup style information
    pipeline.push({
      $lookup: {
        from: 'styles',
        localField: 'style',
        foreignField: '_id',
        as: 'styleData'
      }
    })

    pipeline.push({
      $unwind: '$styleData'
    })

    // Build match conditions
    const matchConditions: any = {}

    // Filter by department (convert string to ObjectId)
    if (department) {
      matchConditions['styleData.department'] = new Types.ObjectId(department as string)
    }

    // Filter by collection (convert string to ObjectId)
    if (collection) {
      matchConditions['styleData.collection'] = new Types.ObjectId(collection as string)
    }

    // Filter by category (convert string to ObjectId)
    if (category) {
      matchConditions['styleData.category'] = new Types.ObjectId(category as string)
    }

    // Filter by brand (convert string to ObjectId if valid, otherwise keep as string)
    if (brand) {
      // The brand is stored as ObjectId reference in style.brand
      try {
        matchConditions['styleData.brand'] = new Types.ObjectId(brand as string)
      } catch {
        matchConditions['styleData.brand'] = brand
      }
    }

    // Apply filter type
    if (filterType) {
      switch (filterType) {
        case 'on-sale':
          // Variations with SKUs that have compareAtPrice
          matchConditions['skus'] = {
            $elemMatch: {
              compareAtPrice: { $exists: true, $ne: null, $gt: 0 }
            }
          }
          break
        case 'we-love':
          // Variations with active style boost
          matchConditions['styleData.boost.active'] = true
          break
        case 'new-arrivals':
          // Will be handled by sort (createdAt descending)
          break
      }
    }

    // Add match stage if we have conditions
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({
        $match: matchConditions
      })
    }

    // Determine sort order
    let sortField = 'createdAt'
    let sortOrder = -1 // descending by default
    
    if (filterType === 'new-arrivals') {
      sortField = 'createdAt'
      sortOrder = -1 // newest first
    } else if (filterType === 'on-sale') {
      sortField = 'createdAt'
      sortOrder = -1 // newest sales first
    } else if (filterType === 'we-love') {
      sortField = 'styleData.boost.startDate'
      sortOrder = -1 // most recently boosted first
    }

    // Add sort stage
    pipeline.push({
      $sort: { [sortField]: sortOrder }
    })

    // Add pagination - facet for both data and count
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $skip: (Number(page) - 1) * Number(limit) },
          { $limit: Number(limit) }
        ]
      }
    })

    // Execute aggregation
    const db = payload.db
    const variationsCollection = db.collections['variations']
    const result: any[] = await variationsCollection.aggregate(pipeline)

    const totalDocs = result[0]?.metadata[0]?.total || 0
    const variations = result[0]?.data || []

    // Transform variations
    const transformedVariations = await Promise.all(
      variations.map(async (variation: any) => {
        // Fetch full variation with depth for transformation
        const fullVariation = await payload.findByID({
          collection: 'variations',
          id: variation._id,
          depth: 2,
        })
        return transformVariation(fullVariation)
      })
    )

    const totalPages = Math.ceil(totalDocs / Number(limit))
    const currentPage = Number(page)

    return Response.json({
      variations: transformedVariations,
      totalDocs,
      totalPages,
      page: currentPage,
      limit: Number(limit),
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
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
