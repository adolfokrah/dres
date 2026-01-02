import type { PayloadHandler } from 'payload'

/**
 * GET /api/favorites/check/:variationId
 * Check if a variation is in the user's favorites
 */
export const checkFavorite: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req
  const variationId = routeParams?.variationId as string

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!variationId) {
    return Response.json({ error: 'Variation ID is required' }, { status: 400 })
  }

  try {
    // Check if favorite exists
    const existing = await payload.find({
      collection: 'favorites',
      where: {
        user: { equals: user.id },
        variation: { equals: variationId },
      },
      limit: 1,
    })

    const isFavorited = existing.docs.length > 0
    const favoriteId = isFavorited ? existing.docs[0].id : null

    return Response.json({
      isFavorited,
      favoriteId,
      variationId,
    })
  } catch (error: any) {
    payload.logger.error(`Error checking favorite: ${error}`)
    return Response.json(
      {
        error: 'Failed to check favorite',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
