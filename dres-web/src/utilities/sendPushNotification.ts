import type { Payload } from 'payload'
import { getMessaging } from './firebaseAdmin'

export interface SendPushNotificationOptions {
  userId: string
  title: string
  body: string
  imageUrl?: string
  data?: Record<string, string>
  payload: Payload
}

export interface SendBulkPushNotificationOptions {
  userIds?: string[]
  tokens?: string[]
  title: string
  body: string
  imageUrl?: string
  data?: Record<string, string>
  payload: Payload
}

export interface SendTopicPushNotificationOptions {
  topic: string
  title: string
  body: string
  imageUrl?: string
  data?: Record<string, string>
}

/**
 * Send push notification to a user's devices
 * @returns Object with success/failure counts and any failed tokens
 */
export async function sendPushNotification({
  userId,
  title,
  body,
  imageUrl,
  data = {},
  payload,
}: SendPushNotificationOptions): Promise<{
  success: boolean
  successCount: number
  failureCount: number
  failedTokens: string[]
}> {
  try {
    // Fetch active FCM tokens for this user
    const fcmTokensResult = await payload.find({
      collection: 'fcm-tokens',
      where: {
        user: { equals: userId },
        isActive: { equals: true },
      },
      limit: 10, // Max 10 devices per user
    })

    if (fcmTokensResult.docs.length === 0) {
      return {
        success: true,
        successCount: 0,
        failureCount: 0,
        failedTokens: [],
      }
    }

    const tokens = fcmTokensResult.docs.map((fcmDoc) => fcmDoc.token)

    return sendToTokens({ tokens, title, body, imageUrl, data, payload })
  } catch (error) {
    console.error('Error sending push notification:', error)
    return {
      success: false,
      successCount: 0,
      failureCount: 0,
      failedTokens: [],
    }
  }
}

/**
 * Send push notification to multiple users or directly to tokens
 * Useful for bulk notifications like promotions, announcements
 * 
 * @example
 * // Send to multiple users
 * await sendBulkPushNotification({
 *   userIds: ['user1', 'user2', 'user3'],
 *   title: '🎉 Flash Sale!',
 *   body: '50% off all items for the next 2 hours',
 *   data: { path: '/shop?sale=true' },
 *   payload: req.payload,
 * })
 * 
 * // Send directly to tokens
 * await sendBulkPushNotification({
 *   tokens: ['token1', 'token2', 'token3'],
 *   title: 'Hello',
 *   body: 'Direct message',
 *   payload: req.payload,
 * })
 */
export async function sendBulkPushNotification({
  userIds,
  tokens: directTokens,
  title,
  body,
  imageUrl,
  data = {},
  payload,
}: SendBulkPushNotificationOptions): Promise<{
  success: boolean
  successCount: number
  failureCount: number
  failedTokens: string[]
}> {
  try {
    let tokens: string[] = []

    // If userIds provided, fetch their tokens
    if (userIds && userIds.length > 0) {
      const fcmTokensResult = await payload.find({
        collection: 'fcm-tokens',
        where: {
          user: { in: userIds },
          isActive: { equals: true },
        },
        limit: 500, // FCM multicast limit is 500 tokens per call
      })
      tokens = fcmTokensResult.docs.map((fcmDoc) => fcmDoc.token)
    }

    // If direct tokens provided, add them
    if (directTokens && directTokens.length > 0) {
      tokens = [...tokens, ...directTokens]
    }

    if (tokens.length === 0) {
      return {
        success: true,
        successCount: 0,
        failureCount: 0,
        failedTokens: [],
      }
    }

    // FCM multicast limit is 500 tokens per call, batch if needed
    const batchSize = 500
    let totalSuccess = 0
    let totalFailure = 0
    const allFailedTokens: string[] = []

    for (let i = 0; i < tokens.length; i += batchSize) {
      const batchTokens = tokens.slice(i, i + batchSize)
      const result = await sendToTokens({ tokens: batchTokens, title, body, imageUrl, data, payload })
      totalSuccess += result.successCount
      totalFailure += result.failureCount
      allFailedTokens.push(...result.failedTokens)
    }

    return {
      success: totalSuccess > 0,
      successCount: totalSuccess,
      failureCount: totalFailure,
      failedTokens: allFailedTokens,
    }
  } catch (error) {
    console.error('Error sending bulk push notification:', error)
    return {
      success: false,
      successCount: 0,
      failureCount: 0,
      failedTokens: [],
    }
  }
}

