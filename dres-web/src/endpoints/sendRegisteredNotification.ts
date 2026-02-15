import type { PayloadHandler } from 'payload'
import { getMessaging } from '../utilities/firebaseAdmin'

/**
 * Send push notification to all registered users
 * POST /api/notifications/send-registered
 * Body: { title: string, body: string, data: { path: string } }
 */
export const sendRegisteredNotification: PayloadHandler = async (req) => {
  const { payload, user } = req

  // Check if user is admin
  if (!user || (typeof user !== 'string' && user.role !== 'admin')) {
    return Response.json(
      { error: 'Unauthorized. Admin access required.' },
      { status: 403 }
    )
  }

  try {
    const body = await req.json?.()
    const { title, body: messageBody, data } = body || {}

    if (!title || !messageBody) {
      return Response.json(
        { error: 'Title and body are required' },
        { status: 400 }
      )
    }

    // Get all registered device tokens (where user is not null)
    const deviceTokens = await payload.find({
      collection: 'fcm-tokens',
      where: {
        user: { exists: true },
        isActive: { equals: true },
      },
      limit: 1000,
    })

    const tokens = deviceTokens.docs
      .map((doc: any) => doc.token)
      .filter((token): token is string => typeof token === 'string')

    if (tokens.length === 0) {
      return Response.json({
        success: true,
        sent: 0,
        message: 'No registered users with push tokens found',
      })
    }

    // Send multicast message using the centralized Firebase utility
    const messaging = getMessaging()
    const message = {
      notification: {
        title,
        body: messageBody,
      },
      data: data || {},
      tokens,
    }

    const response = await messaging.sendEachForMulticast(message)

    payload.logger.info(
      `[SendRegisteredNotification] Sent to ${response.successCount}/${tokens.length} registered users`
    )

    return Response.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      total: tokens.length,
    })
  } catch (error) {
    payload.logger.error(`[SendRegisteredNotification] Error: ${error}`)
    return Response.json(
      { error: `Failed to send notification: ${error}` },
      { status: 500 }
    )
  }
}
