import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Follows: CollectionConfig = {
  slug: 'follows',
  admin: {
    group: 'Users',
    defaultColumns: ['follower', 'following', 'createdAt'],
    description: 'User follow relationships',
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        follower: {
          equals: user.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        follower: {
          equals: user.id,
        },
      }
    },
  },
  indexes: [
    {
      fields: ['follower', 'following'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'follower',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The user who is following',
      },
    },
    {
      name: 'following',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The user being followed',
      },
    },
  ],
  timestamps: true,
}
