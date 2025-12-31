import type { PayloadHandler } from 'payload'

/**
 * GET /api/users/:id/stats
 * Get user stats: followers count, following count, reviews count
 */
export const getUserStats: PayloadHandler = async (req) => {
  const { payload, routeParams } = req
  const userId = routeParams?.id as string

  if (!userId) {
    return Response.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Get followers count (people following this user)
    const followersResult = await payload.count({
      collection: 'follows',
      where: {
        following: { equals: userId },
      },
    })

    // Get following count (people this user follows)
    const followingResult = await payload.count({
      collection: 'follows',
      where: {
        follower: { equals: userId },
      },
    })

    // Get reviews count (reviews written by this user)
    const reviewsResult = await payload.count({
      collection: 'reviews',
      where: {
        user: { equals: userId },
      },
    })

    return Response.json({
      followersCount: followersResult.totalDocs,
      followingCount: followingResult.totalDocs,
      reviewsCount: reviewsResult.totalDocs,
    })
  } catch (error) {
    console.error('Error getting user stats:', error)
    return Response.json({ error: 'Failed to get user stats' }, { status: 500 })
  }
}
