import type { CollectionConfig } from 'payload'
import { confirmDelivery } from './endpoints/confirmDelivery'

export const DeliveryCodes: CollectionConfig = {
  slug: 'delivery-codes',
  labels: {
    singular: 'Delivery Code',
    plural: 'Delivery Codes',
  },
  admin: {
    useAsTitle: 'code',
    group: 'Orders',
    defaultColumns: ['code', 'order', 'buyer', 'createdAt'],
    description: 'Delivery confirmation codes for courier USSD verification',
  },
  access: {
    // Admin can do everything
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      // Users can read their own codes (as buyer)
      return {
        buyer: { equals: user.id },
      } as any
    },
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  endpoints: [
    {
      path: '/confirm',
      method: 'post',
      handler: confirmDelivery,
    },
  ],
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: false, // Not globally unique, just unique among active codes
      index: true,
      admin: {
        description: '4-digit delivery confirmation code',
        readOnly: true,
      },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      unique: true, // One code per order
      admin: {
        description: 'The order this code belongs to',
      },
    },
    {
      name: 'buyer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The customer who will provide this code to courier',
      },
    },
    {
      name: 'expiresAt',
      type: 'date',
      admin: {
        description: 'When this code expires (optional)',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
  ],
}
