import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { anyone } from '../../access/anyone'

export const DiscountCodes: CollectionConfig = {
  slug: 'discount-codes',
  admin: {
    useAsTitle: 'code',
    group: 'Orders',
    defaultColumns: ['code', 'type', 'value', 'usageCount', 'maxUses', 'active', 'expiresAt'],
    description: 'Discount codes for orders',
  },
  access: {
    // Anyone can read to validate codes
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'The discount code (e.g., SAVE10, FREESHIP)',
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            // Uppercase the code
            return value?.toUpperCase()
          },
        ],
      },
    },
    {
      name: 'description',
      type: 'text',
      admin: {
        description: 'Description of the discount (shown to customers)',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'percentage',
          options: [
            { label: 'Percentage', value: 'percentage' },
            { label: 'Fixed Amount', value: 'fixed' },
            { label: 'Free Shipping', value: 'free_shipping' },
          ],
          admin: {
            description: 'Type of discount',
            width: '50%',
          },
        },
        {
          name: 'value',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Discount value (percentage or fixed amount)',
            width: '50%',
            condition: (data) => data?.type !== 'free_shipping',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'minOrderAmount',
          type: 'number',
          min: 0,
          admin: {
            description: 'Minimum order amount required to use this code',
            width: '50%',
          },
        },
        {
          name: 'maxDiscountAmount',
          type: 'number',
          min: 0,
          admin: {
            description: 'Maximum discount amount (for percentage discounts)',
            width: '50%',
            condition: (data) => data?.type === 'percentage',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'usageCount',
          type: 'number',
          defaultValue: 0,
          admin: {
            description: 'Number of times this code has been used',
            readOnly: true,
            width: '33%',
          },
        },
        {
          name: 'maxUses',
          type: 'number',
          admin: {
            description: 'Maximum number of times this code can be used (leave empty for unlimited)',
            width: '33%',
          },
        },
        {
          name: 'maxUsesPerUser',
          type: 'number',
          defaultValue: 1,
          admin: {
            description: 'Max uses per user',
            width: '33%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startsAt',
          type: 'date',
          admin: {
            description: 'When the code becomes active',
            date: { pickerAppearance: 'dayAndTime' },
            width: '50%',
          },
        },
        {
          name: 'expiresAt',
          type: 'date',
          admin: {
            description: 'When the code expires',
            date: { pickerAppearance: 'dayAndTime' },
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this discount code is active',
      },
    },
    {
      name: 'applicableTo',
      type: 'select',
      defaultValue: 'all',
      options: [
        { label: 'All Products', value: 'all' },
        { label: 'Specific Categories', value: 'categories' },
        { label: 'Specific Products', value: 'products' },
        { label: 'Specific Sellers', value: 'sellers' },
      ],
      admin: {
        description: 'What this discount applies to',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: 'Categories this discount applies to',
        condition: (data) => data?.applicableTo === 'categories',
      },
    },
    {
      name: 'variations',
      type: 'relationship',
      relationTo: 'variations',
      hasMany: true,
      admin: {
        description: 'Variations this discount applies to',
        condition: (data) => data?.applicableTo === 'products',
      },
    },
    {
      name: 'sellers',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        description: 'Sellers whose products this discount applies to',
        condition: (data) => data?.applicableTo === 'sellers',
      },
    },
    {
      name: 'usedBy',
      type: 'array',
      admin: {
        description: 'Users who have used this code',
        readOnly: false,
      },
      fields: [
        {
          name: 'user',
          type: 'relationship',
          relationTo: 'users',
        },
        {
          name: 'usedAt',
          type: 'date',
        },
        {
          name: 'order',
          type: 'relationship',
          relationTo: 'orders',
        },
      ],
    },
  ],
  timestamps: true,
}
