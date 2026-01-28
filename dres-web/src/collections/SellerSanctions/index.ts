import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const SellerSanctions: CollectionConfig = {
  slug: 'seller-sanctions',
  admin: {
    useAsTitle: 'reason',
    group: 'Orders',
    defaultColumns: ['seller', 'reason', 'createdAt'],
    description: 'Sanctions applied to sellers for policy violations',
  },
  access: {
    // Only admins can read sanctions
    read: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
    // Only system/admins can create
    create: authenticated,
    update: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  fields: [
    {
      name: 'seller',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The seller who received this sanction',
      },
    },
    {
      name: 'reason',
      type: 'select',
      required: true,
      options: [
        { label: 'Late shipment', value: 'late_shipment' },
        { label: 'Failed delivery', value: 'failed_delivery' },
        { label: 'Item returned', value: 'item_returned' },
        { label: 'Fraudulent activity', value: 'fraud' },
        { label: 'Policy violation', value: 'policy_violation' },
        { label: 'Other', value: 'other' },
      ],
      admin: {
        description: 'Reason for the sanction',
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Additional details about the sanction',
      },
    },
  ],
  timestamps: true,
}
