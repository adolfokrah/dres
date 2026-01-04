import type { PayloadHandler } from 'payload'

/**
 * POST /api/favorites/add
 * Add a variation to user's favorites
 * 
 * Body:
 * - variationId: The variation ID to add to favorites
 * 
 * Constraints:
 * - User cannot add their own variations (where style.seller === user.id)
 * - Cannot add duplicate favorites
 */
export const addToFavorites: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Parse request body
    const body = await req.json?.() ?? {}
    const { variationId } = body

    payload.logger.info(`Adding to favorites - User ID: ${user.id}, Variation ID: ${variationId}`)

    if (!variationId) {
      return Response.json(
        { error: 'variationId is required' },
        { status: 400 }
      )
    }

    // Fetch the variation with its style to check ownership
    const variation = await payload.findByID({
      collection: 'variations',
      id: variationId,
      depth: 1,
    })

    if (!variation) {
      return Response.json(
        { error: 'Variation not found' },
        { status: 404 }
      )
    }

    // Check if user owns this variation's style
    const style = variation.style
    if (style && typeof style === 'object') {
      const sellerId = style.seller && typeof style.seller === 'object' 
        ? style.seller.id 
        : style.seller

      if (sellerId === user.id) {
        return Response.json(
          { error: 'You cannot add your own items to favorites' },
          { status: 400 }
        )
      }
    }

    // Check if already favorited
    const existingFavorite = await payload.find({
      collection: 'favorites',
      where: {
        user: { equals: user.id },
        variation: { equals: variationId },
      },
      limit: 1,
    })

    if (existingFavorite.docs.length > 0) {
      return Response.json(
        { 
          message: 'Already in favorites',
          favoriteId: existingFavorite.docs[0].id,
        },
        { status: 200 }
      )
    }

    // Create the favorite
    payload.logger.info(`Creating favorite with user: ${user.id} (type: ${typeof user.id}), variation: ${variationId} (type: ${typeof variationId})`)
    
    // Ensure IDs are strings (Payload expects string IDs for relationships)
    const userId = typeof user.id === 'string' ? user.id : String(user.id)
    const varId = typeof variationId === 'string' ? variationId : String(variationId)
    
    payload.logger.info(`Using userId: ${userId}, varId: ${varId}`)
    
    const favorite = await payload.create({
      collection: 'favorites',
      data: {
        user: userId,
        variation: varId,
      },
      overrideAccess: true, // Skip access control since we already verified the user
    })

    return Response.json({
      message: 'Added to favorites',
      favoriteId: favorite.id,
    }, { status: 201 })

  } catch (error: any) {
    payload.logger.error(`Error adding to favorites: ${error}`)
    // Log more details for debugging
    if (error.data) {
      payload.logger.error(`Error data: ${JSON.stringify(error.data)}`)
    }
    if (error.errors) {
      payload.logger.error(`Validation errors: ${JSON.stringify(error.errors)}`)
    }
    return Response.json(
      {
        error: 'Failed to add to favorites',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error.data || error.errors || null,
      },
      { status: 500 }
    )
  }
}
