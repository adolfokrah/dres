import type { CollectionConfig } from 'payload'

export const FCMTokens: CollectionConfig = {
  slug: 'fcm-tokens',
  admin: {
    group: 'Users',
    defaultColumns: ['user', 'platform', 'lastUsed', 'createdAt'],
    description: 'Firebase Cloud Messaging tokens for push notifications',
  },
  access: {
    // Anyone can read tokens without a user, authenticated users can read their own
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user) {
        return {
          or: [
            { user: { equals: user.id } },
            { user: { exists: false } },
          ],
        }
      }
      // Anonymous users can only read tokens without a user
      return { user: { exists: false } }
    },
    // Allow anyone to create tokens (for anonymous users)
    create: () => true,
    // Anyone can update tokens without a user, authenticated users can update their own
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user) {
        return {
          or: [
            { user: { equals: user.id } },
            { user: { exists: false } },
          ],
        }
      }
      // Anonymous users can only update tokens without a user
      return { user: { exists: false } }
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
      required: false, // Optional - allows anonymous users to register tokens
      hasMany: false,
      admin: {
        description: 'The user this token belongs to (optional for anonymous users)',
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
