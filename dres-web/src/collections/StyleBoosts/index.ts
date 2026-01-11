import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const StyleBoosts: CollectionConfig = {
  slug: 'style-boosts',
  admin: {
    useAsTitle: 'style',
    group: 'Users',
    defaultColumns: ['style', 'tier', 'status', 'startDate', 'endDate', 'createdAt'],
    description: 'Style boost/featuring for increased visibility',
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Auto-calculate status based on dates
        if (data?.startDate && data?.endDate) {
          const now = new Date()
          const start = new Date(data.startDate)
          const end = new Date(data.endDate)

          if (now < start) {
            data.status = 'scheduled'
          } else if (now >= start && now <= end) {
            data.status = 'active'
          } else if (now > end) {
            data.status = 'expired'
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'style',
      type: 'relationship',
      relationTo: 'styles',
      required: true,
      admin: {
        description: 'The style to boost',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'tier',
          type: 'relationship',
          relationTo: 'boost-tiers',
          required: true,
          admin: {
            description: 'Boost tier determines visibility priority and duration',
            width: '50%',
          },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'scheduled',
          options: [
            { label: 'Scheduled', value: 'scheduled' },
            { label: 'Active', value: 'active' },
            { label: 'Expired', value: 'expired' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          admin: {
            description: 'Auto-calculated based on dates',
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'startDate',
          type: 'date',
          required: true,
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            description: 'When the boost starts',
            width: '50%',
          },
        },
        {
          name: 'endDate',
          type: 'date',
          required: true,
          admin: {
            date: { pickerAppearance: 'dayAndTime' },
            description: 'When the boost ends',
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'transaction',
      type: 'relationship',
      relationTo: 'transactions',
      admin: {
        description: 'The payment transaction for this boost (optional)',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Additional notes about this boost',
      },
    },
  ],
  timestamps: true,
}
