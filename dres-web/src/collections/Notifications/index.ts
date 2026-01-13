import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { 
  getMyNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead 
} from './endpoints/notificationEndpoints'
import { sendReviewRequestsHandler } from './endpoints/sendReviewRequests'
import { sendPushNotificationHook } from './hooks/sendPushNotificationHook'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    group: 'Users',
    defaultColumns: ['user', 'type', 'message', 'read', 'createdAt'],
    description: 'User notifications',
  },
  access: {
    // Users can only read their own notifications
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    create: authenticated,
    // Users can only update their own notifications (to mark as read)
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    // Users can only delete their own notifications
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
  },
  hooks: {
    beforeChange: [
      // Ensure path always starts with /
      ({ data }) => {
        if (data.path && typeof data.path === 'string' && !data.path.startsWith('/')) {
          data.path = `/${data.path}`
        }
        return data
      },
    ],
    afterChange: [sendPushNotificationHook],
  },
  endpoints: [
    {
      path: '/my-notifications',
      method: 'get',
      handler: getMyNotifications,
    },
    {
      path: '/unread-count',
      method: 'get',
      handler: getUnreadCount,
    },
    {
      path: '/:id/read',
      method: 'patch',
      handler: markAsRead,
    },
    {
      path: '/mark-all-read',
      method: 'post',
      handler: markAllAsRead,
    },
    {
      path: '/send-review-requests',
      method: 'post',
      handler: sendReviewRequestsHandler,
    },
  ],
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The user who receives this notification',
      },
    },
    {
      name: 'type',
      type: 'select',
      defaultValue: 'system',
      options: [
        { label: 'Price Drop', value: 'price_drop' },
        { label: 'Back In Stock', value: 'back_in_stock' },
        { label: 'Order Update', value: 'order_update' },
        { label: 'Review Request', value: 'review_request' },
        { label: 'Promotion', value: 'promotion' },
        { label: 'New Follower', value: 'new_follower' },
        { label: 'System', value: 'system' },
      ],
      admin: {
        description: 'Type of notification',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Notification image (e.g., product/variation image)',
      },
    },
    {
      name: 'message',
      type: 'text',
      required: true,
      admin: {
        description: 'Notification message',
      },
    },
    {
      name: 'path',
      type: 'text',
      admin: {
        description: 'Path to navigate to when notification is clicked (e.g., /orders/123, /products/abc)',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional data for the notification (orderId, productId, etc.)',
      },
    },
    {
      name: 'read',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether the notification has been read',
      },
    },
  ],
  timestamps: true,
}
