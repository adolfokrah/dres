import type { PayloadHandler, PayloadRequest } from 'payload'
import { ObjectId } from 'mongodb'
import { getUserCountryInfo } from '../../../utilities/countryUtils'
import { resolveDepartmentId } from '../../../utilities/departmentUtils'

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
  // Note: We need to get the FIRST image from the original images array order
  // The $lookup with $in doesn't preserve order, so we need to reorder
  let firstImage = null
  if (doc.normalizedImageIds?.length > 0 && doc.imageData?.length > 0) {
    const firstImageId = doc.normalizedImageIds[0]?.toString()
    firstImage = doc.imageData.find((img: any) => img._id?.toString() === firstImageId) || doc.imageData[0]
  } else {
    firstImage = doc.imageData?.[0]
  }
  
  // Try thumbnail size first, then fall back to main image
  const thumbnail = getMediaUrl(firstImage, 'thumbnail') || getMediaUrl(firstImage)

  // Get category/brand names
  const categoryObj = style?.categoryData?.[0]
  const category = categoryObj?.category || categoryObj?.title || categoryObj?.name || null
  const brandObj = style?.brandData?.[0]
  const brand = brandObj?.name || brandObj?.title || null

  // Build variants string
  let variants = ''
  if (Array.isArray(doc.variants)) {
    const variantNames = doc.variants
      .map((v: any) => v.variantData?.[0]?.name || '')
      .filter(Boolean)
    variants = variantNames.join(' - ')
  }

  // Transform SKUs
  const transformedSkus = skus.map((sku: any) => {
    let value = ''
    if (Array.isArray(sku.skuOptions)) {
      const sizeOption = sku.skuOptions.find((opt: any) => {
        const optName = opt.optionData?.[0]?.name?.toLowerCase()
        return optName === 'size' || optName === 'waist size'
      })
      if (sizeOption?.valueData?.[0]) {
        value = sizeOption.valueData[0].name || sizeOption.valueData[0].value || ''
      }
    }
    if (!value && sku.title) {
      value = sku.title.split(' / ')[0] || sku.title
    }
    return {
      value: value || 'Standard',
      sellingPrice: typeof sku.sellingPrice === 'number' ? sku.sellingPrice : 0,
    }
  })

  // Get price - prioritize SKU with compareAtPrice
  let selectedSku = skus[0]
  const skuWithDiscount = skus.find((sku: any) =>
    typeof sku.compareAtPrice === 'number' && sku.compareAtPrice > 0
  )
  if (skuWithDiscount) selectedSku = skuWithDiscount

  const sellingPrice = selectedSku?.sellingPrice || 0
  const compareAtPrice = selectedSku?.compareAtPrice || undefined
  const totalStock = selectedSku?.stock || 0

  // Get currency from SKU
  const currencyData = selectedSku?.currencyData?.[0]
  const currency = currencyData ? {
    code: currencyData.code || '',
    symbol: currencyData.symbol || ''
  } : null

  // Check boost status
  const boostItems = style?.boostData || []
  let isBoosted = false
  let showWeLoveBadge = false
  const now = new Date()

  for (const boost of boostItems) {
    if (boost.status !== 'active') continue
    const startDate = boost.startDate ? new Date(boost.startDate) : null
    const endDate = boost.endDate ? new Date(boost.endDate) : null
    const isActive = (!startDate || now >= startDate) && (!endDate || now <= endDate)
    if (isActive) {
      isBoosted = true
      // tierData is now unwound to an object, not an array
      const tier = boost.tierData
      showWeLoveBadge = tier?.showWeLoveBadge ?? false
      break
    }
  }

  return {
    id: doc._id.toString(),
    thumbnail,
    title: doc.title || '',
    slug: doc.slug || '',
    skus: transformedSkus,
    category,
    brand,
    sellingPrice,
    compareAtPrice,
    currency,
    variants,
    isBoosted,
    showWeLoveBadge,
    defaultSku: selectedSku?._id?.toString() || undefined,
    styleId: style?._id?.toString() || null,
    sellerId: style?.seller?.toString() || style?.sellerData?.[0]?._id?.toString() || null,
    totalStock,
  }
}

/**
 * GET /api/variations/new-arrivals
 *
 * Fetches newly added variations sorted by creation date.
 * Optimized with single aggregation query - no N+1 queries.
 */
