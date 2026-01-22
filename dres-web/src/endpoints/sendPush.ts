import type { PayloadHandler, Where } from 'payload'
import {
  sendPushNotification,
  sendBulkPushNotification,
} from '../utilities/sendPushNotification'

/**
 * Admin endpoint to send push notifications without creating notification records
 * POST /api/send-push
 *
 * Body:
 * {
 *   "target": "all" | "anonymous" | "registered" | "user" | "tokens",
 *   "title": "Notification title",
 *   "body": "Notification message",
 *   "imageUrl": "optional image URL",
 *   "data": { "path": "/sell" },  // optional deep link data
 *
 *   // Required for target: "user"
 *   "userId": "user-id",
 *
 *   // Required for target: "tokens"
 *   "tokens": ["token1", "token2"]
 * }
 *
 * Target types:
 * - "all": Send to all active tokens (anonymous + registered)
 * - "anonymous": Send only to tokens without a user (anonymous users)
 * - "registered": Send only to tokens with a user (registered users)
 * - "user": Send to a specific user by ID
 * - "tokens": Send directly to specific FCM tokens
 */
export const sendPush: PayloadHandler = async (req) => {
  const { payload, user } = req

  // Only admins can send push notifications
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json?.()

    if (!body) {
      return Response.json({ error: 'Request body is required' }, { status: 400 })
    }

    const { target, userId, tokens, title, body: messageBody, imageUrl, data } = body

    if (!title || !messageBody) {
      return Response.json({ error: 'title and body are required' }, { status: 400 })
    }

    if (!target) {
      return Response.json(
        { error: 'target is required. Options: "all", "anonymous", "registered", "user", "tokens"' },
        { status: 400 },
      )
    }

    let result: {
      success: boolean
      successCount: number
      failureCount: number
      failedTokens?: string[]
    }

    switch (target) {
      case 'all': {
        // Send to all active tokens
        payload.logger.info({ msg: 'Sending push to ALL tokens', title })
        const allTokens = await fetchTokens(payload, 'all')
        result = await sendBulkPushNotification({
          tokens: allTokens,
          title,
          body: messageBody,
          imageUrl,
          data,
          payload,
        })
        break
      }

      case 'anonymous': {
        // Send to tokens without a user (anonymous)
        payload.logger.info({ msg: 'Sending push to ANONYMOUS tokens', title })
        const anonymousTokens = await fetchTokens(payload, 'anonymous')
        result = await sendBulkPushNotification({
          tokens: anonymousTokens,
          title,
          body: messageBody,
          imageUrl,
          data,
          payload,
        })
        break
      }

      case 'registered': {
        // Send to tokens with a user (registered users)
        payload.logger.info({ msg: 'Sending push to REGISTERED user tokens', title })
        const registeredTokens = await fetchTokens(payload, 'registered')
        result = await sendBulkPushNotification({
          tokens: registeredTokens,
          title,
          body: messageBody,
          imageUrl,
          data,
          payload,
        })
        break
      }

      case 'user': {
        if (!userId) {
          return Response.json({ error: 'userId is required for target: "user"' }, { status: 400 })
        }
        payload.logger.info({ msg: 'Sending push to user', userId, title })
        result = await sendPushNotification({
          userId,
          title,
          body: messageBody,
          imageUrl,
          data,
          payload,
        })
        break
      }

      case 'tokens': {
        if (!tokens || tokens.length === 0) {
          return Response.json(
            { error: 'tokens array is required for target: "tokens"' },
            { status: 400 },
          )
        }
        payload.logger.info({ msg: 'Sending push to specific tokens', count: tokens.length, title })
        result = await sendBulkPushNotification({
          tokens,
          title,
          body: messageBody,
          imageUrl,
          data,
          payload,
        })
        break
      }

      default:
        return Response.json(
          { error: `Invalid target: "${target}". Options: "all", "anonymous", "registered", "user", "tokens"` },
          { status: 400 },
        )
    }

    payload.logger.info({ msg: 'Push notification result', target, result })

    return Response.json({
      success: result.success,
      target,
      successCount: result.successCount,
      failureCount: result.failureCount,
      ...(result.failedTokens && result.failedTokens.length > 0 && { failedTokens: result.failedTokens }),
    })
  } catch (error) {
    payload.logger.error({ msg: 'Error sending push notification', error })
    return Response.json(
      { error: 'Failed to send push notification', details: String(error) },
      { status: 500 },
    )
  }
}

/**
 * Fetch FCM tokens based on filter type
 */
async function fetchTokens(
  payload: Parameters<PayloadHandler>[0]['payload'],
  filter: 'all' | 'anonymous' | 'registered',
): Promise<string[]> {
  const tokens: string[] = []
  let page = 1
  const batchSize = 500

  while (true) {
    let where: Where = { isActive: { equals: true } }

    if (filter === 'anonymous') {
      // Tokens without a user
      where = {
        and: [{ isActive: { equals: true } }, { user: { exists: false } }],
      }
    } else if (filter === 'registered') {
      // Tokens with a user
      where = {
        and: [{ isActive: { equals: true } }, { user: { exists: true } }],
      }
    }
    // 'all' uses no user filter

    const result = await payload.find({
      collection: 'fcm-tokens',
      where,
      limit: batchSize,
      page,
    })

    tokens.push(...result.docs.map((doc) => doc.token))

    if (!result.hasNextPage) break
    page++
  }

  payload.logger.info({ msg: `Fetched ${tokens.length} tokens for filter: ${filter}` })
  return tokens
}
