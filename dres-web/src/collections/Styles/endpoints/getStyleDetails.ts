import type { PayloadHandler } from 'payload'

/**
 * GET /api/styles/:id/details
 * Fetch style details with all variations and their SKUs included
 */
export const getStyleDetails: PayloadHandler = async (req) => {
  const { payload } = req
  const { id } = req.routeParams || {}

  if (!id) {
    return Response.json({ error: 'Style ID is required' }, { status: 400 })
  }

  try {
    // Fetch the style by ID or slug
    const styleResult = await payload.find({
      collection: 'styles',
      where: {
        or: [{ id: { equals: id as string } }, { slug: { equals: id as string } }],
      },
      depth: 3,
      limit: 1,
    })

    const style = styleResult.docs[0]

    if (!style) {
      return Response.json({ error: 'Style not found' }, { status: 404 })
    }

    // Check if style is archived
    if (style.status === 'archived') {
      return Response.json({ error: 'Style not found' }, { status: 404 })
    }

    // Fetch variations for this style (join field doesn't auto-populate)
    const variationsResult = await payload.find({
      collection: 'variations',
      where: {
        style: { equals: style.id },
        status: { not_equals: 'archived' },
      },
      depth: 3,
      limit: 100,
      sort: '-createdAt',
    })

    // For each variation, fetch its SKUs (also a join field)
    const variationsWithSkus = await Promise.all(
      variationsResult.docs.map(async (variation) => {
        const skusResult = await payload.find({
          collection: 'skus',
          where: {
            variation: { equals: variation.id },
            status: { not_equals: 'archived' },
          },
          depth: 2,
          limit: 100,
        })

        // Transform images to a cleaner format
        const images = Array.isArray(variation.images)
          ? variation.images
              .map((img: any) => {
                const imageData = typeof img === 'object' ? img : null
                return imageData
                  ? {
                      id: imageData.id,
                      url: imageData.url,
                      alt: imageData.alt || variation.title,
                      filename: imageData.filename,
                      width: imageData.width,
                      height: imageData.height,
                    }
                  : null
              })
              .filter(Boolean)
          : []

        // Transform variant attributes
        const attributes = Array.isArray(variation.variants)
          ? await Promise.all(
              variation.variants.map(async (variant: any) => {
                const attributeId =
                  typeof variant.variant === 'object' ? variant.variant.id : variant.variant
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
              }),
            )
          : []

        // Transform SKUs
        const skus = await Promise.all(
          skusResult.docs.map(async (sku: any) => {
            const options = Array.isArray(sku.skuOptions)
              ? await Promise.all(
                  sku.skuOptions.map(async (skuOption: any) => {
                    const optionId =
                      typeof skuOption.option === 'object' ? skuOption.option.id : skuOption.option
                    const valueId =
                      typeof skuOption.value === 'object' ? skuOption.value.id : skuOption.value

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
                  }),
                )
              : []

            return {
              id: sku.id,
              options,
              sellingPrice: sku.sellingPrice,
              compareAtPrice: sku.compareAtPrice || null,
              stock: sku.stock || 0,
            }
          }),
        )

        return {
          id: variation.id,
          title: variation.title,
          slug: variation.slug,
          status: variation.status,
          images,
          attributes,
          skus,
          createdAt: variation.createdAt,
          updatedAt: variation.updatedAt,
        }
      }),
    )

    // Extract brand, category, department, collection info
    const brand = style.brand && typeof style.brand === 'object' ? style.brand : null
    const category = style.category && typeof style.category === 'object' ? style.category : null
    const department =
      style.department && typeof style.department === 'object' ? style.department : null
    const collection =
      style.collection && typeof style.collection === 'object' ? style.collection : null
    const seller = style.seller && typeof style.seller === 'object' ? style.seller : null

    return Response.json({
      style: {
        id: style.id,
        title: style.title,
        description: style.description,
        status: style.status,
        isResell: style.isResell,
        department: department
          ? {
              id: department.id,
              name: department.name,
            }
          : null,
        collection: collection
          ? {
              id: collection.id,
              name: collection.name,
            }
          : null,
        category: category
          ? {
              id: category.id,
              name: (category as any).category || (category as any).name,
            }
          : null,
        brand: brand
          ? {
              id: brand.id,
              name: brand.name,
            }
          : null,
        seller: seller
          ? {
              id: seller.id,
              firstName: (seller as any).firstName || null,
              lastName: (seller as any).lastName || null,
              businessName: (seller as any).businessName || null,
            }
          : null,
        createdAt: style.createdAt,
        updatedAt: style.updatedAt,
      },
      variations: variationsWithSkus,
      totalVariations: variationsResult.totalDocs,
    })
  } catch (error) {
    payload.logger.error(`Error fetching style details: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch style details',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
