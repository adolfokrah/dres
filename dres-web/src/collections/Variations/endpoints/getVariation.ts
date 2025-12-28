import type { PayloadHandler } from 'payload'
import { transformVariation } from '../utils/transformVariation'

export const getVariation: PayloadHandler = async (req) => {
  const { payload } = req
  const { id } = req.routeParams || {}

  if (!id) {
    return Response.json(
      { error: 'Variation ID is required' },
      { status: 400 }
    )
  }

  try {
    // Fetch the variation with full depth
    const variation = await payload.findByID({
      collection: 'variations',
      id: id as string,
      depth: 5,
    })

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
        depth: 3,
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
            { id: { not_equals: id } }, // Exclude current variation
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
            depth: 3,
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

    // Extract variant details (variation-level attributes)
    const details = Array.isArray(variation.variants)
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
              attribute: {
                id: attribute.id,
                name: attribute.name,
              },
              value: {
                id: value.id,
                name: value.name,
                slug: value.slug,
              },
            }
          })
        )
      : []

    // Create variationsTitle from first detail attribute
    let variationsTitle: { attribute: string; values: string[] } | null = null
    if (details.length > 0 && relatedVariations.length > 0) {
      const firstAttribute = details[0].attribute.name
      const allValues = new Set<string>()
      
      // Add current variation's value
      allValues.add(details[0].value.name)
      
      // Add related variations' values for the same attribute
      relatedVariations.forEach((related: any) => {
        if (related.details && related.details.length > 0) {
          const relatedFirstDetail = related.details.find((d: any) => d.attribute === firstAttribute)
          if (relatedFirstDetail) {
            allValues.add(relatedFirstDetail.value)
          }
        }
      })
      
      variationsTitle = {
        attribute: firstAttribute,
        values: Array.from(allValues)
      }
    }

    // Fetch SKUs with their options
    const skusResult = await payload.find({
      collection: 'skus',
      where: {
        variation: { equals: id }
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
