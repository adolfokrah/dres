import type { PayloadHandler } from 'payload'
import { ObjectId } from 'mongodb'
import { getUserCountryInfo } from '../../../utilities/countryUtils'
import { resolveDepartmentId } from '../../../utilities/departmentUtils'
import { 
  resolveCategoryId, 
  resolveCollectionId, 
  resolveBrandId 
} from '../../../utilities/slugCache'

// Helper to safely convert a string to ObjectId
const toObjectId = (id: string | undefined | null): ObjectId | null => {
  if (!id || typeof id !== 'string') return null
  if (!/^[a-fA-F0-9]{24}$/.test(id)) return null
  try {
    return new ObjectId(id)
  } catch {
    return null
  }
}

// Helper to construct media URL from raw MongoDB data
// NOTE: We construct URLs from filename because the stored url field can be stale
// (e.g., when a file is re-uploaded, filename gets -1 suffix but url field may not update)
function getMediaUrl(media: any, size?: 'thumbnail' | 'card' | 'tablet'): string | null {
  if (!media) return null

  // If it's already a full URL string, return it
  if (typeof media === 'string' && media.startsWith('/')) return media
  if (typeof media === 'string' && media.startsWith('http')) return media

  // Construct URL from filename (more reliable than stored url)
  let filename = null

  if (size && media.sizes?.[size]?.filename && media.sizes[size].filename !== null) {
    filename = media.sizes[size].filename
  } else if (media.filename) {
    filename = media.filename
  } else if (typeof media === 'string') {
    filename = media
  }

  if (!filename) return null

  // Construct the Payload media URL
  return `/api/media/file/${filename}`
}

// Transform aggregation result to API response format
function transformAggregationResult(doc: any): any {
  const style = doc.styleData
  const skus = doc.skuData || []

  // Get first image thumbnail from looked-up imageData
  const firstImage = doc.imageData?.[0]
  // Try thumbnail size first, then fall back to main image
  const thumbnail = getMediaUrl(firstImage, 'thumbnail') || getMediaUrl(firstImage)

  // Get category/brand names from lookup
  const category = style?.categoryData?.[0]?.category || style?.categoryData?.[0]?.name || null
  const brand = style?.brandData?.[0]?.name || null

  // Build variants string
  const variants = doc.variants
    ?.map((v: any) => v.variantData?.[0]?.name)
    .filter(Boolean)
    .join(' - ') || ''

  // Transform SKUs - use pre-computed values from aggregation
  const transformedSkus = skus.map((sku: any) => ({
    value: sku.sizeValue || sku.title?.split(' / ')[0] || 'Standard',
    sellingPrice: sku.sellingPrice || 0,
  }))

  // Use pre-computed selected SKU from aggregation
  const selectedSku = doc.selectedSku || skus[0]

  return {
    id: doc._id.toString(),
    thumbnail,
    title: doc.title || '',
    slug: doc.slug || '',
    skus: transformedSkus,
    category,
    brand,
    sellingPrice: selectedSku?.sellingPrice || 0,
    compareAtPrice: selectedSku?.compareAtPrice || undefined,
    currency: selectedSku?.currencyData?.[0] ? {
      code: selectedSku.currencyData[0].code || '',
      symbol: selectedSku.currencyData[0].symbol || ''
    } : null,
    variants,
    isBoosted: doc.isBoosted || false,
    showWeLoveBadge: doc.showWeLoveBadge || false,
    defaultSku: selectedSku?._id?.toString(),
    styleId: style?._id?.toString() || null,
    sellerId: style?.seller?.toString() || null,
    totalStock: selectedSku?.stock || 0,
  }
}

