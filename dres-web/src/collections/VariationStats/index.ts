import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { anyone } from '../../access/anyone'

export const VariationStats: CollectionConfig = {
  slug: 'variation-stats',
  admin: {
    group: 'Ecommerce',
    defaultColumns: [
      'variation',
      'seller',
      'department',
      'collection',
      'category',
      'brand',
      'totalSales',
      'totalOrders',
      'updatedAt',
    ],
    description: 'Tracks variation performance - use for top variations, sellers, brands per category',
  },
  access: {
    read: anyone,
    create: authenticated,
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
      unique: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'seller',
          type: 'relationship',
          relationTo: 'users',
          admin: {
            description: 'Auto-populated from variation',
            readOnly: true,
            width: '20%',
          },
        },
        {
          name: 'department',
          type: 'relationship',
          relationTo: 'departments',
          admin: {
            description: 'Auto-populated from variation category',
            readOnly: true,
            width: '20%',
          },
        },
        {
          name: 'collection',
          type: 'relationship',
          relationTo: 'collections',
          admin: {
            description: 'Auto-populated from product category',
            readOnly: true,
            width: '20%',
          },
        },
        {
          name: 'category',
          type: 'relationship',
          relationTo: 'categories',
          admin: {
            description: 'Auto-populated from product',
            readOnly: true,
            width: '20%',
          },
        },
        {
          name: 'brand',
          type: 'relationship',
          relationTo: 'brands',
          admin: {
            description: 'Auto-populated from product',
            readOnly: true,
            width: '20%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'totalSales',
          type: 'number',
          required: true,
          defaultValue: 0,
          admin: {
            description: 'Total revenue from sales of this product',
            width: '33%',
          },
        },
        {
          name: 'totalOrders',
          type: 'number',
          required: true,
          defaultValue: 0,
          admin: {
            description: 'Number of completed orders for this product',
            width: '33%',
          },
        },
        {
          name: 'totalItemsSold',
          type: 'number',
          required: true,
          defaultValue: 0,
          admin: {
            description: 'Total quantity of this product sold',
            width: '33%',
          },
        },
      ],
    },
    {
      name: 'lastSaleAt',
      type: 'date',
      admin: {
        description: 'When the last sale was made',
        date: { pickerAppearance: 'dayAndTime' },
      },
    },
  ],
  timestamps: true,
}
