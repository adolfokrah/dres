import type { CollectionAfterChangeHook } from 'payload'
import type { Notification } from '../../../payload-types'
import { sendPushNotification, getNotificationTitle } from '../../../utilities/sendPushNotification'

/**
 * Hook to send push notification to user when a notification is created
 */
export const sendPushNotificationHook: CollectionAfterChangeHook<Notification> = async ({
  doc,
  operation,
  req,
}) => {
  // Only send push notifications on create
  if (operation !== 'create') {
    return doc
  }

  // Get user ID from the notification
  const userId = typeof doc.user === 'string' ? doc.user : doc.user?.id

  if (!userId) {
    return doc
  }

  // Get notification image URL if available
  let imageUrl: string | undefined
  if (doc.image) {
    const image = typeof doc.image === 'string' ? null : doc.image
    if (image?.url) {
      imageUrl = image.url.startsWith('http')
        ? image.url
        : `${process.env.NEXT_PUBLIC_SERVER_URL}${image.url}`
    }
  }

  // Send push notification
  await sendPushNotification({
    userId,
    title: getNotificationTitle(doc.type ?? 'system'),
    body: doc.message,
    imageUrl,
    data: {
      notificationId: doc.id,
      type: doc.type ?? 'system',
      ...(doc.path && { path: doc.path }),
      ...(doc.metadata && { metadata: JSON.stringify(doc.metadata) }),
    },
    payload: req.payload,
  })

  return doc
}
