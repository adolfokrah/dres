import type { PayloadHandler } from 'payload'

/**
 * GET /api/follows/check/:userId
 * Check if the current user is following a specific user
 * 
 * Route params:
 * - userId: The user ID to check
 * 
 * Returns:
 * - isFollowing: boolean
 */
export const checkFollowing: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req

  if (!user) {
    return Response.json({ 
      isFollowing: false,
      error: 'Unauthorized' 
    }, { status: 401 })
  }

  const userIdToCheck = routeParams?.userId as string

  if (!userIdToCheck) {
    return Response.json({ error: 'User ID is required' }, { status: 400 })
  }

  // Can't follow yourself
  if (userIdToCheck === user.id) {
    return Response.json({
      isFollowing: false,
      isSelf: true,
    })
  }

  try {
    const existingFollow = await payload.find({
      collection: 'follows',
      where: {
        and: [
          { follower: { equals: user.id } },
          { following: { equals: userIdToCheck } },
        ],
      },
      limit: 1,
    })

    return Response.json({
      isFollowing: existingFollow.docs.length > 0,
      isSelf: false,
    })
  } catch (error) {
    payload.logger.error(`Error checking follow status: ${error}`)
    return Response.json(
      { error: 'Failed to check follow status', isFollowing: false },
      { status: 500 }
    )
  }
}
