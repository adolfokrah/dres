import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

export const SKUs: CollectionConfig = {
  slug: 'skus',
  admin: {
    group: 'Ecommerce',
    defaultColumns: ['sku', 'variation', 'price', 'stock', 'updatedAt'],
    description: 'SKUs - inventory tracking with pricing for each variation',
    useAsTitle: 'sku',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeChange: [
      // Calculate selling price (price + 10% platform fee)
      async ({ data }) => {
        if (data?.price !== undefined) {
          data.sellingPrice = Math.round(data.price * 1.1 * 100) / 100
        }
        return data
      },
      // Generate SKU code if not provided
      async ({ data, operation }) => {
        if (operation === 'create' && !data?.sku) {
          data.sku = `SKU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique SKU code (auto-generated if empty)',
      },
    },
    {
      name: 'variation',
      type: 'relationship',
      relationTo: 'variations',
      required: true,
      admin: {
        description: 'The variation this SKU belongs to',
      },
      index: true,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Base price for this SKU',
      },
    },
    {
      name: 'sellingPrice',
      type: 'number',
      admin: {
        description: 'Final selling price (auto-calculated: price + platform fee)',
        readOnly: true,
      },
    },
    {
      name: 'compareAtPrice',
      type: 'number',
      min: 0,
      admin: {
        description: 'Original price before discount (shows as crossed out)',
      },
    },
    {
      name: 'stock',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Available quantity (0 = sold out)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this SKU is available for purchase',
      },
    },
    {
      name: 'barcode',
      type: 'text',
      admin: {
        description: 'Barcode/UPC for this SKU',
      },
    },
    {
      name: 'weight',
      type: 'number',
      min: 0,
      admin: {
        description: 'Weight in grams (for shipping calculations)',
      },
    },
  ],
  timestamps: true,
}