export const newArrivals: PayloadHandler = async (req: PayloadRequest) => {
  const { payload } = req
  const searchParams = req.searchParams

  // Parse query params
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50)
  const departmentParam = searchParams.get('department')
  const category = searchParams.get('category')

  // Get user's country for filtering sellers
  const userCountry = await getUserCountryInfo(req)

  // Resolve department slug to ID
  const department = await resolveDepartmentId(payload, departmentParam)

  try {
    const pipeline: any[] = []

    // Stage 1: Lookup style with all nested data
    pipeline.push({
      $lookup: {
        from: 'styles',
        localField: 'style',
        foreignField: '_id',
        as: 'styleData',
        pipeline: [
          // Lookup boosts
          {
            $lookup: {
              from: 'style-boosts',
              let: { styleId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ['$style', '$$styleId'] },
                    status: 'active'
                  }
                },
                // Lookup tier data for each boost
                {
                  $lookup: {
                    from: 'boost-tiers',
                    let: { tierId: '$tier' },
                    pipeline: [
                      {
                        $match: {
                          $expr: { $eq: ['$_id', '$$tierId'] }
                        }
                      }
                    ],
                    as: 'tierData'
                  }
                },
                // Unwind tier to make it easier to access
                {
                  $unwind: {
                    path: '$tierData',
                    preserveNullAndEmptyArrays: true
                  }
                }
              ],
              as: 'boostData'
            }
          },
          // Lookup category
          {
            $lookup: {
              from: 'categories',
              localField: 'category',
              foreignField: '_id',
              as: 'categoryData'
            }
          },
          // Lookup brand
          {
            $lookup: {
              from: 'brands',
              localField: 'brand',
              foreignField: '_id',
              as: 'brandData'
            }
          },
          // Lookup seller
          {
            $lookup: {
              from: 'users',
              localField: 'seller',
              foreignField: '_id',
              as: 'sellerData'
            }
          },
          // Add hasActiveBoost flag
          {
            $addFields: {
              hasActiveBoost: { $gt: [{ $size: '$boostData' }, 0] }
            }
          }
        ]
      }
    })

    pipeline.push({ $unwind: '$styleData' })

    // Stage 2: Filter by seller's country
    if (userCountry.countryId) {
      const countryObjId = toObjectId(userCountry.countryId)
      if (countryObjId) {
        pipeline.push({
          $match: {
            $or: [
              { 'styleData.sellerData.country': countryObjId },
              { 'styleData.sellerData.country': { $exists: false } },
              { 'styleData.sellerData': { $size: 0 } }
            ]
          }
        })
      }
    }

    // Stage 3: Lookup images from media collection
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

    // Stage 4: Lookup SKUs with currency
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
              as: 'currencyData'
            }
          }
        ]
      }
    })

    // Stage 4: Lookup variant attribute data
    pipeline.push({
      $lookup: {
        from: 'attributes',
        localField: 'variants.variant',
        foreignField: '_id',
        as: 'variantAttributeData'
      }
    })

    // Enrich variants
    pipeline.push({
      $addFields: {
        variants: {
          $map: {
            input: { $ifNull: ['$variants', []] },
            as: 'v',
            in: {
              variant: '$$v.variant',
              value: '$$v.value',
              variantData: {
                $filter: {
                  input: '$variantAttributeData',
                  as: 'attr',
                  cond: { $eq: ['$$attr._id', '$$v.variant'] }
                }
              }
            }
          }
        }
      }
    })

    // Stage 5: Build match conditions
    const matchConditions: any = {
      status: { $ne: 'archived' },
      'styleData.status': 'published'
    }

    if (department) {
      const deptId = toObjectId(department)
      if (deptId) matchConditions['styleData.department'] = deptId
    }

    if (category) {
      const catId = toObjectId(category)
      if (catId) matchConditions['styleData.category'] = catId
    }

    pipeline.push({ $match: matchConditions })

    // Stage 6: Sort - boosted first, then by creation date
    pipeline.push({
      $sort: {
        'styleData.hasActiveBoost': -1,
        createdAt: -1
      }
    })

    // Stage 7: Pagination
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [{ $limit: limit }]
      }
    })

    // Execute aggregation
    const db = payload.db
    const variationsCollection = db.collections['variations']
    const result: any[] = await variationsCollection.aggregate(pipeline)

    const totalDocs = result[0]?.metadata[0]?.total || 0
    const variations = result[0]?.data || []

    // Transform results directly - NO additional queries!
    const transformedDocs = variations.map(transformAggregationResult)

    return Response.json({
      docs: transformedDocs,
      totalDocs,
      limit,
      page: 1,
      totalPages: Math.ceil(totalDocs / limit),
      hasNextPage: totalDocs > limit,
      hasPrevPage: false,
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
