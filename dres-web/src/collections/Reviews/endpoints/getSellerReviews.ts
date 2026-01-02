import type { PayloadHandler } from 'payload'

interface ReviewImage {
  id: string
  url: string
  thumbnailURL?: string
}

interface ReviewUser {
  id: string
  name: string
  username: string | null
  avatar: string | null
}

interface ReviewItem {
  id: string
  user: ReviewUser
  rating: number
  review: string | null
  images: ReviewImage[]
  createdAt: string
}

interface SellerReviewsResponse {
  reviews: ReviewItem[]
  totalDocs: number
  totalPages: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
  averageRating: number
  totalReviews: number
}

/**
 * GET /api/reviews/seller/:sellerId
 * Fetch reviews for a seller's styles
 * 
 * Route params:
 * - sellerId: The seller's user ID
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
export const getSellerReviews: PayloadHandler = async (req) => {
  const { payload, routeParams } = req
  const url = new URL(req.url || '', 'http://localhost')
  const sellerId = routeParams?.sellerId as string
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '10', 10)

  if (!sellerId) {
    return Response.json({ error: 'Seller ID is required' }, { status: 400 })
  }

  try {
    // Fetch reviews for all seller's styles using nested relationship query
    const reviewsResult = await payload.find({
      collection: 'reviews',
      where: {
        'style.seller': { equals: sellerId },
      },
      sort: '-createdAt',
      page,
      limit,
      depth: 2, // Populate user and images
    })

    // Transform reviews
    const reviews: ReviewItem[] = reviewsResult.docs.map((review: any) => {
      const reviewUser = review.user

      // Build user info
      let userInfo: ReviewUser = {
        id: typeof reviewUser === 'string' ? reviewUser : reviewUser?.id || '',
        name: 'Unknown',
        username: null,
        avatar: null,
      }

      if (typeof reviewUser === 'object' && reviewUser) {
        const fullName = [reviewUser.firstName, reviewUser.lastName]
          .filter(Boolean)
          .join(' ') || reviewUser.shopName || 'Unknown'

        let avatarUrl: string | null = null
        if (reviewUser.photo && typeof reviewUser.photo === 'object') {
          avatarUrl = reviewUser.photo.url || null
        }

        userInfo = {
          id: reviewUser.id,
          name: fullName,
          username: reviewUser.username || null,
          avatar: avatarUrl,
        }
      }

      // Transform images
      const images: ReviewImage[] = (review.images || [])
        .filter((img: any) => img && typeof img === 'object')
        .map((img: any) => ({
          id: img.id,
          url: img.url,
          thumbnailURL: img.sizes?.thumbnail?.url || img.url,
        }))

      return {
        id: review.id,
        user: userInfo,
        rating: review.rating || 0,
        review: review.review || null,
        images,
        createdAt: review.createdAt,
      }
    })

    // Calculate average rating from all reviews (not just current page)
    const allReviewsResult = await payload.find({
      collection: 'reviews',
      where: {
        'style.seller': { equals: sellerId },
      },
      limit: 0, // Get all for aggregation
    })

    const totalReviews = allReviewsResult.totalDocs ?? 0
    const averageRating = totalReviews > 0
      ? allReviewsResult.docs.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / totalReviews
      : 0

    const response: SellerReviewsResponse = {
      reviews,
      totalDocs: reviewsResult.totalDocs ?? reviews.length,
      totalPages: reviewsResult.totalPages ?? 1,
      page: reviewsResult.page ?? page,
      limit,
      hasNextPage: reviewsResult.hasNextPage ?? false,
      hasPrevPage: reviewsResult.hasPrevPage ?? page > 1,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
    }

    return Response.json(response)
  } catch (error: any) {
    payload.logger.error(`Error fetching seller reviews: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch reviews',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
