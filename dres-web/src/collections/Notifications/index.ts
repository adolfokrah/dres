import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Notifications: CollectionConfig = {
  slug: 'notifications',
  admin: {
    group: 'Users',
    defaultColumns: ['user', 'message', 'read', 'createdAt'],
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
      name: 'image',
      type: 'text',
      admin: {
        description: 'URL to the notification image/icon',
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
        description: 'Path to navigate to when notification is clicked',
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
