import type { PayloadHandler } from 'payload'
import { getStyleReviews } from '../../../utilities/getStyleReviews'

/**
 * GET /api/styles/:id/reviews?page=1&limit=10
 * Fetch paginated reviews for a style
 */
export const getStyleReviewsEndpoint: PayloadHandler = async (req) => {
  const { payload } = req
  const { id } = req.routeParams || {}
  const page = parseInt(req.query?.page as string) || 1
  const limit = parseInt(req.query?.limit as string) || 10

  if (!id) {
    return Response.json(
      { error: 'Style ID is required' },
      { status: 400 }
    )
  }

  try {
    const reviewsData = await getStyleReviews(payload, id as string, page, limit)

    return Response.json(reviewsData)
  } catch (error: any) {
    payload.logger.error(`Error fetching style reviews: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch reviews',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
