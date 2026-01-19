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

  // Skip if already sent (prevent duplicate sends)
  if (req.context?.pushNotificationSent) {
    console.log(`[PushHook] Skipping duplicate push for notification ${doc.id}`)
    return doc
  }

  // Mark as sent in context
  req.context = { ...req.context, pushNotificationSent: true }

  // Get user ID from the notification
  const userId = typeof doc.user === 'string' ? doc.user : doc.user?.id

  if (!userId) {
    return doc
  }

  console.log(`[PushHook] Sending push for notification ${doc.id} to user ${userId}, image: ${doc.image}`)

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
        console.log(`[PushHook] Fetched media doc: ${mediaDoc?.id}, url: ${mediaDoc?.url}`)
      } catch (error) {
        console.error('Failed to fetch media for notification:', error)
      }
    } else {
      // Image is already populated as an object
      mediaDoc = doc.image as Media
      console.log(`[PushHook] Image already populated: ${mediaDoc?.id}, url: ${mediaDoc?.url}`)
    }

    // Get URL from media document - prefer thumbnail for faster loading
    const mediaUrl = mediaDoc?.thumbnailURL || mediaDoc?.url
    if (mediaUrl) {
      // Use PUBLIC_SERVER_URL for push notifications (must be publicly accessible)
      // Falls back to NEXT_PUBLIC_SERVER_URL if not set
      const serverUrl = process.env.PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL
      imageUrl = mediaUrl.startsWith('http')
        ? mediaUrl
        : `${serverUrl}${mediaUrl}`

      // Skip image if it's localhost (not accessible from devices)
      if (imageUrl.includes('localhost') || imageUrl.includes('127.0.0.1')) {
        console.log(`[PushHook] Skipping localhost image URL: ${imageUrl}`)
        imageUrl = undefined
      }
    }
    console.log(`[PushHook] Final imageUrl: ${imageUrl}`)
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
