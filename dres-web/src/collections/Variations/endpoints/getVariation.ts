import type { PayloadHandler } from 'payload'
import { transformVariation } from '../utils/transformVariation'
import { getSellerData } from '../utils/getSellerData'
import { getStyleReviews } from '../../../utilities/getStyleReviews'

export const getVariation: PayloadHandler = async (req) => {
  const { payload } = req
  const { slug } = req.routeParams || {}

  if (!slug) {
    return Response.json(
      { error: 'Variation slug is required' },
      { status: 400 }
    )
  }

  try {
    // Fetch the variation with full depth by slug or id
    const variationResult = await payload.find({
      collection: 'variations',
      where: {
        or: [
          {
            slug: {
              equals: slug as string,
            },
          },
          {
            id: {
              equals: slug as string,
            },
          },
        ],
      },
      depth: 5,
      limit: 1,
    })

    const variation = variationResult.docs[0]

    if (!variation) {
      return Response.json(
        { error: 'Variation not found' },
        { status: 404 }
      )
    }

    // Fetch the full style with boost data
    const styleId = typeof variation.style === 'object' ? variation.style.id : variation.style
    let fullStyle: any = null
    
    if (styleId) {
      fullStyle = await payload.findByID({
        collection: 'styles',
        id: styleId,
        depth: 5, // Increased depth to ensure category is populated
      })
      variation.style = fullStyle
    }

    // Transform the variation (without related variations from transformVariation)
    const transformed = transformVariation(variation, false)

    // Add images field (all images from the variation)
    const images = Array.isArray(variation.images) 
      ? variation.images.map((img: any) => {
          const imageData = typeof img === 'object' ? img : null
          return imageData ? {
            id: imageData.id,
            url: imageData.url,
            alt: imageData.alt || variation.title,
            filename: imageData.filename,
            mimeType: imageData.mimeType,
            width: imageData.width,
            height: imageData.height,
          } : null
        }).filter(Boolean)
      : []

    // Get related variations from the same style (only for this endpoint)
    const relatedVariations: any[] = []
    
    if (styleId) {
      const relatedResult = await payload.find({
        collection: 'variations',
        where: {
          and: [
            { style: { equals: styleId } },
            { id: { not_equals: variation.id } }, // Exclude current variation
          ]
        },
        limit: 10,
        depth: 5,
      })

      // Transform related variations (without nesting relatedVariations)
      for (const relatedVar of relatedResult.docs) {
        // Fetch full style for each related variation
        const relatedStyleId = typeof relatedVar.style === 'object' ? relatedVar.style.id : relatedVar.style
        if (relatedStyleId) {
          const fullRelatedStyle = await payload.findByID({
            collection: 'styles',
            id: relatedStyleId,
            depth: 5, // Increased depth
          })
          relatedVar.style = fullRelatedStyle
        }
        
        // Get SKUs for related variation with same structure as parent
        const relatedSkus = await payload.find({
          collection: 'skus',
          where: { variation: { equals: relatedVar.id } },
          depth: 2,
        })

        const relatedSkusWithOptions = await Promise.all(
          relatedSkus.docs.map(async (sku: any) => {
            const options = Array.isArray(sku.skuOptions)
              ? await Promise.all(
                  sku.skuOptions.map(async (opt: any) => {
                    const optionId = typeof opt.option === 'object' ? opt.option.id : opt.option
                    const valueId = typeof opt.value === 'object' ? opt.value.id : opt.value

                    const option = await payload.findByID({
                      collection: 'attributes',
                      id: optionId,
                    })

                    const value = await payload.findByID({
                      collection: 'attributeOptions',
                      id: valueId,
                    })

                    return {
                      option: option.name,
                      value: value.name,
                    }
                  })
                )
              : []

            return {
              id: sku.id,
              options,
              price: sku.price,
              compareAtPrice: sku.compareAtPrice || null,
              stock: sku.stock || 0,
            }
          })
        )

        // Get variation-level attributes (details) for related variation
        const relatedDetails = Array.isArray(relatedVar.variants)
          ? await Promise.all(
              relatedVar.variants.map(async (variant: any) => {
                const variantId = typeof variant.variant === 'object' ? variant.variant.id : variant.variant
                const valueId = typeof variant.value === 'object' ? variant.value.id : variant.value

                const attribute = await payload.findByID({
                  collection: 'attributes',
                  id: variantId,
                })

                const value = await payload.findByID({
                  collection: 'attributeOptions',
                  id: valueId,
                })

                return {
                  attribute: attribute.name,
                  value: value.name,
                }
              })
            )
          : []
        
        const transformedRelated = await transformVariation(relatedVar, false)
        
        if (transformedRelated) {
          // Create extended variation with SKUs and details
          const extendedRelated = {
            ...transformedRelated,
            skus: relatedSkusWithOptions,
            details: relatedDetails
          }
          
          relatedVariations.push(extendedRelated as any)
        }
      }
    }

    // Extract variant details (variation-level attributes) and add metadata
    const attributeDetails = Array.isArray(variation.variants)
      ? await Promise.all(
          variation.variants.map(async (variant: any) => {
            const attributeId = typeof variant.variant === 'object' ? variant.variant.id : variant.variant
            const valueId = typeof variant.value === 'object' ? variant.value.id : variant.value

            const attribute = await payload.findByID({
              collection: 'attributes',
              id: attributeId,
            })

            const value = await payload.findByID({
              collection: 'attributeOptions',
              id: valueId,
            })

            return {
              name: attribute.name,
              value: value.name,
            }
          })
        )
      : []

    // Add department, collection, category, and brand to details
    const details: { name: string; value: string }[] = []

    // Add department
    if (fullStyle?.department) {
      const department = typeof fullStyle.department === 'object' ? fullStyle.department : null
      if (department?.name) {
        details.push({
          name: 'Department',
          value: department.name,
        })
      }
    }

    // Add category
    if (fullStyle?.category) {
      const category = typeof fullStyle.category === 'object' ? fullStyle.category : null
      const categoryName = category?.category || category?.name
      if (categoryName) {
        details.push({
          name: 'Category',
          value: categoryName,
        })
      }
    }

    // Add collection
    if (fullStyle?.collection) {
      const collection = typeof fullStyle.collection === 'object' ? fullStyle.collection : null
      if (collection?.name) {
        details.push({
          name: 'Collection',
          value: collection.name,
        })
      }
    }

    // Add brand
    if (fullStyle?.brand) {
      const brand = typeof fullStyle.brand === 'object' ? fullStyle.brand : null
      if (brand?.name) {
        details.push({
          name: 'Brand',
          value: brand.name,
        })
      }
    }

    // Add attribute details
    details.push(...attributeDetails)

    // Create variationsTitle from first variation attribute (not metadata)
    let variationsTitle: { attribute: string; values: string[] } | null = null
    if (attributeDetails.length > 0) {
      const firstAttribute = attributeDetails[0].name
      const allValues = new Set<string>()
      
      // Add current variation's value
      allValues.add(attributeDetails[0].value)
      
      // Add related variations' values for the same attribute (if there are related variations)
      if (relatedVariations.length > 0) {
        relatedVariations.forEach((related: any) => {
          if (related.details && Array.isArray(related.details)) {
            // Find the matching attribute in related variation
            const relatedFirstDetail = related.details.find((d: any) => d.attribute === firstAttribute)
            if (relatedFirstDetail?.value) {
              allValues.add(relatedFirstDetail.value)
            }
          }
        })
      }
      
      variationsTitle = {
        attribute: firstAttribute,
        values: Array.from(allValues)
      }
    }

    // Fetch SKUs with their options
    const skusResult = await payload.find({
      collection: 'skus',
      where: {
        variation: { equals: variation.id }
      },
      depth: 3,
    })

    const skus = await Promise.all(
      skusResult.docs.map(async (sku: any) => {
        const options = Array.isArray(sku.skuOptions)
          ? await Promise.all(
              sku.skuOptions.map(async (skuOption: any) => {
                const optionId = typeof skuOption.option === 'object' ? skuOption.option.id : skuOption.option
                const valueId = typeof skuOption.value === 'object' ? skuOption.value.id : skuOption.value

                const option = await payload.findByID({
                  collection: 'attributes',
                  id: optionId,
                })

                const value = await payload.findByID({
                  collection: 'attributeOptions',
                  id: valueId,
                })

                return {
                  option: option.name,
                  value: value.name,
                }
              })
            )
          : []

        return {
          id: sku.id,
          options,
          price: sku.price,
          compareAtPrice: sku.compareAtPrice,
          stock: sku.stock,
        }
      })
    )

    // Get seller information
    const sellerId = typeof fullStyle?.seller === 'object' ? fullStyle.seller.id : fullStyle?.seller
    const sellerData = await getSellerData(payload, sellerId)

    // Get style reviews
    const styleReviews = styleId ? await getStyleReviews(payload, styleId, 1, 10) : null

    return Response.json({
      variation: {
        ...transformed,
        images,
        styleDescription: fullStyle?.description || null,
        details,
        skus: skus as any, // Custom SKU structure with options
        variationsTitle,
      },
      relatedVariations: relatedVariations as any, // Custom structure with details
      seller: sellerData,
      styleReviews: styleReviews 
    })
  } catch (error) {
    payload.logger.error(`Error fetching variation: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch variation',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
