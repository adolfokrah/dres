import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { anyone } from '../../access/anyone'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    group: 'Ecommerce',
    defaultColumns: ['product', 'user', 'rating', 'createdAt'],
    description: 'Product reviews from customers',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
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
    },
    {
      name: 'style',
      type: 'relationship',
      relationTo: 'styles',
      required: true,
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      min: 1,
      max: 5,
      admin: {
        description: 'Rating from 1 to 5 stars',
      },
    },
    {
      name: 'review',
      type: 'textarea',
      admin: {
        description: 'Review text',
      },
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Review images',
      },
    },
  ],
  timestamps: true,
}
