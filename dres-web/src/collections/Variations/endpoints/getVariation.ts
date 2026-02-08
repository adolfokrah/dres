import type { PayloadHandler } from 'payload'
import { ObjectId } from 'mongodb'
import { getUserCountryInfo } from '../../../utilities/countryUtils'
import { formatCompactNumberWithPlus } from '../../../utilities/formatNumber'

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

// Helper to construct media URL from filename (more reliable than stored url field)
const getMediaUrl = (media: any, size?: 'thumbnail' | 'card' | 'tablet'): string | null => {
  if (!media) return null

  let filename = null

  if (size && media.sizes?.[size]?.filename) {
    filename = media.sizes[size].filename
  } else if (media.filename) {
    filename = media.filename
  }

  if (!filename) return null
  return `/api/media/file/${filename}`
}

export const getVariation: PayloadHandler = async (req) => {
  const { payload } = req
  const { id } = req.routeParams || {}

  if (!id) {
    return Response.json({ error: 'Variation ID or slug is required' }, { status: 400 })
  }

  try {
    // Get user's currency info
    const countryInfo = await getUserCountryInfo(req)
    const currency = countryInfo.currencySymbol

    // Build match condition for ID or slug
    const idMatch = toObjectId(id as string)
    const matchCondition = idMatch
      ? { $or: [{ _id: idMatch }, { slug: id }] }
      : { slug: id }

    // Single aggregation pipeline to fetch variation with ALL related data
    const pipeline: any[] = [
      { $match: matchCondition },
      { $limit: 1 },

      // Lookup images
      {
        $lookup: {
          from: 'media',
          localField: 'images',
          foreignField: '_id',
          as: 'imageData',
          pipeline: [{ $project: { url: 1, alt: 1, filename: 1, mimeType: 1, width: 1, height: 1, sizes: 1 } }]
        }
      },

      // Lookup style with all nested data
      {
        $lookup: {
          from: 'styles',
          localField: 'style',
          foreignField: '_id',
          as: 'styleData',
          pipeline: [
            // Boost data
            {
              $lookup: {
                from: 'style-boosts',
                let: { styleId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$style', '$$styleId'] }, status: 'active' } },
                  { $limit: 1 },
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
            // Department
            {
              $lookup: {
                from: 'departments',
                localField: 'department',
                foreignField: '_id',
                as: 'departmentData',
                pipeline: [{ $project: { name: 1 } }]
              }
            },
            // Collection
            {
              $lookup: {
                from: 'collections',
                localField: 'collection',
                foreignField: '_id',
                as: 'collectionData',
                pipeline: [{ $project: { name: 1 } }]
              }
            },
            // Category
            {
              $lookup: {
                from: 'categories',
                localField: 'category',
                foreignField: '_id',
                as: 'categoryData',
                pipeline: [{ $project: { category: 1, name: 1 } }]
              }
            },
            // Brand
            {
              $lookup: {
                from: 'brands',
                localField: 'brand',
                foreignField: '_id',
                as: 'brandData',
                pipeline: [{ $project: { name: 1 } }]
              }
            },
            // Seller
            {
              $lookup: {
                from: 'users',
                localField: 'seller',
                foreignField: '_id',
                as: 'sellerData',
                pipeline: [
                  {
                    $lookup: {
                      from: 'media',
                      localField: 'photo',
                      foreignField: '_id',
                      as: 'photoData',
                      pipeline: [{ $project: { url: 1 } }]
                    }
                  },
                  { $project: { firstName: 1, lastName: 1, shopName: 1, username: 1, vacationMode: 1, createdAt: 1, photoData: 1 } }
                ]
              }
            },
            {
              $addFields: {
                hasActiveBoost: { $gt: [{ $size: '$boostData' }, 0] },
                activeBoost: { $arrayElemAt: ['$boostData', 0] }
              }
            }
          ]
        }
      },
      { $unwind: { path: '$styleData', preserveNullAndEmptyArrays: true } },

      // Lookup SKUs with currency and options data
      {
        $lookup: {
          from: 'skus',
          let: { variationId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$variation', '$$variationId'] }, status: { $ne: 'archived' } } },
            {
              $lookup: {
                from: 'currencies',
                localField: 'currency',
                foreignField: '_id',
                as: 'currencyData',
                pipeline: [{ $project: { code: 1, symbol: 1 } }]
              }
            },
            // Lookup attribute names for skuOptions
            {
              $lookup: {
                from: 'attributes',
                localField: 'skuOptions.option',
                foreignField: '_id',
                as: 'optionAttributes'
              }
            },
            // Lookup attribute option values
            {
              $lookup: {
                from: 'attributeOptions',
                localField: 'skuOptions.value',
                foreignField: '_id',
                as: 'optionValues'
              }
            }
          ],
          as: 'skuData'
        }
      },

      // Convert variant IDs from strings to ObjectIds for lookup
      // Use $convert with onError to handle invalid ObjectIds gracefully
      {
        $addFields: {
          variantObjectIds: {
            $map: {
              input: { $ifNull: ['$variants', []] },
              as: 'v',
              in: {
                variant: {
                  $convert: {
                    input: '$$v.variant',
                    to: 'objectId',
                    onError: null,
                    onNull: null
                  }
                },
                value: {
                  $convert: {
                    input: '$$v.value',
                    to: 'objectId',
                    onError: null,
                    onNull: null
                  }
                },
                id: '$$v.id'
              }
            }
          }
        }
      },
      // Lookup variant attribute names using the converted ObjectIds
      {
        $lookup: {
          from: 'attributes',
          localField: 'variantObjectIds.variant',
          foreignField: '_id',
          as: 'variantAttributes'
        }
      },
      {
        $lookup: {
          from: 'attributeOptions',
          localField: 'variantObjectIds.value',
          foreignField: '_id',
          as: 'variantValues'
        }
      },

      // Lookup related variations (same style, different id)
      {
        $lookup: {
          from: 'variations',
          let: { styleId: '$style', currentId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$style', '$$styleId'] },
                    { $ne: ['$_id', '$$currentId'] },
                    { $ne: ['$status', 'archived'] }
                  ]
                }
              }
            },
            { $limit: 10 },
            // Images for related
            {
              $lookup: {
                from: 'media',
                localField: 'images',
                foreignField: '_id',
                as: 'imageData',
                pipeline: [{ $project: { url: 1, sizes: 1 } }]
              }
            },
            // SKUs for related
            {
              $lookup: {
                from: 'skus',
                let: { varId: '$_id' },
                pipeline: [
                  { $match: { $expr: { $eq: ['$variation', '$$varId'] }, status: { $ne: 'archived' } } },
                  {
                    $lookup: {
                      from: 'attributes',
                      localField: 'skuOptions.option',
                      foreignField: '_id',
                      as: 'optionAttributes'
                    }
                  },
                  {
                    $lookup: {
                      from: 'attributeOptions',
                      localField: 'skuOptions.value',
                      foreignField: '_id',
                      as: 'optionValues'
                    }
                  }
                ],
                as: 'skuData'
              }
            },
            // Variant attributes for related
            {
              $lookup: {
                from: 'attributes',
                localField: 'variants.variant',
                foreignField: '_id',
                as: 'variantAttributes'
              }
            },
            {
              $lookup: {
                from: 'attributeOptions',
                localField: 'variants.value',
                foreignField: '_id',
                as: 'variantValues'
              }
            }
          ],
          as: 'relatedVariationsData'
        }
      }
    ]

    // Execute aggregation
    const variationsCollection = payload.db.collections['variations']
    const [variation] = await variationsCollection.aggregate(pipeline)

    if (!variation) {
      return Response.json({ error: 'Variation not found' }, { status: 404 })
    }

    // Check status
    if (variation.status === 'archived') {
      return Response.json({ error: 'Variation not found' }, { status: 404 })
    }

    const style = variation.styleData
    if (!style || style.status !== 'published') {
      return Response.json({ error: 'Variation not found' }, { status: 404 })
    }

    // Helper to compare ObjectIds (handles both ObjectId and string)
    const idsMatch = (id1: any, id2: any): boolean => {
      if (!id1 || !id2) return false
      const str1 = typeof id1 === 'object' && id1._id ? id1._id.toString() : id1.toString()
      const str2 = typeof id2 === 'object' && id2._id ? id2._id.toString() : id2.toString()
      return str1 === str2
    }

    // Helper to resolve SKU options from lookup data
    const resolveSkuOptions = (sku: any) => {
      if (!sku.skuOptions?.length) return []
      return sku.skuOptions.map((opt: any) => {
        const optAttr = sku.optionAttributes?.find((a: any) => idsMatch(a._id, opt.option))
        const optVal = sku.optionValues?.find((v: any) => idsMatch(v._id, opt.value))
        return { option: optAttr?.name || '', value: optVal?.name || '' }
      }).filter((o: any) => o.option && o.value)
    }

    // Helper to resolve variant details from lookup data
    const resolveVariantDetails = (doc: any, resolvedValues?: Map<string, string>) => {
      // Use variantObjectIds if available (main variation), fall back to variants (related variations)
      const variantSource = doc.variantObjectIds || doc.variants || []
      if (!variantSource?.length) return []
      return variantSource.map((v: any) => {
        const attr = doc.variantAttributes?.find((a: any) => idsMatch(a._id, v.variant))
        // Try lookup data first, then fall back to resolved values map
        let val = doc.variantValues?.find((vl: any) => idsMatch(vl._id, v.value))
        const valueName = val?.name || (resolvedValues ? resolvedValues.get(v.value?.toString()) : undefined)
        return { name: attr?.name || '', value: valueName || '' }
      }).filter((d: any) => d.name && d.value)
    }

    // Reorder imageData to match the original images array order
    // ($lookup does not preserve order of the localField array)
    const originalImageIds = (variation.images || []).map((id: any) => id.toString())
    const imageDataMap = new Map((variation.imageData || []).map((img: any) => [img._id.toString(), img]))
    const orderedImageData = originalImageIds
      .map((id: string) => imageDataMap.get(id))
      .filter(Boolean)

    // Transform images - construct URLs from filename (more reliable than stored url)
    const images = orderedImageData.map((img: any) => ({
      id: img._id.toString(),
      url: getMediaUrl(img),
      alt: img.alt || variation.title,
      filename: img.filename,
      mimeType: img.mimeType,
      width: img.width,
      height: img.height,
    }))

    // Get first image thumbnail
    const firstImage = orderedImageData[0]
    const thumbnail = getMediaUrl(firstImage, 'thumbnail') || getMediaUrl(firstImage)

    // Transform SKUs - fetch with proper depth to get populated options
    const skuIds = variation.skuData?.map((s: any) => s._id.toString()) || []
    let skus: any[] = []
    
    if (skuIds.length > 0) {
      // Fetch SKUs with proper depth to get populated skuOptions
      const skuResponse = await payload.find({
        collection: 'skus',
        where: {
          id: { in: skuIds },
          isActive: { not_equals: false }
        },
        depth: 2,
        limit: 100
      })
      
      skus = skuResponse.docs.map((sku: any) => {
        const resolvedOptions: Array<{option: string, value: string}> = []
        
        if (sku.skuOptions?.length) {
          for (const opt of sku.skuOptions) {
            const optionName = opt.option?.name || ''
            const valueName = opt.value?.name || ''
            
            if (optionName && valueName) {
              resolvedOptions.push({
                option: optionName,
                value: valueName
              })
            }
          }
        }
        
        const flashSaleEndDate = sku.flashSaleEnabled && sku.flashSaleEndDate && new Date(sku.flashSaleEndDate) > new Date()
          ? sku.flashSaleEndDate
          : null

        return {
          id: sku.id.toString(),
          options: resolvedOptions,
          sellingPrice: sku.sellingPrice || 0,
          compareAtPrice: sku.compareAtPrice || null,
          stock: sku.stock ?? null, // null = unlimited stock
          currency,
          flashSaleEndDate,
        }
      })
    } else {
      // Fallback to aggregation data if no SKU IDs found
      skus = (variation.skuData || []).map((sku: any) => {
        const flashSaleEndDate = sku.flashSaleEnabled && sku.flashSaleEndDate && new Date(sku.flashSaleEndDate) > new Date()
          ? sku.flashSaleEndDate
          : null

        return {
          id: sku._id.toString(),
          options: resolveSkuOptions(sku),
          sellingPrice: sku.sellingPrice || 0,
          compareAtPrice: sku.compareAtPrice || null,
          stock: sku.stock ?? null, // null = unlimited stock
          currency,
          flashSaleEndDate,
        }
      })
    }

    // Build details array
    const details: { name: string; value: string }[] = []
    if (style.departmentData?.[0]?.name) {
      details.push({ name: 'Department', value: style.departmentData[0].name })
    }
    if (style.categoryData?.[0]?.category || style.categoryData?.[0]?.name) {
      details.push({ name: 'Category', value: style.categoryData[0].category || style.categoryData[0].name })
    }
    if (style.collectionData?.[0]?.name) {
      details.push({ name: 'Collection', value: style.collectionData[0].name })
    }
    if (style.brandData?.[0]?.name) {
      details.push({ name: 'Brand', value: style.brandData[0].name })
    }

    if (style.authenticity) {
      const authenticityLabel =
        style.authenticity === 'original'
          ? 'Original'
          : style.authenticity === 'replica'
            ? 'Replica'
            : style.authenticity

      details.push({ name: 'Authenticity', value: authenticityLabel })
    }

    // Fetch variant values via Payload API since $lookup has collection naming issues
    const valueIds = variation.variantObjectIds?.map((v: any) => v.value?.toString()).filter(Boolean) || []
    const resolvedValuesMap = new Map<string, string>()

    if (valueIds.length > 0) {
      const valuesResult = await payload.find({
        collection: 'attributeOptions',
        where: { id: { in: valueIds } },
        depth: 0
      })
      valuesResult.docs.forEach((doc: any) => {
        resolvedValuesMap.set(doc.id, doc.name)
      })
    }

    // Add variation-level attribute details (e.g., Color: Red, Material: Leather)
    const attributeDetails = resolveVariantDetails(variation, resolvedValuesMap)
    details.push(...attributeDetails.map((d: any) => ({ name: d.name, value: d.value })))

    // Transform related variations
    const relatedVariations = (variation.relatedVariationsData || []).map((rel: any) => {
      // Reorder related variation images to match original order
      const relImageIds = (rel.images || []).map((id: any) => id.toString())
      const relImageMap = new Map((rel.imageData || []).map((img: any) => [img._id.toString(), img]))
      const relFirstImage = relImageMap.get(relImageIds[0]) || rel.imageData?.[0]
      const relThumbnail = getMediaUrl(relFirstImage, 'thumbnail') || getMediaUrl(relFirstImage)
      const relDetails = resolveVariantDetails(rel).map((d: any) => ({
        attribute: d.name,
        value: d.value
      }))

      const relSkus = (rel.skuData || []).map((sku: any) => ({
        id: sku._id.toString(),
        options: resolveSkuOptions(sku),
        sellingPrice: sku.sellingPrice || 0,
        compareAtPrice: sku.compareAtPrice || null,
        stock: sku.stock ?? null, // null = unlimited stock
        currency,
      }))

      // Get best SKU for price
      const relBestSku = relSkus.find((s: any) => s.compareAtPrice > 0) || relSkus[0]

      // Build variants string for related variation
      const relVariantsString = relDetails.map((d: any) => d.attribute).join(' - ')

      return {
        id: rel._id.toString(),
        thumbnail: relThumbnail,
        title: rel.title || '',
        slug: rel.slug || '',
        skus: relSkus,
        details: relDetails,
        sellingPrice: relBestSku?.sellingPrice || 0,
        compareAtPrice: relBestSku?.compareAtPrice || undefined,
        category: style.categoryData?.[0]?.category || style.categoryData?.[0]?.name || null,
        brand: style.brandData?.[0]?.name || null,
        isBoosted: style.hasActiveBoost || false,
        showWeLoveBadge: style.activeBoost?.tierData?.showWeLoveBadge || false,
        variants: relVariantsString,
        defaultSku: relBestSku?.id || undefined,
        totalStock: relBestSku?.stock || 0,
        currency: relBestSku ? { code: countryInfo.currencyCode, symbol: countryInfo.currencySymbol } : null,
      }
    })

    // Build variationsTitle
    let variationsTitle: { attribute: string; values: string[] } | null = null
    if (attributeDetails.length > 0) {
      const firstAttr = attributeDetails[0].name
      const allValues = new Set<string>([attributeDetails[0].value])
      relatedVariations.forEach((rel: any) => {
        const match = rel.details?.find((d: any) => d.attribute === firstAttr)
        if (match?.value) allValues.add(match.value)
      })
      variationsTitle = { attribute: firstAttr, values: Array.from(allValues) }
    }

    // Get best SKU for main variation
    const bestSku = skus.find((s: any) => s.compareAtPrice > 0) || skus[0]

    // Parallelize remaining queries: seller orders + reviews
    const sellerId = style.sellerData?.[0]?._id?.toString()
    const styleId = style._id.toString()

    const [ordersResult, reviewsResult, allReviewsResult] = await Promise.all([
      // Seller orders for sales history
      sellerId ? payload.find({
        collection: 'orders',
        where: { sellers: { contains: sellerId } },
        limit: 1000,
        depth: 0,
      }) : Promise.resolve({ docs: [] }),

      // Reviews (paginated)
      payload.find({
        collection: 'reviews',
        where: { style: { equals: styleId } },
        limit: 10,
        page: 1,
        sort: '-createdAt',
        depth: 2,
      }),

      // All reviews for statistics
      payload.find({
        collection: 'reviews',
        where: { style: { equals: styleId } },
        pagination: false,
        depth: 0,
      })
    ])

    // Calculate seller stats
    let itemsSold = 0, shipped = 0, cancelled = 0
    ordersResult.docs.forEach((order: any) => {
      order.items?.forEach((item: any) => {
        const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
        if (itemSellerId === sellerId) {
          itemsSold += item.quantity || 1
          if (item.shippingStatus === 'delivered' || item.shippingStatus === 'out_for_delivery') {
            shipped += item.quantity || 1
          } else if (item.shippingStatus === 'returned' || item.shippingStatus === 'not_available') {
            cancelled += item.quantity || 1
          }
        }
      })
    })

    // Build seller data
    const sellerDoc = style.sellerData?.[0]
    const sellerData = sellerDoc ? {
      id: sellerDoc._id.toString(),
      name: sellerDoc.shopName || [sellerDoc.firstName, sellerDoc.lastName].filter(Boolean).join(' ') || 'User',
      username: sellerDoc.username || null,
      profileImage: sellerDoc.photoData?.[0]?.url || null,
      trustedSeller: sellerDoc.trustedSeller || false,
      vacationMode: sellerDoc.vacationMode || false,
      usuallyShipsIn: '24 hours',
      salesHistory: {
        itemsSold: formatCompactNumberWithPlus(itemsSold),
        shipped: formatCompactNumberWithPlus(shipped),
        cancelled: formatCompactNumberWithPlus(cancelled),
      },
      memberSince: sellerDoc.createdAt,
    } : null

    // Transform reviews
    const reviews = reviewsResult.docs.map((review: any) => {
      const reviewer = typeof review.user === 'object' ? review.user : null
      return {
        id: review.id,
        rating: review.rating || 0,
        review: review.review || '',
        images: (review.images || []).map((img: any) => img?.url).filter(Boolean),
        reviewer: {
          id: reviewer?.id || '',
          name: reviewer?.firstName || 'Anonymous',
          profileImage: reviewer?.photo?.url || null,
        },
        createdAt: review.createdAt,
        helpful: review.helpful || 0,
        verified: review.verified || false,
      }
    })

    // Calculate rating distribution
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    let totalRating = 0
    allReviewsResult.docs.forEach((r: any) => {
      const rating = r.rating || 0
      totalRating += rating
      if (rating >= 1 && rating <= 5) ratingDistribution[rating as 1|2|3|4|5]++
    })
    const totalReviews = allReviewsResult.docs.length
    const averageRating = totalReviews > 0 ? Math.round((totalRating / totalReviews) * 10) / 10 : 0

    // Build variants string (e.g., "Color - Size")
    const variantsString = attributeDetails.map((d: any) => d.name).join(' - ')

    // Build simplified SKU list for compatibility
    const simplifiedSkus = skus.map((sku: any) => {
      const sizeOpt = sku.options?.find((o: any) =>
        o.option?.toLowerCase() === 'size' || o.option?.toLowerCase() === 'waist size'
      )
      return {
        value: sizeOpt?.value || sku.options?.[0]?.value || 'Standard',
        sellingPrice: sku.sellingPrice || 0,
      }
    })

    return Response.json({
      variation: {
        id: variation._id.toString(),
        thumbnail,
        title: variation.title || '',
        slug: variation.slug || '',
        images,
        styleDescription: style.description || null,
        authenticity: style.authenticity || null,
        details,
        skus,
        variationsTitle,
        sellerId: sellerId || null,
        sellingPrice: bestSku?.sellingPrice || 0,
        compareAtPrice: bestSku?.compareAtPrice || undefined,
        flashSaleEndDate: bestSku?.flashSaleEndDate || null,
        currency: { code: countryInfo.currencyCode, symbol: countryInfo.currencySymbol },
        category: style.categoryData?.[0]?.category || style.categoryData?.[0]?.name || null,
        brand: style.brandData?.[0]?.name || null,
        isBoosted: style.hasActiveBoost || false,
        showWeLoveBadge: style.activeBoost?.tierData?.showWeLoveBadge || false,
        styleId,
        // Additional fields for mobile app compatibility
        variants: variantsString,
        defaultSku: bestSku?.id || undefined,
        totalStock: bestSku?.stock || 0,
      },
      relatedVariations,
      seller: sellerData,
      styleReviews: {
        reviews,
        totalReviews,
        averageRating,
        ratingDistribution,
      }
    })
  } catch (error) {
    console.error('Error fetching variation:', error)
    payload.logger.error(`Error fetching variation: ${error}`)
    return Response.json(
      { error: 'Failed to fetch variation', message: error instanceof Error ? error.message : 'Unknown error', stack: error instanceof Error ? error.stack : undefined },
      { status: 500 }
    )
  }
}
