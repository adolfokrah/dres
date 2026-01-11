import type { CollectionConfig } from 'payload'

import { getActiveBoostTiers } from './endpoints/getActiveBoostTiers'
import { initiateBoostPayment } from './endpoints/initiateBoostPayment'

export const BoostTiers: CollectionConfig = {
  slug: 'boost-tiers',
  admin: {
    useAsTitle: 'name',
    group: 'Settings',
    defaultColumns: ['name', 'duration', 'price', 'sortOrder', 'isActive'],
    description: 'Configure boost tier pricing and benefits',
  },
  access: {
    read: () => true, // Public read access for app
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  endpoints: [
    {
      path: '/active',
      method: 'get',
      handler: getActiveBoostTiers,
    },
    {
      path: '/initiate',
      method: 'post',
      handler: initiateBoostPayment,
    },
  ],
  fields: [
    {
      name: 'name',
      label: 'Tier Name',
      type: 'text',
      required: true,
      admin: {
        description: 'e.g., Basic, Standard, Premium',
      },
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique identifier (e.g., basic, standard, premium)',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'duration',
          label: 'Duration (Days)',
          type: 'number',
          required: true,
          min: 1,
          admin: {
            description: 'How many days the boost lasts',
            width: '50%',
          },
        },
        {
          name: 'price',
          label: 'Price (GHS)',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Price in Ghana Cedis',
            step: 0.01,
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'benefits',
      label: 'Benefits',
      type: 'textarea',
      required: true,
      admin: {
        description: 'List of benefits, one per line',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'isPopular',
          label: 'Mark as Popular',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Show "POPULAR" badge on this tier',
            width: '50%',
          },
        },
        {
          name: 'isActive',
          label: 'Active',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Show this tier in the app',
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'hasAnalytics',
      label: 'Include Analytics',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Allow access to style analytics/stats for this tier',
      },
    },
    {
      name: 'sortOrder',
      label: 'Sort Order',
      type: 'number',
      defaultValue: 0,
      admin: {
        description: 'Lower numbers appear first',
      },
    },
  ],
  timestamps: true,
}
