import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const FCMTokens: CollectionConfig = {
  slug: 'fcm-tokens',
  admin: {
    group: 'Users',
    defaultColumns: ['user', 'platform', 'lastUsed', 'createdAt'],
    description: 'Firebase Cloud Messaging tokens for push notifications',
  },
  access: {
    // Only admins can read all tokens
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    // Authenticated users can create tokens (via endpoint)
    create: authenticated,
    // Users can only update their own tokens
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    // Users can only delete their own tokens
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
  indexes: [
    // Note: token field has unique: true which auto-creates an index
    {
      fields: ['user', 'platform'],
    },
  ],
  fields: [
    {
      name: 'token',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'The FCM token from the device',
      },
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      hasMany: false,
      admin: {
        description: 'The user this token belongs to',
      },
    },
    {
      name: 'platform',
      type: 'select',
      required: true,
      options: [
        { label: 'iOS', value: 'ios' },
        { label: 'Android', value: 'android' },
      ],
      admin: {
        description: 'The platform/device type',
      },
    },
    {
      name: 'deviceId',
      type: 'text',
      admin: {
        description: 'Optional device identifier for deduplication',
      },
    },
    {
      name: 'deviceName',
      type: 'text',
      admin: {
        description: 'Optional device name (e.g., "iPhone 15 Pro")',
      },
    },
    {
      name: 'lastUsed',
      type: 'date',
      admin: {
        description: 'Last time this token was used/updated',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this token is still active',
      },
    },
  ],
  hooks: {
    beforeChange: [
      ({ data, req, operation }) => {
        // Auto-update lastUsed timestamp
        data.lastUsed = new Date().toISOString()

        // Auto-set user from authenticated request on create
        if (operation === 'create' && req.user && !data.user) {
          data.user = req.user.id
        }

        return data
      },
    ],
  },
}
