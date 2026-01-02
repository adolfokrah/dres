import type { CollectionConfig } from 'payload'
import { authenticated } from '../../access/authenticated'

export const UserPoints: CollectionConfig = {
  slug: 'user-points',
  admin: {
    useAsTitle: 'id',
    group: 'Users',
    defaultColumns: ['user', 'balance', 'totalEarned', 'totalRedeemed', 'updatedAt'],
    description: 'User reward points for purchases',
  },
  access: {
    // Users can only read their own points
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    // Only system can create/update (via hooks)
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      unique: true,
      admin: {
        description: 'The user who owns these points',
      },
    },
    {
      name: 'balance',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Current available points balance',
      },
    },
    {
      name: 'totalEarned',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Total points earned all-time',
        readOnly: true,
      },
    },
    {
      name: 'totalRedeemed',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Total points redeemed all-time',
        readOnly: true,
      },
    },
    {
      name: 'history',
      type: 'array',
      admin: {
        description: 'Points transaction history',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          options: [
            { label: 'Earned', value: 'earned' },
            { label: 'Redeemed', value: 'redeemed' },
            { label: 'Expired', value: 'expired' },
            { label: 'Adjusted', value: 'adjusted' },
          ],
        },
        {
          name: 'points',
          type: 'number',
          required: true,
          admin: {
            description: 'Points amount (positive for earned, negative for redeemed)',
          },
        },
        {
          name: 'description',
          type: 'text',
          admin: {
            description: 'Description of the transaction',
          },
        },
        {
          name: 'order',
          type: 'relationship',
          relationTo: 'orders',
          admin: {
            description: 'Related order (if applicable)',
          },
        },
        {
          name: 'createdAt',
          type: 'date',
          admin: {
            description: 'When this transaction occurred',
            readOnly: true,
          },
        },
      ],
    },
  ],
}
