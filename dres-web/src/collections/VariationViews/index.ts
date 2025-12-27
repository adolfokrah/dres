import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { anyone } from '../../access/anyone'

export const VariationViews: CollectionConfig = {
  slug: 'variation-views',
  admin: {
    group: 'Analytics',
    defaultColumns: ['variation', 'users', 'updatedAt'],
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
      name: 'users',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      hasMany: true,
      admin: {
        description: 'Optional - can be null for anonymous views',
      },
    }
  ],
}
