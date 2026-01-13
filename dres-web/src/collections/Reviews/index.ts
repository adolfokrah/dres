import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { anyone } from '../../access/anyone'
import { getSellerReviews } from './endpoints/getSellerReviews'
import { createReview } from './endpoints/createReview'
import { notifySellerOnReview } from './hooks/notifySellerOnReview'

export const Reviews: CollectionConfig = {
  slug: 'reviews',
  admin: {
    group: 'Users',
    defaultColumns: ['user', 'style', 'status', 'rating', 'createdAt'],
    description: 'Product reviews from customers',
  },
  hooks: {
    afterChange: [notifySellerOnReview],
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
      admin: {
        description: 'The buyer who will write/has written the review',
      },
    },
    {
      name: 'style',
      type: 'relationship',
      relationTo: 'styles',
      required: true,
      admin: {
        description: 'The product style being reviewed',
      },
    },
    {
      name: 'variation',
      type: 'relationship',
      relationTo: 'variations',
      admin: {
        description: 'The specific variation purchased (for context)',
      },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      admin: {
        description: 'The order this review is associated with',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },         // Created on delivery, no notification sent
        { label: 'Pending', value: 'pending' },     // Notification sent, waiting for user
        { label: 'Active', value: 'active' },       // User submitted review
      ],
      admin: {
        description: 'Review status: draft (awaiting notification), pending (notification sent), active (review submitted)',
      },
    },
    {
      name: 'rating',
      type: 'number',
      min: 1,
      max: 5,
      admin: {
        description: 'Rating from 1 to 5 stars (required when active)',
      },
    },
    {
      name: 'review',
      type: 'textarea',
      admin: {
        description: 'Review text (required when active)',
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
    {
      name: 'notificationSentAt',
      type: 'date',
      admin: {
        description: 'When the review request notification was sent',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
  timestamps: true,
}
