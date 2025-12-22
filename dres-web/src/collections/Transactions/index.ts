import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

// Generate unique transaction ID: TXN-YYYYMMDD-XXXXXX-XXXX
const generateTransactionId = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomUUID().split('-')[0].toUpperCase()
  return `TXN-${dateStr}-${timestamp}-${random}`
}

export const Transactions: CollectionConfig = {
  slug: 'transactions',
  admin: {
    useAsTitle: 'transactionId',
    group: 'Ecommerce',
    defaultColumns: ['transactionId', 'user', 'order', 'amount', 'status', 'createdAt'],
    description: 'Payment transactions',
  },
  access: {
    // Admins can read all, users can read their own transactions
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    // Only admins can create transactions
    create: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
    // Only admins can update transactions
    update: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
    // Only admins can delete transactions
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Generate transaction ID on create
        if (operation === 'create' && !data?.transactionId) {
          data.transactionId = generateTransactionId()
        }
        return data
      },
    ],
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'transactionId',
          type: 'text',
          required: true,
          unique: true,
          admin: {
            description: 'Unique transaction identifier (auto-generated)',
            readOnly: true,
            width: '50%',
          },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          admin: {
            description: 'Transaction status',
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The user for this transaction',
      },
    },
    {
      name: 'order',
      type: 'relationship',
      relationTo: 'orders',
      required: true,
      admin: {
        description: 'The order this transaction belongs to',
      },
    },
    {
        name: 'isMain',
        type: 'checkbox',
        defaultValue: false,
        admin: {
          description: 'Whether this transaction is the main transaction for the order',
        },
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Transaction amount',
      },
    },
    {
      type: 'group',
      name: 'billingDetails',
      label: 'Billing Details',
      admin: {
        description: 'Payment account information',
      },
      fields: [
        {
          name: 'accountName',
          type: 'text',
          admin: {
            description: 'Account holder name',
          },
        },
        {
          type: 'row',
          fields: [
            {
              name: 'accountNumber',
              type: 'text',
              admin: {
                description: 'Account number',
                width: '50%',
              },
            },
            {
              name: 'bank',
              type: 'text',
              admin: {
                description: 'Bank or payment provider (e.g., MTN Mobile Money)',
                width: '50%',
              },
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
