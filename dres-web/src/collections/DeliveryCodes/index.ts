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
    defaultColumns: ['code', 'order', 'seller', 'buyer', 'status', 'createdAt'],
    description: 'Delivery confirmation codes for courier USSD verification',
  },
  access: {
    // Admin can do everything
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      // Users can read their own codes (as buyer or seller)
      return {
        or: [{ buyer: { equals: user.id } }, { seller: { equals: user.id } }],
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
      type: 'row',
      fields: [
        {
          name: 'order',
          type: 'relationship',
          relationTo: 'orders',
          required: true,
          admin: {
            description: 'The order this code belongs to',
            width: '50%',
          },
        },
        {
          name: 'seller',
          type: 'relationship',
          relationTo: 'users',
          required: true,
          admin: {
            description: 'The seller whose items this code covers',
            width: '50%',
          },
        },
      ],
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
      name: 'items',
      type: 'array',
      admin: {
        description: 'Item IDs covered by this delivery code',
      },
      fields: [
        {
          name: 'itemId',
          type: 'text',
          required: true,
        },
      ],
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
