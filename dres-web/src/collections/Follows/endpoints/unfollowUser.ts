import type { PayloadHandler } from 'payload'

/**
 * POST /api/follows/unfollow
 * Unfollow a user
 * 
 * Body:
 * - userId: The user ID to unfollow
 */
export const unfollowUser: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json?.()
    const userIdToUnfollow = body?.userId

    if (!userIdToUnfollow) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Find and delete the follow relationship
    const existingFollow = await payload.find({
      collection: 'follows',
      where: {
        and: [
          { follower: { equals: user.id } },
          { following: { equals: userIdToUnfollow } },
        ],
      },
      limit: 1,
    })

    if (existingFollow.docs.length === 0) {
      return Response.json({
        success: true,
        message: 'Not following this user',
        isFollowing: false,
      })
    }

    // Delete the follow relationship
    await payload.delete({
      collection: 'follows',
      id: existingFollow.docs[0].id,
    })

    payload.logger.info(`User ${user.id} unfollowed user ${userIdToUnfollow}`)

    return Response.json({
      success: true,
      message: 'Successfully unfollowed user',
      isFollowing: false,
    })
  } catch (error) {
    payload.logger.error(`Error unfollowing user: ${error}`)
    return Response.json(
      { error: 'Failed to unfollow user' },
      { status: 500 }
    )
  }
}
