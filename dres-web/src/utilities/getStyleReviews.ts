import type { Payload } from 'payload'

export interface ReviewData {
  id: string
  rating: number
  review: string
  images: string[]
  reviewer: {
    id: string
    name: string
    profileImage: string | null
  }
  createdAt: string
  helpful: number
  verified: boolean
}

export interface ReviewsResponse {
  reviews: ReviewData[]
  totalReviews: number
  averageRating: number
  ratingDistribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
}

export async function getStyleReviews(
  payload: Payload,
  styleId: string,
  page: number = 1,
  limit: number = 10
): Promise<ReviewsResponse> {
  // Fetch reviews for the style
  const reviewsResult = await payload.find({
    collection: 'reviews',
    where: {
      style: {
        equals: styleId,
      },
    },
    limit,
    page,
    sort: '-createdAt',
    depth: 2,
  })

  // Transform reviews
  const reviews: ReviewData[] = reviewsResult.docs.map((review: any) => {
    const reviewer = typeof review.user === 'object' ? review.user : null

    return {
      id: review.id,
      rating: review.rating || 0,
      review: review.review || '',
      images: Array.isArray(review.images)
        ? review.images
            .map((img: any) => {
              const image = typeof img === 'object' ? img : null
              return image?.url || null
            })
            .filter(Boolean)
        : [],
      reviewer: {
        id: reviewer?.id || '',
        name: (reviewer as any)?.firstName || 'Anonymous',
        profileImage:
          typeof (reviewer as any)?.photo === 'object'
            ? (reviewer as any)?.photo?.url || null
            : null,
      },
      createdAt: review.createdAt,
      helpful: review.helpful || 0,
      verified: review.verified || false,
    }
  })

  // Calculate statistics
  const totalReviews = reviewsResult.totalDocs
  let totalRating = 0
  const ratingDistribution = {
    5: 0,
    4: 0,
    3: 0,
    2: 0,
    1: 0,
  }

  // Fetch all reviews for statistics (not just current page)
  const allReviews = await payload.find({
    collection: 'reviews',
    where: {
      style: {
        equals: styleId,
      },
    },
    limit: 1000, // Get enough for accurate statistics
    pagination: false,
  })

  allReviews.docs.forEach((review: any) => {
    const rating = review.rating || 0
    totalRating += rating

    if (rating >= 1 && rating <= 5) {
      ratingDistribution[rating as 1 | 2 | 3 | 4 | 5]++
    }
  })

  const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0

  return {
    reviews,
    totalReviews,
    averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
    ratingDistribution,
  }
}
