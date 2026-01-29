import type { CollectionConfig } from 'payload'
import { ussdConfirmDelivery } from './endpoints/ussdConfirmDelivery'

export const DeliveryCodes: CollectionConfig = {
  slug: 'delivery-codes',
  labels: {
    singular: 'Delivery Code',
    plural: 'Delivery Codes',
  },
  admin: {
    useAsTitle: 'code',
    group: 'Orders',
    defaultColumns: ['code', 'order', 'seller', 'buyer', 'createdAt'],
    description: 'Delivery confirmation codes for courier verification - per seller per order',
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
      path: '/ussd',
      method: 'post',
      handler: ussdConfirmDelivery,
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
      admin: {
        description: 'The order this code belongs to',
      },
    },
    {
      name: 'seller',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The seller whose items this code covers',
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
      name: 'phone',
      type: 'text',
      required: true,
      index: true,
      admin: {
        description: 'Customer phone number from shipping details',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      admin: {
        description: 'The specific order items covered by this code',
      },
      fields: [
        {
          name: 'itemId',
          type: 'text',
          required: true,
          admin: {
            description: 'The ID of the order item',
          },
        },
        {
          name: 'skuTitle',
          type: 'text',
          admin: {
            description: 'SKU title for reference',
          },
        },
      ],
    },
  ],
}
