import type { PayloadHandler } from 'payload'

/**
 * GET /api/style-info/:styleId
 *
 * Fetches minimal style info for the review screen
 * Returns: title, brandName, thumbnailUrl, seller info
 */
export const getStyleInfo: PayloadHandler = async (req) => {
  const { payload, routeParams } = req
  const styleId = routeParams?.styleId as string

  if (!styleId) {
    return Response.json(
      { error: 'Style ID is required' },
      { status: 400 }
    )
  }

  try {
    // Fetch the style with brand and seller populated
    const style = await payload.findByID({
      collection: 'styles',
      id: styleId,
      depth: 2, // Populate brand and seller with their nested fields (e.g., seller.photo)
    })

    if (!style) {
      return Response.json(
        { error: 'Style not found' },
        { status: 404 }
      )
    }

    // Extract brand name
    const brand = style.brand as any
    const brandName = typeof brand === 'object' ? brand?.name : null

    // Extract seller info
    const seller = style.seller as any
    let sellerInfo = null
    if (seller && typeof seller === 'object') {
      const sellerPhoto = seller.photo as any
      const firstName = seller.firstName || ''
      const lastName = seller.lastName || ''
      const fullName = `${firstName} ${lastName}`.trim() || null
      
      sellerInfo = {
        id: seller.id,
        // Prioritize shopName over full name
        shopName: seller.shopName || fullName,
        photoUrl: typeof sellerPhoto === 'object' ? sellerPhoto?.url : null,
      }
    }

    // Fetch the first variation to get thumbnail
    let thumbnailUrl: string | null = null
    
    const variationsResult = await payload.find({
      collection: 'variations',
      where: {
        style: { equals: styleId },
      },
      limit: 1,
      depth: 1, // Populate images
    })

    if (variationsResult.docs.length > 0) {
      const firstVariation = variationsResult.docs[0]
      const images = firstVariation.images as any[]
      
      if (images && images.length > 0) {
        const firstImage = images[0]
        // Image could be populated object or just ID
        if (typeof firstImage === 'object' && firstImage?.url) {
          thumbnailUrl = firstImage.url
        }
      }
    }

    return Response.json({
      id: styleId,
      title: style.title || null,
      brandName,
      thumbnailUrl,
      seller: sellerInfo,
    })
  } catch (error) {
    payload.logger.error(`Error fetching style info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return Response.json(
      { error: 'Failed to fetch style info' },
      { status: 500 }
    )
  }
}
