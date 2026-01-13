import type { PayloadHandler } from 'payload'

/**
 * POST /api/follows/follow
 * Follow a user
 * 
 * Body:
 * - userId: The user ID to follow
 */
export const followUser: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json?.()
    const userIdToFollow = body?.userId

    if (!userIdToFollow) {
      return Response.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Prevent users from following themselves
    if (userIdToFollow === user.id) {
      return Response.json(
        { error: 'You cannot follow yourself' },
        { status: 400 }
      )
    }

    // Check if the user to follow exists
    const userToFollow = await payload.findByID({
      collection: 'users',
      id: userIdToFollow,
    })

    if (!userToFollow) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already following
    const existingFollow = await payload.find({
      collection: 'follows',
      where: {
        and: [
          { follower: { equals: user.id } },
          { following: { equals: userIdToFollow } },
        ],
      },
      limit: 1,
    })

    if (existingFollow.docs.length > 0) {
      return Response.json(
        { 
          success: true, 
          message: 'Already following this user',
          isFollowing: true,
        }
      )
    }

    // Create the follow relationship
    const follow = await payload.create({
      collection: 'follows',
      data: {
        follower: user.id,
        following: userIdToFollow,
      },
    })

    // Create notification for the user being followed
    try {
      const followerName = user.firstName || user.shopName || 'Someone'
      await payload.create({
        collection: 'notifications',
        data: {
          user: userIdToFollow, // The user being followed gets the notification
          type: 'new_follower',
          message: `${followerName} started following you`,
          path: `/users/${user.id}/profile`, // Link to the follower's profile
          metadata: {
            followerId: user.id,
            followerName: followerName,
            followId: follow.id,
          },
        },
      })
    } catch (notificationError) {
      payload.logger.error(`Error creating follow notification: ${notificationError}`)
      // Don't fail the follow operation if notification creation fails
    }

    payload.logger.info(`User ${user.id} followed user ${userIdToFollow}`)

    return Response.json({
      success: true,
      message: 'Successfully followed user',
      isFollowing: true,
      followId: follow.id,
    })
  } catch (error) {
    payload.logger.error(`Error following user: ${error}`)
    return Response.json(
      { error: 'Failed to follow user' },
      { status: 500 }
    )
  }
}
