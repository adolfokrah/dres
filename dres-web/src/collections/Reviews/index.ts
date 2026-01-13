import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { anyone } from '../../access/anyone'
import { getSellerReviews } from './endpoints/getSellerReviews'
import { createReview } from './endpoints/createReview'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    group: 'Users',
    defaultColumns: ['product', 'user', 'rating', 'createdAt'],
    description: 'Product reviews from customers',
  },
  endpoints: [
    {
      path: '/seller/:sellerId',
      method: 'get',
      handler: getSellerReviews,
    },
    {
      path: '/create',
      method: 'post',
      handler: createReview,
    },
  ],
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
      required: true,
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
