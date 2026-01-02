import type { PayloadHandler } from 'payload'

interface FollowUser {
  id: string
  name: string
  username: string | null
  avatar: string | null
  followedAt: string
}

interface UserFollowsResponse {
  users: FollowUser[]
  totalDocs: number
  totalPages: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * GET /api/follows/user-follows/:userId
 * Fetch user's followers or following
 * 
 * Route params:
 * - userId: User ID to get followers/following for
 * 
 * Query params:
 * - filter: 'followers' | 'following' (required)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 */
export const getUserFollows: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req
  const url = new URL(req.url || '', 'http://localhost')
  const filter = url.searchParams.get('filter') // 'followers' | 'following'
  const userId = routeParams?.userId as string
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '10', 10)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!filter || !['followers', 'following'].includes(filter)) {
    return Response.json(
      { error: 'Invalid filter. Must be "followers" or "following"' },
      { status: 400 }
    )
  }

  if (!userId) {
    return Response.json({ error: 'User ID is required' }, { status: 400 })
  }

  try {
    // Build query based on filter type
    const where = filter === 'followers'
      ? { following: { equals: userId } } // Get users who follow this user
      : { follower: { equals: userId } }  // Get users this user follows

    const followsResult = await payload.find({
      collection: 'follows',
      where: where as any,
      sort: '-createdAt',
      page,
      limit,
      depth: 2, // Populate user relationships and their photo
    })

    // Transform the results to get the relevant user info
    const users: FollowUser[] = followsResult.docs.map((follow: any) => {
      // For followers, we want the follower user info
      // For following, we want the following user info
      const targetUser = filter === 'followers' ? follow.follower : follow.following

      // Handle if user is just an ID (not populated)
      if (typeof targetUser === 'string') {
        return {
          id: targetUser,
          name: 'Unknown',
          username: null,
          avatar: null,
          followedAt: follow.createdAt,
        }
      }

      // Get avatar URL from photo field
      let avatarUrl: string | null = null
      if (targetUser.photo) {
        if (typeof targetUser.photo === 'object' && targetUser.photo.url) {
          avatarUrl = targetUser.photo.url
        }
      }

      // Build full name from firstName and lastName
      const fullName = [targetUser.firstName, targetUser.lastName]
        .filter(Boolean)
        .join(' ') || targetUser.shopName || 'Unknown'

      return {
        id: targetUser.id,
        name: fullName,
        username: targetUser.username || null,
        avatar: avatarUrl,
        followedAt: follow.createdAt,
      }
    })

    const response: UserFollowsResponse = {
      users,
      totalDocs: followsResult.totalDocs ?? users.length,
      totalPages: followsResult.totalPages ?? 1,
      page: followsResult.page ?? page,
      limit,
      hasNextPage: followsResult.hasNextPage ?? false,
      hasPrevPage: followsResult.hasPrevPage ?? page > 1,
    }

    return Response.json(response)
  } catch (error: any) {
    payload.logger.error(`Error fetching user follows: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch follows',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
