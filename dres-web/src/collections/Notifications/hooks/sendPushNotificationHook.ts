import type { CollectionAfterChangeHook } from 'payload'
import type { Notification, Media } from '../../../payload-types'
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
    let mediaDoc: Media | null = null
    
    // If image is just an ID string, fetch the media document
    if (typeof doc.image === 'string') {
      try {
        mediaDoc = await req.payload.findByID({
          collection: 'media',
          id: doc.image,
        })
      } catch (error) {
        console.error('Failed to fetch media for notification:', error)
      }
    } else {
      // Image is already populated as an object
      mediaDoc = doc.image as Media
    }
    
    // Get URL from media document - prefer thumbnail for faster loading
    const mediaUrl = mediaDoc?.thumbnailURL || mediaDoc?.url
    if (mediaUrl) {
      imageUrl = mediaUrl.startsWith('http')
        ? mediaUrl
        : `${process.env.NEXT_PUBLIC_SERVER_URL}${mediaUrl}`
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
