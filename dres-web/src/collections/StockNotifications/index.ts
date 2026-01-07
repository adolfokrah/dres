import type { CollectionConfig } from 'payload'
import { subscribe } from './endpoints/subscribe'
import { checkSubscription } from './endpoints/check'

export const StockNotifications: CollectionConfig = {
  slug: 'stock-notifications',
  admin: {
    useAsTitle: 'id',
    group: 'Notifications',
    description: 'Users who want to be notified when a SKU is back in stock',
  },
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      // Admins can read all
      if (user.role === 'admin') return true
      // Users can only read their own
      return { user: { equals: user.id } }
    },
    create: ({ req: { user } }) => !!user,
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  endpoints: [
    {
      path: '/subscribe',
      method: 'post',
      handler: subscribe,
    },
    {
      path: '/check',
      method: 'get',
      handler: checkSubscription,
    },
  ],
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      name: 'sku',
      type: 'relationship',
      relationTo: 'skus',
      required: true,
      index: true,
    },
  ],
  timestamps: true,
}
