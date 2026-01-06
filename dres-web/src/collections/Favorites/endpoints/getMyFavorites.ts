import type { PayloadHandler } from 'payload'
import { transformVariation } from '../../Variations/utils/transformVariation'

/**
 * GET /api/favorites/my-favorites
 * Fetch the logged-in user's favorite items
 * Only shows favorites from sellers in the user's country
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
export const getMyFavorites: PayloadHandler = async (req) => {
  const { payload, user } = req
  const url = new URL(req.url || '', 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '10', 10)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's country
  const userCountryId = typeof user.country === 'object' ? user.country?.id : user.country

  try {
    // Fetch user's favorites with populated variation data
    const favoritesResult = await payload.find({
      collection: 'favorites',
      where: {
        user: { equals: user.id },
      },
      sort: '-createdAt',
      page,
      limit,
      depth: 5, // Deep populate to get all variation/style/sku data
    })

    // Transform favorites to include full variation data
    // Filter by seller's country matching user's country
    const favoritesWithDetails = await Promise.all(
      favoritesResult.docs.map(async (favorite: any) => {
        const variation = favorite.variation

        if (!variation || typeof variation === 'string') {
          return null
        }

        // Get seller from variation's style
        const style = variation.style
        if (!style || typeof style === 'string') {
          return null
        }

        const seller = style.seller
        if (!seller || typeof seller === 'string') {
          return null
        }

        // Filter by seller's country matching user's country
        const sellerCountryId = typeof seller.country === 'object' ? seller.country?.id : seller.country
        if (userCountryId && sellerCountryId && sellerCountryId !== userCountryId) {
          return null // Skip favorites from sellers in different countries
        }

        // Fetch SKUs for this variation
        const skusResult = await payload.find({
          collection: 'skus',
          where: {
            variation: { equals: variation.id },
          },
          depth: 3,
          limit: 100,
        })

        // Add SKUs to variation
        const variationWithSKUs = {
          ...variation,
          skus: { docs: skusResult.docs },
        }

        // Transform variation to standard format
        const transformed = transformVariation(variationWithSKUs, false)

        if (!transformed) return null

        return {
          favoriteId: favorite.id,
          favoritedAt: favorite.createdAt,
          ...transformed,
        }
      })
    )

    // Filter out nulls (including filtered out due to country mismatch)
    const validFavorites = favoritesWithDetails.filter(Boolean)

    // Recalculate pagination since we filtered after fetching
    const filteredTotalDocs = validFavorites.length
    const totalPages = Math.ceil(filteredTotalDocs / limit) || 1

    return Response.json({
      docs: validFavorites,
      totalDocs: filteredTotalDocs,
      totalPages,
      page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    })
  } catch (error: any) {
    payload.logger.error(`Error fetching favorites: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch favorites',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
