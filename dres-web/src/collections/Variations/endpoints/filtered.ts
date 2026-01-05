import type { PayloadHandler } from 'payload'
import { Types } from 'mongoose'
import { transformVariation } from '../utils/transformVariation'
import { getUserCountryInfo } from '../../../utilities/countryUtils'

export const filteredVariations: PayloadHandler = async (req) => {
  const { payload } = req
  const { query, department, category, collection, style, brand, filterType, sortBy, sortPrice, attributes, minPrice, maxPrice, limit = 20, page = 1 } = req.query

  // Get user's country for filtering sellers
  const userCountry = await getUserCountryInfo(req)
  payload.logger.info(`Filtering variations for country: ${userCountry.countryCode} (${userCountry.countryId})`)

  // Parse attribute filters from query params
  // Format: attributes=attributeId:optionId1,optionId2|attributeId2:optionId3,optionId4
  const attributeFilters: Record<string, string[]> = {}
  
  if (attributes && typeof attributes === 'string') {
    const attributePairs = attributes.split('|')
    attributePairs.forEach(pair => {
      const [attributeId, optionIdsStr] = pair.split(':')
      if (attributeId && optionIdsStr) {
        attributeFilters[attributeId] = optionIdsStr.split(',')
        payload.logger.info(`Parsed attribute filter: ${attributeId} = ${optionIdsStr}`)
      }
    })
  }

  // Debug logging
  payload.logger.info(`Attribute filters parsed: ${JSON.stringify(attributeFilters)}`)

  try {
    // Build the aggregation pipeline
    const pipeline: any[] = []

    // Lookup style information with seller
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

    // Lookup seller information to filter by country
    pipeline.push({
      $lookup: {
        from: 'users',
        localField: 'styleData.seller',
        foreignField: '_id',
        as: 'sellerData'
      }
    })

    pipeline.push({
      $unwind: {
        path: '$sellerData',
        preserveNullAndEmptyArrays: false // Exclude variations without seller
      }
    })

    // Filter by seller's country (must match user's country)
    if (userCountry.countryId) {
      pipeline.push({
        $match: {
          'sellerData.country': new Types.ObjectId(userCountry.countryId)
        }
      })
    }

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
          $ifNull: [{ $min: '$skuData.sellingPrice' }, 0]
        }
      }
    })

    // Build match conditions
    let matchConditions: any = {
      // Only show published variations (not archived/draft)
      'status': { $ne: 'archived' },
      // Only show variations from published styles
      'styleData.status': 'published'
    }

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

    // Filter by style
    if (style) {
      matchConditions['style'] = new Types.ObjectId(style as string)
    }

    // Filter by search query (search in variation title and style title)
    if (query && typeof query === 'string' && query.trim()) {
      const searchRegex = { $regex: query.trim(), $options: 'i' }
      matchConditions['$or'] = [
        { title: searchRegex },
        { 'styleData.title': searchRegex },
      ]
    }

    // Apply filter type
    if (filterType) {
      switch (filterType) {
        case 'on-sale':
          // Variations with SKUs that have compareAtPrice
          matchConditions['hasOnSaleSku'] = true
          break
        case 'we-love':
        case 'featured':
          // Variations with active style boost
          matchConditions['styleData.hasActiveBoost'] = true
          break
        case 'new-arrivals':
          // Will be handled by sort (createdAt descending)
          break
        case 'trending':
          // Will be handled by special trending sort below
          break
      }
    }

    // Apply attribute filters
    // Filter by BOTH variation-level (variants) and SKU-level (skuOptions) attributes
    if (Object.keys(attributeFilters).length > 0) {
      const attributeConditions = Object.entries(attributeFilters).map(([attributeId, optionIds]) => {
        payload.logger.info(`Creating condition for attribute ${attributeId} with options: ${optionIds.join(',')}`)
        
        // Check if variation has this attribute in variants OR any SKU has it in skuOptions
        return {
          $or: [
            // Variation-level attribute (e.g., Color)
            {
              variants: {
                $elemMatch: {
                  variant: new Types.ObjectId(attributeId),
                  value: { $in: optionIds.map(id => new Types.ObjectId(id)) }
                }
              }
            },
            // SKU-level attribute (e.g., Size)
            {
              'skuData.skuOptions': {
                $elemMatch: {
                  option: new Types.ObjectId(attributeId),
                  value: { $in: optionIds.map(id => new Types.ObjectId(id)) }
                }
              }
            }
          ]
        }
      })
      
      // If we already have conditions in matchConditions, we need to combine them
      const existingConditions = Object.entries(matchConditions).map(([key, value]) => ({ [key]: value }))
      
      // Create a new $and array with all conditions
      if (existingConditions.length > 0) {
        matchConditions = {
          $and: [...existingConditions, ...attributeConditions]
        }
      } else {
        matchConditions = {
          $and: attributeConditions
        }
      }
      
      payload.logger.info(`Final match with attributes: ${JSON.stringify(matchConditions, null, 2)}`)
    }

    // Apply price range filter
    if (minPrice || maxPrice) {
      const priceConditions: any = {}
      
      if (minPrice) {
        priceConditions.minPrice = { $gte: parseFloat(minPrice as string) }
      }
      
      if (maxPrice) {
        priceConditions.minPrice = { 
          ...priceConditions.minPrice,
          $lte: parseFloat(maxPrice as string)
        }
      }
      
      // Combine with existing conditions
      if (Object.keys(matchConditions).length > 0) {
        if (matchConditions.$and) {
          matchConditions.$and.push(priceConditions)
        } else {
          const existingConditions = Object.entries(matchConditions).map(([key, value]) => ({ [key]: value }))
          matchConditions = {
            $and: [...existingConditions, priceConditions]
          }
        }
      } else {
        matchConditions = priceConditions
      }
      
      payload.logger.info(`Price range filter applied: ${minPrice} - ${maxPrice}`)
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
    } else if (filterType === 'we-love' || filterType === 'featured') {
      sortField = 'styleData.boost.startDate'
      sortOrder = -1 // most recently boosted first
    } else if (filterType === 'trending') {
      sortField = 'viewCount'
      sortOrder = -1 // most viewed first
    }

    // For trending, add view count lookup before sorting
    if (filterType === 'trending') {
      // Lookup variation views to count total views
      pipeline.push({
        $lookup: {
          from: 'variation-views',
          localField: '_id',
          foreignField: 'variation',
          as: 'viewsData',
          pipeline: [
            {
              $match: {
                // Only count views from the last 7 days
                createdAt: {
                  $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
              }
            }
          ]
        }
      })

      // Calculate view count (sum of users array lengths)
      pipeline.push({
        $addFields: {
          viewCount: {
            $sum: {
              $map: {
                input: '$viewsData',
                as: 'view',
                in: {
                  $cond: {
                    if: { $isArray: '$$view.users' },
                    then: { $size: '$$view.users' },
                    else: 1
                  }
                }
              }
            }
          }
        }
      })
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
        pagination: false,
      })
      availableAttributes = attributesResult.docs
    }

    // For each attribute, fetch its options (filtered by category if available)
    const filters = await Promise.all(
      availableAttributes.map(async (attr: any) => {
        const attributeId = typeof attr === 'object' ? attr.id : attr
        const attributeData = typeof attr === 'object' ? attr : await payload.findByID({
          collection: 'attributes',
          id: attributeId,
        })

        // Build where clause for options
        const optionsWhere: any = {
          attribute: { equals: attributeId }
        }
        
        // Filter options by category if category is provided
        if (category) {
          optionsWhere.or = [
            { categories: { contains: category } },
            { categories: { exists: false } }
          ]
        }

        const optionsResult = await payload.find({
          collection: 'attributeOptions',
          where: optionsWhere,
          pagination: false,
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
      currency: {
        code: userCountry.currencyCode,
        symbol: userCountry.currencySymbol,
      },
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


// export const filteredVariations=()=>{
//   return Response.json({
//     message: 'Filtered variations',
//   })
// }