export const filteredVariations: PayloadHandler = async (req) => {
  const { payload } = req
  const {
    query,
    department: departmentParam,
    category,
    collection,
    style,
    brand,
    filterType,
    sortBy,
    sortPrice,
    attributes,
    minPrice,
    maxPrice,
    limit = 20,
    page = 1
  } = req.query

  // Run initial async operations in parallel (resolve slugs to IDs)
  const [department, categoryId, collectionId, brandId, userCountry] = await Promise.all([
    resolveDepartmentId(payload, departmentParam as string | undefined),
    resolveCategoryId(payload, category as string | undefined),
    resolveCollectionId(payload, collection as string | undefined),
    resolveBrandId(payload, brand as string | undefined),
    getUserCountryInfo(req)
  ])

  // Parse attribute filters upfront
  const attributeFilters: Record<string, ObjectId[]> = {}
  if (attributes && typeof attributes === 'string') {
    for (const pair of attributes.split('|')) {
      const [attributeId, optionIdsStr] = pair.split(':')
      if (attributeId && optionIdsStr) {
        const attrObjId = toObjectId(attributeId)
        if (attrObjId) {
          const validOptions = optionIdsStr.split(',')
            .map(id => toObjectId(id))
            .filter((id): id is ObjectId => id !== null)
          if (validOptions.length > 0) {
            attributeFilters[attributeId] = validOptions
          }
        }
      }
    }
  }

  try {
    const pipeline: any[] = []
    const countryObjId = userCountry.countryId ? toObjectId(userCountry.countryId) : null

    // ============================================
    // STAGE 1: Early filter on variations (BEFORE lookups)
    // ============================================
    const earlyMatch: any = { status: 'active' } // Only show active variations (not draft or archived)

    // Filter by style if provided (avoids unnecessary lookups)
    if (style) {
      const styleId = toObjectId(style as string)
      if (styleId) earlyMatch.style = styleId
    }

    pipeline.push({ $match: earlyMatch })

    // ============================================
    // STAGE 2: Lookup style with minimal nested data
    // ============================================
    pipeline.push({
      $lookup: {
        from: 'styles',
        localField: 'style',
        foreignField: '_id',
        as: 'styleData',
        pipeline: [
          // Early filter on style status
          { $match: { status: 'published' } },
          // Only lookup boosts if needed for sorting/filtering
          {
            $lookup: {
              from: 'style-boosts',
              let: { styleId: '$_id' },
              pipeline: [
                { $match: { $expr: { $eq: ['$style', '$$styleId'] }, status: 'active' } },
                { $limit: 1 }, // Only need first active boost
                {
                  $lookup: {
                    from: 'boost-tiers',
                    localField: 'tier',
                    foreignField: '_id',
                    as: 'tierData',
                    pipeline: [{ $project: { showWeLoveBadge: 1 } }]
                  }
                },
                { $unwind: { path: '$tierData', preserveNullAndEmptyArrays: true } }
              ],
              as: 'boostData'
            }
          },
          // Lookup category - only name field
          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'categoryData',
              pipeline: [{ $project: { category: 1, name: 1 } }]
            }
          },
          // Lookup brand - only name field
          {
            $lookup: {
              from: 'brands',
              localField: 'brand',
              foreignField: '_id',
              as: 'brandData',
              pipeline: [{ $project: { name: 1 } }]
            }
          },
          // Lookup seller country for filtering
          {
            $lookup: {
              from: 'users',
              localField: 'seller',
              foreignField: '_id',
              as: 'sellerData',
              pipeline: [{ $project: { country: 1 } }]
            }
          },
          // Compute boost status
          {
            $addFields: {
              hasActiveBoost: { $gt: [{ $size: '$boostData' }, 0] },
              activeBoost: { $arrayElemAt: ['$boostData', 0] }
            }
          }
        ]
      }
    })

    // Unwind and filter empty results
    pipeline.push({
      $unwind: '$styleData'
    })

    // ============================================
    // STAGE 3: Build main match conditions
    // ============================================
    const matchConditions: any = {}

    // Department filter (already resolved from slug/id)
    if (department) {
      const deptId = toObjectId(department)
      if (deptId) matchConditions['styleData.department'] = deptId
    }

    // Collection filter (already resolved from slug/id)
    if (collectionId) {
      const collId = toObjectId(collectionId)
      if (collId) matchConditions['styleData.collection'] = collId
    }

    // Category filter (already resolved from slug/id)
    if (categoryId) {
      const catId = toObjectId(categoryId)
      if (catId) matchConditions['styleData.category'] = catId
    }

    // Brand filter (already resolved from slug/id)
    if (brandId) {
      const brId = toObjectId(brandId)
      if (brId) matchConditions['styleData.brand'] = brId
    }

    // Country filter
    if (countryObjId) {
      matchConditions['$or'] = [
        { 'styleData.sellerData.0.country': countryObjId },
        { 'styleData.sellerData.0.country': { $exists: false } },
        { 'styleData.sellerData': { $size: 0 } }
      ]
    }

    // Search query
    if (query && typeof query === 'string' && query.trim()) {
      const searchRegex = { $regex: query.trim(), $options: 'i' }
      matchConditions['$or'] = [
        { title: searchRegex },
        { 'styleData.title': searchRegex },
      ]
    }

    // Featured filter - any active boost (we-love filter is applied later after showWeLoveBadge is computed)
    if (filterType === 'featured') {
      matchConditions['styleData.hasActiveBoost'] = true
    }

    // Apply main match if conditions exist
    if (Object.keys(matchConditions).length > 0) {
      pipeline.push({ $match: matchConditions })
    }

    // ============================================
    // STAGE 4: Lookup images from media collection
    // ============================================
    // First, normalize image IDs (handle both ObjectId and object with _id)
    pipeline.push({
      $addFields: {
        normalizedImageIds: {
          $map: {
            input: { $ifNull: ['$images', []] },
            as: 'img',
            in: {
              $cond: {
                if: { $eq: [{ $type: '$$img' }, 'objectId'] },
                then: '$$img',
                else: { $ifNull: ['$$img._id', '$$img'] }
              }
            }
          }
        }
      }
    })

    pipeline.push({
      $lookup: {
        from: 'media',
        let: { imageIds: '$normalizedImageIds' },
        pipeline: [
          {
            $match: {
              $expr: {
                $in: ['$_id', { $ifNull: ['$$imageIds', []] }]
              }
            }
          },
          { $project: { url: 1, sizes: 1, filename: 1 } }
        ],
        as: 'imageData'
      }
    })

    // ============================================
    // STAGE 5: Lookup SKUs (after filtering to reduce data)
    // ============================================
    pipeline.push({
      $lookup: {
        from: 'skus',
        localField: '_id',
        foreignField: 'variation',
        as: 'skuData',
        pipeline: [
          {
            $lookup: {
              from: 'currencies',
              localField: 'currency',
              foreignField: '_id',
              as: 'currencyData',
              pipeline: [{ $project: { code: 1, symbol: 1 } }]
            }
          },
          // Extract size value for display
          {
            $addFields: {
              sizeValue: {
                $let: {
                  vars: {
                    sizeOpt: {
                      $first: {
                        $filter: {
                          input: { $ifNull: ['$skuOptions', []] },
                          as: 'opt',
                          cond: { $in: ['$$opt.optionName', ['Size', 'size', 'Waist Size']] }
                        }
                      }
                    }
                  },
                  in: '$$sizeOpt.valueName'
                }
              }
            }
          }
        ]
      }
    })

    // ============================================
    // STAGE 5: Compute derived fields
    // ============================================
    pipeline.push({
      $addFields: {
        // Check for on-sale SKUs
        hasOnSaleSku: {
          $gt: [
            { $size: { $filter: { input: '$skuData', as: 's', cond: { $and: [{ $gt: ['$$s.compareAtPrice', 0] }, { $ne: ['$$s.compareAtPrice', null] }] } } } },
            0
          ]
        },
        // Min price for sorting/filtering
        minPriceValue: { $ifNull: [{ $min: '$skuData.sellingPrice' }, 0] },
        // Select best SKU (prefer one with discount)
        selectedSku: {
          $ifNull: [
            { $first: { $filter: { input: '$skuData', as: 's', cond: { $and: [{ $gt: ['$$s.compareAtPrice', 0] }, { $ne: ['$$s.compareAtPrice', null] }] } } } },
            { $first: '$skuData' }
          ]
        },
        // Boost info
        isBoosted: '$styleData.hasActiveBoost',
        showWeLoveBadge: { $ifNull: ['$styleData.activeBoost.tierData.showWeLoveBadge', false] }
      }
    })

    // ============================================
    // STAGE 6: Filter types that need computed fields
    // ============================================
    if (filterType === 'on-sale') {
      pipeline.push({ $match: { hasOnSaleSku: true } })
    }

    // We-love filter - only show items with showWeLoveBadge enabled
    if (filterType === 'we-love') {
      pipeline.push({ $match: { showWeLoveBadge: true } })
    }

    // ============================================
    // STAGE 7: Price range filter
    // ============================================
    if (minPrice || maxPrice) {
      const priceMatch: any = {}
      if (minPrice) priceMatch.$gte = parseFloat(minPrice as string)
      if (maxPrice) priceMatch.$lte = parseFloat(maxPrice as string)
      pipeline.push({ $match: { minPriceValue: priceMatch } })
    }

    // ============================================
    // STAGE 8: Attribute filters (if any)
    // ============================================
    if (Object.keys(attributeFilters).length > 0) {
      const attrConditions = Object.entries(attributeFilters).map(([attrId, optionIds]) => ({
        $or: [
          { variants: { $elemMatch: { variant: toObjectId(attrId), value: { $in: optionIds } } } },
          { 'skuData.skuOptions': { $elemMatch: { option: toObjectId(attrId), value: { $in: optionIds } } } }
        ]
      }))
      pipeline.push({ $match: { $and: attrConditions } })
    }

    // ============================================
    // STAGE 9: Lookup variants data (only needed for display)
    // ============================================
    pipeline.push({
      $lookup: {
        from: 'attributes',
        localField: 'variants.variant',
        foreignField: '_id',
        as: 'variantAttributeData',
        pipeline: [{ $project: { name: 1 } }]
      }
    })

    pipeline.push({
      $addFields: {
        variants: {
          $map: {
            input: { $ifNull: ['$variants', []] },
            as: 'v',
            in: {
              variant: '$$v.variant',
              value: '$$v.value',
              variantData: { $filter: { input: '$variantAttributeData', as: 'a', cond: { $eq: ['$$a._id', '$$v.variant'] } } }
            }
          }
        }
      }
    })

    // ============================================
    // STAGE 10: Trending view count (conditional)
    // ============================================
    if (filterType === 'trending') {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      pipeline.push({
        $lookup: {
          from: 'variation-views',
          localField: '_id',
          foreignField: 'variation',
          as: 'viewsData',
          pipeline: [{ $match: { createdAt: { $gte: sevenDaysAgo } } }]
        }
      })
      pipeline.push({
        $addFields: {
          viewCount: {
            $sum: { $map: { input: '$viewsData', as: 'v', in: { $cond: [{ $isArray: '$$v.users' }, { $size: '$$v.users' }, 1] } } }
          }
        }
      })
    }

    // ============================================
    // STAGE 11: Sort
    // ============================================
    const sortSpec: any = { 'styleData.hasActiveBoost': -1 }

    if (sortPrice) {
      sortSpec.minPriceValue = sortPrice === 'desc' ? -1 : 1
    } else if (sortBy === 'oldest') {
      sortSpec.createdAt = 1
    } else if (filterType === 'trending') {
      sortSpec.viewCount = -1
    } else {
      sortSpec.createdAt = -1
    }

    pipeline.push({ $sort: sortSpec })

    // ============================================
    // STAGE 12: Pagination with facet
    // ============================================
    const skip = (Number(page) - 1) * Number(limit)
    const limitNum = Number(limit)

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $skip: skip }, { $limit: limitNum }]
      }
    })

    // Execute aggregation
    const variationsCollection = payload.db.collections['variations']
    const [result] = await variationsCollection.aggregate(pipeline)

    const totalDocs = result?.metadata[0]?.total || 0
    const variations = result?.data || []

    // Transform results
    const transformedVariations = variations.map(transformAggregationResult)

    const totalPages = Math.ceil(totalDocs / limitNum)
    const currentPage = Number(page)

    // ============================================
    // Fetch filters in parallel (optimized)
    // ============================================
    let filters: any[] = []

    if (category) {
      // Fetch category with attributes, then options in parallel
      const categoryDoc = await payload.findByID({
        collection: 'categories',
        id: category as string,
        depth: 1,
      })

      if (categoryDoc?.attributes?.length) {
        filters = await Promise.all(
          categoryDoc.attributes.map(async (attr: any) => {
            const attrId = typeof attr === 'object' ? attr.id : attr
            const attrData = typeof attr === 'object' ? attr : null

            const [attributeData, optionsResult] = await Promise.all([
              attrData || payload.findByID({ collection: 'attributes', id: attrId }),
              payload.find({
                collection: 'attributeOptions',
                where: {
                  and: [
                    { attribute: { equals: attrId } },
                    { or: [{ categories: { contains: category } }, { categories: { exists: false } }] }
                  ]
                },
                pagination: false,
              })
            ])

            return {
              id: attrId,
              name: attributeData?.name,
              options: optionsResult.docs.map((o: any) => ({ id: o.id, name: o.name, slug: o.slug }))
            }
          })
        )
      }
    } else if (collectionId) {
      // When filtering by collection, get attributes from all categories in that collection
      const categoriesInCollection = await payload.find({
        collection: 'categories',
        where: { collections: { contains: collectionId } },
        depth: 1,
        pagination: false,
      })

      // Collect unique attribute IDs from all categories in this collection
      const attributeIdSet = new Set<string>()
      categoriesInCollection.docs.forEach((cat: any) => {
        (cat.attributes || []).forEach((attr: any) => {
          const attrId = typeof attr === 'object' ? attr.id : attr
          if (attrId) attributeIdSet.add(attrId)
        })
      })

      const categoryIds = categoriesInCollection.docs.map((c: any) => c.id)

      if (attributeIdSet.size > 0) {
        const attributeIds = Array.from(attributeIdSet)
        const attributesResult = await payload.find({
          collection: 'attributes',
          where: { id: { in: attributeIds } },
          depth: 0,
          pagination: false,
        })

        filters = await Promise.all(
          attributesResult.docs.map(async (attr: any) => {
            const optionsResult = await payload.find({
              collection: 'attributeOptions',
              where: { attribute: { equals: attr.id } },
              depth: 0,
              pagination: false,
            })

            // Filter options: include if categories is empty OR contains any category in this collection
            const filteredOptions = optionsResult.docs.filter((opt: any) => {
              const optCategories = opt.categories as (string | { id: string })[] | null | undefined
              if (!optCategories || optCategories.length === 0) {
                return true // Available for all categories
              }
              const optCategoryIds = optCategories.map((c: any) => typeof c === 'string' ? c : c.id)
              return optCategoryIds.some((catId: string) => categoryIds.includes(catId))
            })

            return {
              id: attr.id,
              name: attr.name,
              options: filteredOptions.map((o: any) => ({ id: o.id, name: o.name, slug: o.slug }))
            }
          })
        )

        // Only include attributes that have valid options
        filters = filters.filter((f: any) => f.options.length > 0)
      }
    } else {
      // No category or collection filter - fetch all variation-level attributes with options
      const attributesResult = await payload.find({
        collection: 'attributes',
        where: { level: { equals: 'variation' } },
        depth: 0,
        pagination: false,
      })

      filters = await Promise.all(
        attributesResult.docs.map(async (attr: any) => {
          const optionsResult = await payload.find({
            collection: 'attributeOptions',
            where: { attribute: { equals: attr.id } },
            pagination: false,
          })
          return {
            id: attr.id,
            name: attr.name,
            options: optionsResult.docs.map((o: any) => ({ id: o.id, name: o.name, slug: o.slug }))
          }
        })
      )
    }

    return Response.json({
      variations: transformedVariations,
      totalDocs,
      totalPages,
      page: currentPage,
      limit: limitNum,
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
      { error: 'Failed to fetch variations', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
