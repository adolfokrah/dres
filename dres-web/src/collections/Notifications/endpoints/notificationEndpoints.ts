import type { PayloadHandler } from 'payload'

/**
 * GET /api/notifications/my-notifications
 * Get notifications for the current user with pagination
 */
export const getMyNotifications: PayloadHandler = async (req) => {
  const { payload, user, query } = req

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20

  try {
    // Fetch notifications for the user
    const notifications = await payload.find({
      collection: 'notifications',
      where: {
        user: { equals: user.id },
      },
      sort: '-createdAt',
      page,
      limit,
      depth: 1,
    })

    // Get unread count
    const unreadResult = await payload.find({
      collection: 'notifications',
      where: {
        and: [
          { user: { equals: user.id } },
          { read: { equals: false } },
        ],
      },
      limit: 0, // We only need the count
    })

    // Transform notifications
    const docs = notifications.docs.map((notification: any) => ({
      id: notification.id,
      type: notification.type || 'system',
      message: notification.message,
      imageUrl: notification.image?.url || notification.image?.sizes?.thumbnail?.url || null,
      isRead: notification.read || false,
      createdAt: notification.createdAt,
      actionUrl: notification.path || null,
      metadata: notification.metadata || null,
    }))

    return Response.json({
      docs,
      unreadCount: unreadResult.totalDocs,
      totalDocs: notifications.totalDocs,
      totalPages: notifications.totalPages,
      page: notifications.page,
      limit: notifications.limit,
      hasNextPage: notifications.hasNextPage,
      hasPrevPage: notifications.hasPrevPage,
    })
  } catch (error) {
    payload.logger.error(`Error fetching notifications: ${error}`)
    return Response.json({ error: 'Failed to fetch notifications' }, { status: 500 })
  }
}

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for the current user
 */
export const getUnreadCount: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await payload.find({
      collection: 'notifications',
      where: {
        and: [
          { user: { equals: user.id } },
          { read: { equals: false } },
        ],
      },
      limit: 0, // We only need the count
    })

    return Response.json({ count: result.totalDocs })
  } catch (error) {
    payload.logger.error(`Error fetching unread count: ${error}`)
    return Response.json({ error: 'Failed to fetch unread count' }, { status: 500 })
  }
}

/**
 * PATCH /api/notifications/:id/read
 * Mark a notification as read
 */
export const markAsRead: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req
  const notificationId = routeParams?.id as string

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!notificationId) {
    return Response.json({ error: 'Notification ID is required' }, { status: 400 })
  }

  try {
    // Verify the notification belongs to the user
    const notification = await payload.findByID({
      collection: 'notifications',
      id: notificationId,
      depth: 0,
    })

    if (!notification) {
      return Response.json({ error: 'Notification not found' }, { status: 404 })
    }

    const notificationUserId = typeof notification.user === 'object' 
      ? (notification.user as any).id 
      : notification.user

    if (notificationUserId !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update notification
    await payload.update({
      collection: 'notifications',
      id: notificationId,
      data: {
        read: true,
      },
    })

    return Response.json({ success: true })
  } catch (error) {
    payload.logger.error(`Error marking notification as read: ${error}`)
    return Response.json({ error: 'Failed to mark notification as read' }, { status: 500 })
  }
}

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the current user
 */
export const markAllAsRead: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Find all unread notifications for the user
    const unreadNotifications = await payload.find({
      collection: 'notifications',
      where: {
        and: [
          { user: { equals: user.id } },
          { read: { equals: false } },
        ],
      },
      limit: 1000, // Reasonable limit
      depth: 0,
    })

    // Update each notification
    const updatePromises = unreadNotifications.docs.map((notification: any) =>
      payload.update({
        collection: 'notifications',
        id: notification.id,
        data: {
          read: true,
        },
      })
    )

    await Promise.all(updatePromises)

    return Response.json({ 
      success: true, 
      updatedCount: unreadNotifications.docs.length,
    })
  } catch (error) {
    payload.logger.error(`Error marking all notifications as read: ${error}`)
    return Response.json({ error: 'Failed to mark all notifications as read' }, { status: 500 })
  }
}
