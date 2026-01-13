import type { PayloadHandler } from 'payload'

/**
 * POST /api/reviews/create
 * Create or update a product review
 *
 * Body:
 * - style: Style ID (required)
 * - rating: Number 1-5 (required)
 * - review: Review text (required)
 * - images: Array of media IDs (optional)
 * 
 * Workflow:
 * 1. If user has a draft/pending review for this style, update it to active
 * 2. If user already has an active review, return error
 * 3. If no review exists, create a new active review
 */
export const createReview: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Please log in to leave a review' }, { status: 401 })
  }

  try {
    const body = (await req.json?.()) ?? {}
    const { style, rating, review, images } = body

    // Validate required fields
    if (!style) {
      return Response.json({ error: 'Product is required' }, { status: 400 })
    }

    if (!rating || rating < 1 || rating > 5) {
      return Response.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Validate review text is required
    if (!review || review.trim().length === 0) {
      return Response.json({ error: 'Review text is required' }, { status: 400 })
    }

    // Check if user has an existing review for this style
    const existingReview = await payload.find({
      collection: 'reviews',
      where: {
        and: [
          { user: { equals: user.id } }, 
          { style: { equals: style } },
        ],
      },
      limit: 1,
    })

    if (existingReview.docs.length > 0) {
      const existingDoc = existingReview.docs[0]

      // If already active, user can't submit another review
      if (existingDoc.status === 'active') {
        return Response.json(
          { error: 'You have already reviewed this product' },
          { status: 400 },
        )
      }

      // Update the draft/pending review to active
      const updatedReview = await payload.update({
        collection: 'reviews',
        id: existingDoc.id,
        data: {
          status: 'active',
          rating: Math.round(rating),
          review: review.trim(),
          images: images || undefined,
        },
      })

      return Response.json(
        {
          success: true,
          message: 'Review submitted successfully',
          review: {
            id: updatedReview.id,
            rating: updatedReview.rating,
            review: updatedReview.review,
            status: updatedReview.status,
            createdAt: updatedReview.createdAt,
          },
        },
        { status: 200 },
      )
    }

    // No existing review - verify the style exists
    try {
      await payload.findByID({
        collection: 'styles',
        id: style,
      })
    } catch {
      return Response.json({ error: 'Product not found' }, { status: 404 })
    }

    // Create a new active review
    const newReview = await payload.create({
      collection: 'reviews',
      data: {
        user: user.id,
        style,
        status: 'active',
        rating: Math.round(rating),
        review: review.trim(),
        images: images || undefined,
      },
    })

    return Response.json(
      {
        success: true,
        message: 'Review submitted successfully',
        review: {
          id: newReview.id,
          rating: newReview.rating,
          review: newReview.review,
          status: newReview.status,
          createdAt: newReview.createdAt,
        },
      },
      { status: 201 },
    )
  } catch (error: any) {
    payload.logger.error(`Error creating review: ${error}`)
    return Response.json(
      {
        error: 'Failed to submit review',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
