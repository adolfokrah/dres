import type { PayloadHandler } from 'payload'
import { ObjectId } from 'mongodb'
import { getUserCountryInfo } from '../../../utilities/countryUtils'

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

// Helper to construct media URL from filename
const getMediaUrl = (media: any, size?: 'thumbnail' | 'card'): string | null => {
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

export const getCart: PayloadHandler = async (req) => {
  const { payload, user } = req

  try {
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Get user's country for comparison
    const userCountry = await getUserCountryInfo(req)
    const userCountryId = userCountry.countryId ? toObjectId(userCountry.countryId) : null

    const db = payload.db
    const cartsCollection = db.collections['carts']

    // Single aggregation to fetch cart with all necessary data
    const pipeline: any[] = [
      {
        $match: {
          customer: toObjectId(user.id),
          status: 'active'
        }
      },
      { $limit: 1 },
      // Unwind items to process each
      { $unwind: { path: '$items', preserveNullAndEmptyArrays: true } },
      // Lookup variation
      {
        $lookup: {
          from: 'variations',
          localField: 'items.variation',
          foreignField: '_id',
          as: 'items.variationData',
          pipeline: [
            // Lookup style with seller
            {
              $lookup: {
                from: 'styles',
                localField: 'style',
                foreignField: '_id',
                as: 'styleData',
                pipeline: [
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
                            pipeline: [{ $project: { filename: 1, sizes: 1 } }]
                          }
                        },
                        { $project: { firstName: 1, lastName: 1, shopName: 1, vacationMode: 1, isTrusted: 1, country: 1, photoData: 1 } }
                      ]
                    }
                  },
                  {
                    $lookup: {
                      from: 'brands',
                      localField: 'brand',
                      foreignField: '_id',
                      as: 'brandData',
                      pipeline: [{ $project: { name: 1 } }]
                    }
                  }
                ]
              }
            },
            // Lookup images
            {
              $lookup: {
                from: 'media',
                localField: 'images',
                foreignField: '_id',
                as: 'imageData',
                pipeline: [{ $project: { filename: 1, sizes: 1, alt: 1 } }]
              }
            },
            { $project: { title: 1, slug: 1, status: 1, styleData: 1, imageData: 1 } }
          ]
        }
      },
      // Lookup SKU with currency
      {
        $lookup: {
          from: 'skus',
          localField: 'items.sku',
          foreignField: '_id',
          as: 'items.skuData',
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
            // Lookup SKU options
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
          ]
        }
      },
      // Group back into cart
      {
        $group: {
          _id: '$_id',
          customer: { $first: '$customer' },
          status: { $first: '$status' },
          discountCode: { $first: '$discountCode' },
          shippingCity: { $first: '$shippingCity' },
          shippingRate: { $first: '$shippingRate' },
          createdAt: { $first: '$createdAt' },
          updatedAt: { $first: '$updatedAt' },
          items: {
            $push: {
              $cond: {
                if: { $ne: ['$items.variation', null] },
                then: '$items',
                else: '$$REMOVE'
              }
            }
          }
        }
      }
    ]

    const [cartResult] = await cartsCollection.aggregate(pipeline)

    if (!cartResult) {
      return Response.json({ cart: null, message: 'No active cart' })
    }

    // Pre-fetch SKUs that need option resolution (where aggregation failed)
    const skusNeedingResolution = (cartResult.items || [])
      .map((item: any) => {
        const sku = item.skuData?.[0]
        const skuId = sku?._id || sku?.id
        if (!skuId || !sku?.skuOptions?.length) return null
        
        // Check if aggregation resolved options properly
        const resolvedFromAggregation = (sku.skuOptions || []).map((opt: any) => {
          const optAttr = sku.optionAttributes?.find((a: any) => a._id?.toString() === opt.option?.toString())
          const optVal = sku.optionValues?.find((v: any) => v._id?.toString() === opt.value?.toString())
          return { option: optAttr?.name || '', value: optVal?.name || '' }
        }).filter((o: any) => o.option && o.value)
        
        // If we have skuOptions but resolved 0 (aggregation lookup failed), we need to fetch
        return (sku.skuOptions.length > 0 && resolvedFromAggregation.length === 0) ? skuId.toString() : null
      })
      .filter(Boolean)

    // Fetch all SKUs that need resolution in one call
    let resolvedSkus = new Map()
    if (skusNeedingResolution.length > 0) {
      try {
        const skuResponse = await payload.find({
          collection: 'skus',
          where: {
            id: { in: skusNeedingResolution }
          },
          depth: 2,
          limit: 100
        })
        
        skuResponse.docs.forEach((sku: any) => {
          const options = (sku.skuOptions || []).map((opt: any) => ({
            option: opt.option?.name || '',
            value: opt.value?.name || '',
          })).filter((o: any) => o.option && o.value)
          resolvedSkus.set(sku.id.toString(), options)
        })
      } catch (error) {
        console.error('Failed to fetch SKU options:', error)
      }
    }

    // Transform the aggregation result
    let subtotal = 0
    let itemCount = 0
    const validationIssues: string[] = []

    const transformedItems = (cartResult.items || []).map((item: any) => {
      const variation = item.variationData?.[0]
      const sku = item.skuData?.[0]
      const style = variation?.styleData?.[0]
      const seller = style?.sellerData?.[0]
      const brand = style?.brandData?.[0]
      const quantity = item.quantity || 1

      // Build enrichment flags
      let isSellerOnVacation = false
      let isOutOfStock = false
      let isNotInYourCountry = false
      let isArchived = false
      let valid = true
      let reason: string | null = null

      // Check variation archived
      if (variation?.status === 'archived') {
        isArchived = true
        valid = false
        reason = 'Item no longer available'
      }

      // Check SKU status
      if (sku?.status === 'archived') {
        isArchived = true
        valid = false
        reason = 'Item no longer available'
      } else if (sku?.isActive === false) {
        isOutOfStock = true
        valid = false
        reason = 'Out of stock'
      } else if (sku?.stock !== null && sku?.stock !== undefined) {
        if (sku.stock <= 0) {
          isOutOfStock = true
          valid = false
          reason = 'Out of stock'
        } else if (quantity > sku.stock) {
          valid = false
          reason = `Only ${sku.stock} available`
        }
      }

      // Check seller vacation
      if (seller?.vacationMode) {
        isSellerOnVacation = true
        valid = false
        reason = 'Seller is currently on vacation'
      }

      // Check seller country
      if (userCountryId && seller?.country) {
        const sellerCountryId = typeof seller.country === 'object' ? seller.country.toString() : seller.country
        if (sellerCountryId !== userCountryId.toString()) {
          isNotInYourCountry = true
          valid = false
          reason = 'Item not available in your country'
        }
      }

      // Calculate price
      const price = sku?.sellingPrice || sku?.price || 0
      const itemTotal = price * quantity

      // Always count items regardless of validity (for display purposes)
      itemCount += quantity

      // Only add to subtotal if item is valid (for checkout)
      if (valid) {
        subtotal += itemTotal
      }

      // Get first image thumbnail
      const firstImage = variation?.imageData?.[0]
      const thumbnail = getMediaUrl(firstImage, 'thumbnail') || getMediaUrl(firstImage)

      // Build seller info
      const sellerPhoto = seller?.photoData?.[0]
      const photoUrl = sellerPhoto ? getMediaUrl(sellerPhoto, 'thumbnail') : null
      const sellerInfo = seller ? {
        id: seller._id.toString(),
        displayName: seller.shopName || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Seller',
        shopName: seller.shopName,
        firstName: seller.firstName,
        lastName: seller.lastName,
        photo: photoUrl,
        vacationMode: seller.vacationMode || false,
        isTrusted: seller.isTrusted || false,
      } : null

      // Debug: Log if seller or photo is missing
      if (!seller) {
        payload.logger.warn(`⚠️ Missing seller data for variation ${variation?._id}`)
      } else if (!photoUrl && seller.photo) {
        payload.logger.info(`📸 Seller ${seller._id} has photo ID ${seller.photo} but no photoData in aggregation`)
      }

      // Build SKU options - use pre-fetched data if available
      let skuOptions: Array<{ option: string; value: string }> = []
      if (sku?.skuOptions?.length) {
        // Try to resolve from aggregation first
        const resolvedFromAggregation = (sku.skuOptions || []).map((opt: any) => {
          const optAttr = sku.optionAttributes?.find((a: any) => a._id?.toString() === opt.option?.toString())
          const optVal = sku.optionValues?.find((v: any) => v._id?.toString() === opt.value?.toString())
          return { option: optAttr?.name || '', value: optVal?.name || '' }
        }).filter((o: any) => o.option && o.value)

        if (resolvedFromAggregation.length === 0 && (sku._id || sku.id)) {
          // Use pre-fetched resolved data
          skuOptions = resolvedSkus.get((sku._id || sku.id).toString()) || []
        } else {
          skuOptions = resolvedFromAggregation
        }
      }

      // Get currency
      const currency = sku?.currencyData?.[0]

      return {
        variationId: variation?._id?.toString() || item.variation?.toString(),
        skuId: sku?._id?.toString() || item.sku?.toString(),
        quantity,
        price,
        buyerProtection: item.buyerProtection || false,
        buyerProtectionFee: item.buyerProtection ? Math.round(price * quantity * 0.02) : 0,
        shippingFee: 0, // Will be calculated based on shipping rate
        addedAt: item.addedAt,
        // Variation info
        variation: variation ? {
          id: variation._id.toString(),
          title: variation.title,
          slug: variation.slug,
          thumbnail,
          brand: brand?.name || null,
          seller: sellerInfo, // For direct access
          style: { // For nested access (mobile app expects this)
            seller: sellerInfo,
            brand: brand?.name ? { name: brand.name } : null,
          },
        } : null,
        // SKU info
        sku: sku ? {
          id: sku._id.toString(),
          stock: sku.stock,
          isActive: sku.isActive,
          price,
          sellingPrice: sku.sellingPrice || null,
          compareAtPrice: sku.compareAtPrice || null,
          options: skuOptions,
          currency: currency ? { code: currency.code, symbol: currency.symbol } : null,
        } : null,
        // Validation flags
        isSellerOnVacation,
        isOutOfStock,
        isNotInYourCountry,
        isArchived,
        stockQuantity: sku?.stock ?? null,
        availableStock: sku?.stock ?? null,
        valid,
        reason,
      }
    })

    // Build validation summary
    const invalidItems = transformedItems.filter((item: any) => !item.valid)
    if (invalidItems.some((item: any) => item.isArchived)) validationIssues.push('Some items are no longer available')
    if (invalidItems.some((item: any) => item.isOutOfStock)) validationIssues.push('Some items are out of stock')
    if (invalidItems.some((item: any) => item.isNotInYourCountry)) validationIssues.push('Some items are not available in your country')
    if (invalidItems.some((item: any) => item.isSellerOnVacation)) validationIssues.push('Some sellers are on vacation')

    // Check minimum order value
    let minOrderValue = 30 // Default ₵30
    try {
      const siteSettings = await payload.findGlobal({ slug: 'site-settings' })
      if (siteSettings?.minOrderValue) {
        minOrderValue = siteSettings.minOrderValue as number
      }
    } catch {
      // Use default
    }

    const belowMinimumOrder = subtotal < minOrderValue
    if (belowMinimumOrder) {
      validationIssues.push(`Minimum order value is ₵${minOrderValue.toFixed(2)}. Add ₵${(minOrderValue - subtotal).toFixed(2)} more to checkout.`)
    }

    return Response.json({
      cart: {
        id: cartResult._id.toString(),
        status: cartResult.status,
        items: transformedItems,
        itemCount,
        subtotal,
        grandTotal: subtotal, // Will add shipping/discounts later
        discountAmount: 0,
        pointsDiscount: 0,
        discountCode: cartResult.discountCode || null,
      },
      message: 'Cart retrieved successfully',
      validation: {
        valid: invalidItems.length === 0 && !belowMinimumOrder,
        reasons: validationIssues,
      },
    })
  } catch (error) {
    console.error('Get cart error:', error)
    return Response.json(
      { error: 'Failed to get cart', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
