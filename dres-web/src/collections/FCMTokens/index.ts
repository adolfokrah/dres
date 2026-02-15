import type { CollectionConfig } from 'payload'

export const FCMTokens: CollectionConfig = {
  slug: 'fcm-tokens',
  admin: {
    group: 'Users',
    defaultColumns: ['user', 'platform', 'lastUsed', 'createdAt'],
    description: 'Firebase Cloud Messaging tokens for push notifications',
  },
  access: {
    // Allow anyone to read (needed for checking if token exists)
    read: () => true,
    // Allow anyone to create tokens (for anonymous users)
    create: () => true,
    // Allow anyone to update (needed for anonymous token refresh)
    update: () => true,
    // Only admins can delete tokens
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
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
      ({ data, req, originalDoc }) => {
        // Auto-update lastUsed timestamp
        data.lastUsed = new Date().toISOString()

        // Auto-set user from authenticated request
        // On create: set user if not already set
        // On update: set user if authenticated and token doesn't have a user yet
        // This handles the case where an anonymous user logs in
        const existingUser = originalDoc?.user
        if (req.user && !existingUser && !data.user) {
          data.user = req.user.id
        }

        return data
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        // Skip if this is an internal deactivation update
        if (req.context?.skipDeduplication) {
          return
        }

        // Only run on create or when token changes
        if (operation !== 'create' && !req.context?.tokenChanged) {
          return
        }

        // Deactivate old tokens for the same device to prevent duplicates
        if (doc.deviceId) {
          try {
            // Find all other active tokens for this deviceId
            const oldTokens = await req.payload.find({
              collection: 'fcm-tokens',
              where: {
                and: [
                  { deviceId: { equals: doc.deviceId } },
                  { id: { not_equals: doc.id } },
                  { isActive: { equals: true } },
                ],
              },
            })

            // Deactivate each old token
            for (const oldToken of oldTokens.docs) {
              await req.payload.update({
                collection: 'fcm-tokens',
                id: oldToken.id,
                data: { isActive: false },
                context: { skipDeduplication: true }, // Prevent infinite loop
              })
            }

            if (oldTokens.docs.length > 0) {
              req.payload.logger.info(
                `Deactivated ${oldTokens.docs.length} old token(s) for device ${doc.deviceId}`,
              )
            }
          } catch (error) {
            req.payload.logger.error(`Error deactivating old tokens: ${error}`)
          }
        }
      },
    ],
  },
}
