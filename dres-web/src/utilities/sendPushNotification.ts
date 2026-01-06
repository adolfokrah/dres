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

    // Build FCM message
    const message = {
      notification: {
        title,
        body,
        ...(imageUrl && { imageUrl }),
      },
      data,
      tokens,
    }

    // Get messaging instance and send to all user's devices using multicast
    const messagingInstance = getMessaging()
    const response = await messagingInstance.sendEachForMulticast(message)

    // Collect invalid tokens (only mark inactive for token-specific errors, not server/auth errors)
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

          // Only mark token as inactive if it's a token-specific error
          if (invalidTokenErrors.some((code) => errorCode.includes(code))) {
            invalidTokens.push(tokens[idx])
          }
        }
      },
    )

    // Mark only invalid tokens as inactive (not auth/server errors)
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
