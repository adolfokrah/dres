import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { anyone } from '../../access/anyone'

export const VariationViews: CollectionConfig = {
  slug: 'variation-views',
  admin: {
    group: 'Analytics',
    defaultColumns: ['variation', 'user', 'viewedAt'],
    description: 'Tracks variation views for trending algorithm',
  },
  access: {
    read: anyone,
    create: anyone, // Allow anonymous views
    update: authenticated,
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  fields: [
    {
      name: 'variation',
      type: 'relationship',
      relationTo: 'variations',
      required: true,
      index: true,
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        description: 'Optional - can be null for anonymous views',
      },
    },
    {
      name: 'ipAddress',
      type: 'text',
      index: true,
      admin: {
        description: 'IP address for anonymous users to prevent duplicate views',
      },
    },
    {
      name: 'viewedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      index: true,
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'Search', value: 'search' },
        { label: 'Category', value: 'category' },
        { label: 'Home', value: 'home' },
        { label: 'Recommendation', value: 'recommendation' },
        { label: 'Direct', value: 'direct' },
        { label: 'Share', value: 'share' },
      ],
      admin: {
        description: 'Where the user came from',
      },
    },
  ],
}
