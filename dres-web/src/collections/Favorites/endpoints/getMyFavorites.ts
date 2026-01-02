import type { PayloadHandler } from 'payload'
import { transformVariation } from '../../Variations/utils/transformVariation'

/**
 * GET /api/favorites/my-favorites
 * Fetch the logged-in user's favorite items
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
    const favoritesWithDetails = await Promise.all(
      favoritesResult.docs.map(async (favorite: any) => {
        const variation = favorite.variation

        if (!variation || typeof variation === 'string') {
          return null
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

    // Filter out nulls
    const validFavorites = favoritesWithDetails.filter(Boolean)

    return Response.json({
      docs: validFavorites,
      totalDocs: favoritesResult.totalDocs ?? validFavorites.length,
      totalPages: favoritesResult.totalPages ?? 1,
      page: favoritesResult.page ?? page,
      limit,
      hasNextPage: favoritesResult.hasNextPage ?? false,
      hasPrevPage: favoritesResult.hasPrevPage ?? page > 1,
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