/**
 * Send push notification to a topic (all subscribed users)
 * Users must subscribe to topics using the Flutter app
 * 
 * @example
 * await sendTopicPushNotification({
 *   topic: 'promotions',
 *   title: '🎉 New Arrivals!',
 *   body: 'Check out our latest products',
 *   data: { path: '/shop?sort=newest' },
 * })
 */
export async function sendTopicPushNotification({
  topic,
  title,
  body,
  imageUrl,
  data = {},
}: SendTopicPushNotificationOptions): Promise<{
  success: boolean
  messageId?: string
}> {
  try {
    const messagingInstance = getMessaging()
    
    const message = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data,
      topic,
    }

    const messageId = await messagingInstance.send(message)
    console.log(`Successfully sent topic notification: ${messageId}`)
    
    return { success: true, messageId }
  } catch (error) {
    console.error('Error sending topic push notification:', error)
    return { success: false }
  }
}

/**
 * Send to all users (broadcast)
 * Fetches all active tokens and sends in batches
 */
export async function sendBroadcastPushNotification({
  title,
  body,
  imageUrl,
  data = {},
  payload,
}: Omit<SendBulkPushNotificationOptions, 'userIds' | 'tokens'>): Promise<{
  success: boolean
  successCount: number
  failureCount: number
}> {
  try {
    let page = 1
    let totalSuccess = 0
    let totalFailure = 0
    const batchSize = 500

    // Paginate through all tokens
    while (true) {
      const fcmTokensResult = await payload.find({
        collection: 'fcm-tokens',
        where: { isActive: { equals: true } },
        limit: batchSize,
        page,
      })

      if (fcmTokensResult.docs.length === 0) break

      const tokens = fcmTokensResult.docs.map((fcmDoc) => fcmDoc.token)
      const result = await sendToTokens({ tokens, title, body, imageUrl, data, payload })
      
      totalSuccess += result.successCount
      totalFailure += result.failureCount

      if (!fcmTokensResult.hasNextPage) break
      page++
    }

    return {
      success: totalSuccess > 0,
      successCount: totalSuccess,
      failureCount: totalFailure,
    }
  } catch (error) {
    console.error('Error sending broadcast push notification:', error)
    return { success: false, successCount: 0, failureCount: 0 }
  }
}

/**
 * Internal helper to send to a list of tokens
 */
async function sendToTokens({
  tokens,
  title,
  body,
  imageUrl,
  data = {},
  payload,
}: {
  tokens: string[]
  title: string
  body: string
  imageUrl?: string
  data?: Record<string, string>
  payload: Payload
}): Promise<{
  success: boolean
  successCount: number
  failureCount: number
  failedTokens: string[]
}> {
  const message = {
    notification: {
      title,
      body,
      ...(imageUrl && { imageUrl }),
    },
    data,
    tokens,
  }

  const messagingInstance = getMessaging()
  const response = await messagingInstance.sendEachForMulticast(message)

  // Collect invalid tokens
  const invalidTokens: string[] = []
  const invalidTokenErrors = [
    'messaging/invalid-registration-token',
    'messaging/registration-token-not-registered',
    'messaging/invalid-argument',
  ]

  response.responses.forEach(
    (resp: { success: boolean; error?: { message: string; code?: string } }, idx: number) => {
      if (!resp.success) {
        const errorCode = (resp.error as { code?: string })?.code || ''
        if (invalidTokenErrors.some((code) => errorCode.includes(code))) {
          invalidTokens.push(tokens[idx])
        }
      }
    },
  )

  // Mark invalid tokens as inactive
  if (invalidTokens.length > 0) {
    await Promise.all(
      invalidTokens.map((token) =>
        payload.update({
          collection: 'fcm-tokens',
          where: { token: { equals: token } },
          data: { isActive: false },
        }),
      ),
    )
  }

  return {
    success: response.successCount > 0,
    successCount: response.successCount,
    failureCount: response.failureCount,
    failedTokens: invalidTokens,
  }
}

/**
 * Get notification title based on type
 */
export function getNotificationTitle(type: string): string {
  switch (type) {
    case 'price_drop':
      return '💰 Price Drop Alert!'
    case 'order_update':
      return '📦 Order Update'
    case 'promotion':
      return '🎉 Special Offer'
    case 'system':
    default:
      return '🔔 DRES Notification'
  }
}
