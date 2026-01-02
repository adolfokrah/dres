import type { PayloadHandler } from 'payload'

/**
 * GET /api/follows/counts/:userId
 * Get follower and following counts for a user
 * 
 * Route params:
 * - userId: The user ID to get counts for
 */
export const getFollowCounts: PayloadHandler = async (req) => {
  const { payload, routeParams } = req

  const userId = routeParams?.userId as string

  if (!userId) {
    return Response.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Count followers (users who follow this user)
    const followersResult = await payload.count({
      collection: 'follows',
      where: {
        following: { equals: userId },
      },
    })

    // Count following (users this user follows)
    const followingResult = await payload.count({
      collection: 'follows',
      where: {
        follower: { equals: userId },
      },
    })

    return Response.json({
      followers: followersResult.totalDocs,
      following: followingResult.totalDocs,
    })
  } catch (error) {
    payload.logger.error(`Error getting follow counts: ${error}`)
    return Response.json(
      { error: 'Failed to get follow counts' },
      { status: 500 }
    )
  }
}
