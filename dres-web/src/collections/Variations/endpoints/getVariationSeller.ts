import type { PayloadHandler } from 'payload'
import { getSellerData } from '../utils/getSellerData'

/**
 * GET /api/variations/:id/seller
 * Fetch the seller information for a variation's style
 */
export const getVariationSeller: PayloadHandler = async (req) => {
  const { payload } = req
  const { id } = req.routeParams || {}

  if (!id) {
    return Response.json(
      { error: 'Variation ID is required' },
      { status: 400 }
    )
  }

  try {
    // Fetch the variation
    const variation = await payload.findByID({
      collection: 'variations',
      id: id as string,
      depth: 1,
    })

    if (!variation) {
      return Response.json(
        { error: 'Variation not found' },
        { status: 404 }
      )
    }

    // Get the style ID
    const styleId = typeof variation.style === 'object' ? variation.style.id : variation.style

    if (!styleId) {
      return Response.json(
        { error: 'Style not found for this variation' },
        { status: 404 }
      )
    }

    // Fetch the style with seller information
    const style = await payload.findByID({
      collection: 'styles',
      id: styleId,
      depth: 1, // Only need shallow depth for seller ID
    })

    if (!style) {
      return Response.json(
        { error: 'Style not found' },
        { status: 404 }
      )
    }

    // Extract seller ID
    const sellerId = typeof style.seller === 'object' ? style.seller.id : style.seller

    if (!sellerId) {
      return Response.json(
        { error: 'Seller not found for this style' },
        { status: 404 }
      )
    }

    // Get seller data using utility function
    const sellerData = await getSellerData(payload, sellerId)

    // Return seller data
    return Response.json({
      seller: sellerData
    })

  } catch (error: any) {
    console.error('Error fetching variation seller:', error)
    return Response.json(
      { error: 'Failed to fetch seller information', details: error.message },
      { status: 500 }
    )
  }
}
