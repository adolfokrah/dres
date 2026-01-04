import type { PayloadHandler } from 'payload'

/**
 * GET /api/variations/seller/:sellerId
 * Fetch a seller's published variations (products for sale)
 */
export const getSellerVariations: PayloadHandler = async (req) => {
  const { payload, routeParams } = req
  const sellerId = routeParams?.sellerId as string

  if (!sellerId) {
    return Response.json({ error: 'Seller ID is required' }, { status: 400 })
  }

  // Get query params from URL
  const url = new URL(req.url || '', 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')

  try {
    console.log('🛍️ getSellerVariations: sellerId =', sellerId)
    
    // First, find all PUBLISHED styles belonging to this seller
    // Query seller and status separately to debug
    const stylesResult = await payload.find({
      collection: 'styles',
      where: {
        seller: { equals: sellerId },
        status: { equals: 'published' },
      },
      limit: 1000,
      depth: 0,
    })

    console.log('🛍️ Found styles:', stylesResult.totalDocs, stylesResult.docs.map((s: any) => ({ id: s.id, seller: s.seller, status: s.status })))

    const styleIds = stylesResult.docs.map((style: any) => style.id)

    if (styleIds.length === 0) {
      console.log('🛍️ No styles found, returning empty')
      return Response.json({
        docs: [],
        totalDocs: 0,
        totalPages: 1,
        page: 1,
        limit,
        hasNextPage: false,
        hasPrevPage: false,
      })
    }

    // Fetch published variations for these styles
    // Note: variations use 'active' status, not 'published'
    const variationsResult = await payload.find({
      collection: 'variations',
      where: {
        and: [
          { style: { in: styleIds } },
          { status: { equals: 'active' } },
        ],
      },
      depth: 2,
      limit,
      page,
      sort: '-createdAt',
    })

    // Transform variations for the response
    const products = variationsResult.docs.map((variation: any) => {
      // Get first image as thumbnail
      let thumbnail: string | null = null
      if (variation.images && variation.images.length > 0) {
        const firstImage = variation.images[0]
        if (typeof firstImage === 'object' && firstImage?.url) {
          thumbnail = firstImage.url
        }
      }

      // Get brand name from style
      let brandName: string | null = null
      if (variation.style && typeof variation.style === 'object') {
        if (variation.style.brand && typeof variation.style.brand === 'object') {
          brandName = variation.style.brand.name || null
        }
      }

      // Get the lowest price from SKUs
      let lowestPrice: number | null = null
      let totalStock = 0
      const skus = variation.skus?.docs || variation.skus || []
      for (const sku of skus) {
        if (typeof sku === 'string') continue
        
        const price = sku.sellingPrice || sku.price
        if (price && (lowestPrice === null || price < lowestPrice)) {
          lowestPrice = price
        }
        
        if (sku.stock !== undefined && sku.stock !== null) {
          totalStock += sku.stock
        }
      }

      return {
        id: variation.id,
        title: variation.title || '',
        brandName,
        thumbnail,
        lowestPrice,
        totalStock,
        colorName: variation.colorName || null,
        styleId: typeof variation.style === 'object' ? variation.style.id : variation.style,
        createdAt: variation.createdAt,
      }
    })

    return Response.json({
      docs: products,
      totalDocs: variationsResult.totalDocs,
      totalPages: variationsResult.totalPages,
      page: variationsResult.page,
      limit: variationsResult.limit,
      hasNextPage: variationsResult.hasNextPage,
      hasPrevPage: variationsResult.hasPrevPage,
    })
  } catch (error) {
    payload.logger.error(`Error fetching seller variations: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch seller variations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
