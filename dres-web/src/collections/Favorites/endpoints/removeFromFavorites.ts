import type { PayloadHandler } from 'payload'

/**
 * DELETE /api/favorites/remove/:variationId
 * Remove a variation from user's favorites
 * 
 * Route params:
 * - variationId: The variation ID to remove from favorites
 */
export const removeFromFavorites: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req
  const variationId = routeParams?.variationId as string

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!variationId) {
    return Response.json(
      { error: 'variationId is required' },
      { status: 400 }
    )
  }

  try {
    // Find the favorite entry
    const existingFavorite = await payload.find({
      collection: 'favorites',
      where: {
        user: { equals: user.id },
        variation: { equals: variationId },
      },
      limit: 1,
    })

    if (existingFavorite.docs.length === 0) {
      return Response.json(
        { error: 'Favorite not found' },
        { status: 404 }
      )
    }

    // Delete the favorite
    await payload.delete({
      collection: 'favorites',
      id: existingFavorite.docs[0].id,
    })

    return Response.json({
      message: 'Removed from favorites',
    }, { status: 200 })

  } catch (error: any) {
    payload.logger.error(`Error removing from favorites: ${error}`)
    return Response.json(
      {
        error: 'Failed to remove from favorites',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
