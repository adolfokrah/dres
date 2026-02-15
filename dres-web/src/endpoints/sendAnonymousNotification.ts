import type { PayloadHandler } from 'payload'
import admin from 'firebase-admin'

/**
 * Send push notification to all anonymous (non-registered) users
 * POST /api/notifications/send-anonymous
 * Body: { title: string, body: string, data: { path: string } }
 */
export const sendAnonymousNotification: PayloadHandler = async (req) => {
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

    // Get all anonymous device tokens (where user is null)
    const deviceTokens = await payload.find({
      collection: 'fcm-tokens',
      where: {
        user: { equals: null },
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
        message: 'No anonymous users with push tokens found',
      })
    }

    // Initialize Firebase Admin if not already initialized
    if (!admin.apps.length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}')
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      })
    }

    // Send multicast message
    const message = {
      notification: {
        title,
        body: messageBody,
      },
      data: data || {},
      tokens,
    }

    const response = await admin.messaging().sendEachForMulticast(message)

    payload.logger.info(
      `[SendAnonymousNotification] Sent to ${response.successCount}/${tokens.length} anonymous users`
    )

    return Response.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
      total: tokens.length,
    })
  } catch (error) {
    payload.logger.error(`[SendAnonymousNotification] Error: ${error}`)
    return Response.json(
      { error: `Failed to send notification: ${error}` },
      { status: 500 }
    )
  }
}
