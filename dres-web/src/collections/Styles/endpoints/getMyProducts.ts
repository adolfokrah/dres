import type { PayloadHandler } from 'payload'

/**
 * GET /api/styles/my-products
 * Fetch the current user's published styles (products)
 */
export const getMyProducts: PayloadHandler = async (req) => {
  const { payload, user, query } = req

  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20

  try {
    // Fetch published styles for the current user
    const stylesResult = await payload.find({
      collection: 'styles',
      where: {
        seller: { equals: user.id },
        status: { equals: 'published' },
      },
      depth: 3,
      limit,
      page,
      sort: '-updatedAt',
    })

    // Process each style to get product info
    const products: ProductStyle[] = []

    for (const style of stylesResult.docs) {
      // Get the first variation's image as thumbnail
      let thumbnail: string | null = null
      let variationCount = 0
      let totalStock = 0
      let lowestPrice: number | null = null

      const variations = style.variations?.docs || []
      variationCount = variations.length

      for (const variation of variations) {
        if (typeof variation === 'string') continue

        // Get first image as thumbnail
        if (!thumbnail && variation.images && variation.images.length > 0) {
          const firstImage = variation.images[0]
          if (typeof firstImage === 'object' && 'url' in firstImage) {
            thumbnail = firstImage.url || null
          } else if (typeof firstImage === 'string') {
            try {
              const imageDoc = await payload.findByID({
                collection: 'media',
                id: firstImage,
              })
              if (imageDoc && imageDoc.url) {
                thumbnail = imageDoc.url
              }
            } catch {
              // Ignore error
            }
          }
        }

        // Get SKUs for stock and price
        const skus = variation.skus?.docs || []
        for (const sku of skus) {
          if (typeof sku === 'string') continue
          
          // Add stock
          if (sku.stock !== undefined && sku.stock !== null) {
            totalStock += sku.stock
          }

          // Track lowest price
          const price = sku.sellingPrice || sku.price
          if (price && (lowestPrice === null || price < lowestPrice)) {
            lowestPrice = price
          }
        }
      }

      // Get brand name
      let brandName: string | null = null
      if (style.brand && typeof style.brand === 'object') {
        brandName = style.brand.name || null
      }

      products.push({
        id: style.id,
        title: style.title || '',
        brandName,
        thumbnail,
        variationCount,
        totalStock,
        lowestPrice,
        updatedAt: style.updatedAt,
        createdAt: style.createdAt,
      })
    }

    return Response.json({
      docs: products,
      totalDocs: stylesResult.totalDocs,
      totalPages: stylesResult.totalPages,
      page: stylesResult.page,
      limit: stylesResult.limit,
      hasNextPage: stylesResult.hasNextPage,
      hasPrevPage: stylesResult.hasPrevPage,
    })
  } catch (error) {
    payload.logger.error(`Error fetching products: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch products',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

interface ProductStyle {
  id: string
  title: string
  brandName: string | null
  thumbnail: string | null
  variationCount: number
  totalStock: number
  lowestPrice: number | null
  updatedAt: string
  createdAt: string
}
