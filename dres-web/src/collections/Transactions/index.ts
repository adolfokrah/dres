import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { paystackWebhook } from './endpoints/paystackWebhook'
import { checkTransactionStatus } from './endpoints/checkStatus'
import { getUserTransactions } from './endpoints/getUserTransactions'
import { calculateCommissionForOrder } from '../Orders/hooks/calculateCommissionForOrder'

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
    group: 'Orders',
    defaultColumns: ['transactionId', 'user', 'order', 'amount', 'status', 'createdAt'],
    description: 'Payment transactions',
  },
  endpoints: [
    {
      path: '/webhooks/paystack',
      method: 'post',
      handler: paystackWebhook,
    },
    {
      path: '/check-status',
      method: 'get',
      handler: checkTransactionStatus,
    },
    {
      path: '/user-transactions',
      method: 'get',
      handler: getUserTransactions,
    },
  ],
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
    afterChange: [
      async ({ doc, req }) => {
        // Recalculate order commission when a transaction with fees is created/updated
        if (doc.order && (doc.type === 'transfer' || doc.type === 'order_payment')) {
          const orderId = typeof doc.order === 'object' ? doc.order.id : doc.order
          req.payload.logger.info(`Transaction ${doc.transactionId} changed, scheduling commission recalculation for order ${orderId}`)
          
          // Defer to avoid MongoDB write conflicts
          setImmediate(() => {
            calculateCommissionForOrder(req.payload, orderId).catch((error) => {
              req.payload.logger.error(`[Commission] Deferred calculation from Transaction hook failed: ${error}`)
            })
          })
        }
        return doc
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        // Recalculate order commission when a transaction is deleted
        if (doc.order && (doc.type === 'transfer' || doc.type === 'order_payment')) {
          const orderId = typeof doc.order === 'object' ? doc.order.id : doc.order
          req.payload.logger.info(`Transaction ${doc.transactionId} deleted, scheduling commission recalculation for order ${orderId}`)
          
          // Defer to avoid MongoDB write conflicts
          setImmediate(() => {
            calculateCommissionForOrder(req.payload, orderId).catch((error) => {
              req.payload.logger.error(`[Commission] Deferred calculation from Transaction delete hook failed: ${error}`)
            })
          })
        }
        return doc
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
            width: '33%',
          },
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          defaultValue: 'transfer',
          options: [
            { label: 'Order Payment (Seller Payout)', value: 'order_payment' },
            { label: 'Transfer', value: 'transfer' },
            { label: 'Deposit (Customer Payment)', value: 'deposit' },
            { label: 'Refund', value: 'refund' },
            { label: 'Return Charge (Seller Fee)', value: 'return_charge' },
          ],
          admin: {
            description: 'Type of transaction',
            width: '33%',
          },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'pending',
          options: [
            { label: 'Pending', value: 'pending' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          admin: {
            description: 'Transaction status',
            width: '33%',
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
      name: 'currency',
      type: 'relationship',
      relationTo: 'currencies',
      admin: {
        description: 'The currency for this transaction',
      },
    },
    {
      name: 'itemId',
      type: 'text',
      admin: {
        description: 'The order item ID this transaction is for (used to prevent duplicates)',
      },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'amount',
          type: 'number',
          required: true,
          // No min: 0 - allow negative amounts for return_charge transactions
          admin: {
            description: 'Transaction amount (can be negative for return charges)',
            width: '50%',
          },
        },
        {
          name: 'fees',
          type: 'number',
          min: 0,
          defaultValue: 0,
          label: 'Fees (selling price - original price) × qty',
          admin: {
            width: '50%',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'paystackFees',
          type: 'number',
          min: 0,
          defaultValue: 0,
          label: 'Paystack Fees ',
          admin: {
            width: '50%',
          },
        },
        {
          name: 'commissionFees',
          type: 'number',
          min: 0,
          defaultValue: 0,
          label: 'Commission Fees (fees - paystack fees)',
          admin: {
            description: 'Calculated: fees - paystackFees',
            width: '50%',
          },
        },
      ],
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
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Additional notes about this transaction',
      },
    },
  ],
  timestamps: true,
}
