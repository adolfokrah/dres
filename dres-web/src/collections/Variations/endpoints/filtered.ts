import type { PayloadHandler } from 'payload'
import { Types } from 'mongoose'
import { transformVariation } from '../utils/transformVariation'

export const filteredVariations: PayloadHandler = async (req) => {
  const { payload } = req
  const { department, category, collection, brand, filterType, sortBy, sortPrice, limit = 20, page = 1, ...queryParams } = req.query

  // Parse attribute filters from query params
  // Format: attributes[attributeId]=optionId1,optionId2
  const attributeFilters: Record<string, string[]> = {}
  Object.keys(queryParams).forEach(key => {
    const match = key.match(/^attributes\[(.+)\]$/)
    if (match) {
      const attributeId = match[1]
      const optionIds = (queryParams[key] as string).split(',')
      attributeFilters[attributeId] = optionIds
    }
  })

  try {
    // Build the aggregation pipeline
    const pipeline: any[] = []

    // Lookup style information
    pipeline.push({
      $lookup: {
        from: 'styles',
        localField: 'style',
        foreignField: '_id',
        as: 'styleData',
        pipeline: [
          {
            $lookup: {
              from: 'style-boosts',
              localField: '_id',
              foreignField: 'style',
              as: 'boosts'
            }
          },
          {
            $addFields: {
              hasActiveBoost: {
                $gt: [
                  {
                    $size: {
                      $filter: {
                        input: '$boosts',
                        as: 'boost',
                        cond: { $eq: ['$$boost.status', 'active'] }
                      }
                    }
                  },
                  0
                ]
              }
            }
          }
        ]
      }
    })

    pipeline.push({
      $unwind: '$styleData'
    })

    // Lookup SKUs to check for on-sale items
    pipeline.push({
      $lookup: {
        from: 'skus',
        localField: '_id',
        foreignField: 'variation',
        as: 'skuData'
      }
    })

    // Add computed field for on-sale check
    pipeline.push({
      $addFields: {
        hasOnSaleSku: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: '$skuData',
                  as: 'sku',
                  cond: {
                    $and: [
                      { $gt: ['$$sku.compareAtPrice', 0] },
                      { $ne: ['$$sku.compareAtPrice', null] }
                    ]
                  }
                }
              }
            },
            0
          ]
        },
        // Add minPrice for sorting by price (default to 0 if no SKUs)
        minPrice: {
          $ifNull: [{ $min: '$skuData.price' }, 0]
        }
      }
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
          matchConditions['hasOnSaleSku'] = true
          break
        case 'we-love':
          // Variations with active style boost
          matchConditions['styleData.hasActiveBoost'] = true
          break
        case 'new-arrivals':
          // Will be handled by sort (createdAt descending)
          break
      }
    }

    // Apply attribute filters
    // Filter variations by their variant attributes (e.g., Color: Red, Size: M)
    if (Object.keys(attributeFilters).length > 0) {
      Object.entries(attributeFilters).forEach(([attributeId, optionIds]) => {
        // Each variation must have at least one variant with the specified attribute option
        matchConditions['variants'] = {
          $elemMatch: {
            variant: new Types.ObjectId(attributeId),
            value: { $in: optionIds.map(id => new Types.ObjectId(id)) }
          }
        }
      })
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
    
    // Handle sortPrice parameter (asc/desc) - takes priority
    if (sortPrice) {
      sortField = 'minPrice'
      sortOrder = sortPrice === 'desc' ? -1 : 1
    }
    // Handle sortBy parameter (latest/oldest)
    else if (sortBy === 'oldest') {
      sortField = 'createdAt'
      sortOrder = 1 // ascending for oldest
    } else if (sortBy === 'latest') {
      sortField = 'createdAt'
      sortOrder = -1 // descending for latest
    }
    // Handle filterType sorting
    else if (filterType === 'new-arrivals') {
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
          depth: 5,
        })
        
        // Fetch the full style with boost data separately (same as trending endpoint)
        const styleId = typeof fullVariation.style === 'object' ? fullVariation.style.id : fullVariation.style
        if (styleId) {
          const fullStyle = await payload.findByID({
            collection: 'styles',
            id: styleId,
            depth: 3, // Ensure boost is fully populated
          })
          fullVariation.style = fullStyle
        }
        
        return transformVariation(fullVariation)
      })
    )

    const totalPages = Math.ceil(totalDocs / Number(limit))
    const currentPage = Number(page)

    // Fetch available attributes for filtering
    // Get attributes based on category if provided, otherwise get all variation-level attributes
    let availableAttributes: any[] = []
    
    if (category) {
      // Fetch attributes associated with this category
      const categoryDoc = await payload.findByID({
        collection: 'categories',
        id: category as string,
        depth: 2,
      })
      
      if (categoryDoc && Array.isArray(categoryDoc.attributes)) {
        availableAttributes = categoryDoc.attributes
      }
    } else {
      // Fetch all variation-level attributes
      const attributesResult = await payload.find({
        collection: 'attributes',
        where: {
          level: { equals: 'variation' }
        },
        depth: 1,
        limit: 100,
      })
      availableAttributes = attributesResult.docs
    }

    // For each attribute, fetch its options
    const filters = await Promise.all(
      availableAttributes.map(async (attr: any) => {
        const attributeId = typeof attr === 'object' ? attr.id : attr
        const attributeData = typeof attr === 'object' ? attr : await payload.findByID({
          collection: 'attributes',
          id: attributeId,
        })

        const optionsResult = await payload.find({
          collection: 'attributeOptions',
          where: {
            attribute: { equals: attributeId }
          },
          limit: 100,
        })

        return {
          id: attributeId,
          name: attributeData.name,
          options: optionsResult.docs.map((opt: any) => ({
            id: opt.id,
            name: opt.name,
            slug: opt.slug,
          }))
        }
      })
    )

    return Response.json({
      variations: transformedVariations,
      totalDocs,
      totalPages,
      page: currentPage,
      limit: Number(limit),
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1,
      filters,
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
