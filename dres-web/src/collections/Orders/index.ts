import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

// Generate unique order ID: ORD-YYYYMMDD-XXXXXX-XXXX
const generateOrderId = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomUUID().split('-')[0].toUpperCase()
  return `ORD-${dateStr}-${timestamp}-${random}`
}

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderId',
    group: 'Ecommerce',
    defaultColumns: ['orderId', 'user', 'status', 'totalItems', 'totalAmount', 'createdAt'],
    description: 'Customer orders',
  },
  access: {
    // Users can only read their own orders
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        customer: {
          equals: user.id,
        },
      }
    },
    // Only authenticated users can create orders
    create: authenticated,
    // Users can only update their own orders (limited), admins can update all
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        customer: {
          equals: user.id,
        },
      }
    },
    // Only admins can delete orders
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  hooks: {
    beforeChange: [
      ({ data, operation }) => {
        // Generate order ID on create
        if (operation === 'create' && !data?.orderId) {
          data.orderId = generateOrderId()
        }

        // Calculate totals from items
        if (data?.items && Array.isArray(data.items)) {
          data.totalItems = data.items.reduce((total: number, item: { quantity?: number }) => {
            return total + (item.quantity || 0)
          }, 0)

          data.totalAmount = data.items.reduce((total: number, item: { quantity?: number; price?: number }) => {
            const quantity = item.quantity || 0
            const price = item.price || 0
            return total + (quantity * price)
          }, 0)
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
          name: 'orderId',
          type: 'text',
          required: true,
          unique: true,
          admin: {
            description: 'Unique order identifier (auto-generated)',
            readOnly: true,
            width: '50%',
          },
        },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'placed',
          options: [
            { label: 'Placed', value: 'placed' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          admin: {
            description: 'Overall order status',
            width: '50%',
          },
        },
      ],
    },
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The customer who placed this order',
      },
    },
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Order Items',
          fields: [
            {
              name: 'items',
              type: 'json',
              required: true,
              admin: {
                description: 'Order items with individual shipping status',
                components: {
                  Field: '@/collections/Orders/OrderItemsField#OrderItemsField',
                },
              },
              // JSON schema for items:
              // [
              //   {
              //     productTitle: string,
              //     productImage: string, // URL to product image
              //     variationOptions: Record<string, string> | null, // e.g. { "Size": "W32 L34", "Color": "Blue" }
              //     sellerId: string, // Keep ID for seller reference
              //     sellerName: string,
              //     price: number,
              //     quantity: number,
              //     shippingStatus: 'placed' | 'out_for_delivery' | 'delivered' | 'return_in_progress' | 'returned' | 'not_available'
              //   }
              // ]
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'totalItems',
                  type: 'number',
                  required: true,
                  defaultValue: 0,
                  admin: {
                    description: 'Total number of items (auto-calculated)',
                    readOnly: true,
                    width: '33%',
                  },
                },
                {
                  name: 'totalAmount',
                  type: 'number',
                  required: true,
                  defaultValue: 0,
                  admin: {
                    description: 'Total order amount (auto-calculated)',
                    readOnly: true,
                    width: '33%',
                  },
                },
                {
                  name: 'currency',
                  type: 'relationship',
                  relationTo: 'currencies',
                  admin: {
                    description: 'Currency (from customer country)',
                    readOnly: true,
                    width: '33%',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Shipping Details',
          fields: [
            {
              type: 'group',
              name: 'shippingDetails',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'fullName',
                      type: 'text',
                      admin: {
                        description: 'Recipient full name',
                        width: '50%',
                      },
                    },
                    {
                      name: 'phone',
                      type: 'text',
                      admin: {
                        description: 'Contact phone number',
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  name: 'address',
                  type: 'textarea',
                  admin: {
                    description: 'Street address',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'city',
                      type: 'text',
                      admin: {
                        width: '33%',
                      },
                    },
                    {
                      name: 'region',
                      type: 'text',
                      admin: {
                        description: 'State/Region/Province',
                        width: '33%',
                      },
                    },
                    {
                      name: 'postalCode',
                      type: 'text',
                      admin: {
                        description: 'ZIP/Postal code',
                        width: '33%',
                      },
                    },
                  ],
                },
                {
                  name: 'country',
                  type: 'relationship',
                  relationTo: 'countries',
                },
                {
                  name: 'deliveryNotes',
                  type: 'textarea',
                  admin: {
                    description: 'Special delivery instructions',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Billing Details',
          fields: [
            {
              type: 'group',
              name: 'billingDetails',
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
                        description: 'Account number (e.g., 0243530213)',
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
        },
        {
          label: 'Dates & Notes',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'placedAt',
                  type: 'date',
                  admin: {
                    description: 'When the order was placed',
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                    width: '50%',
                  },
                  defaultValue: () => new Date().toISOString(),
                },
                {
                  name: 'completedAt',
                  type: 'date',
                  admin: {
                    description: 'When the order was completed',
                    date: {
                      pickerAppearance: 'dayAndTime',
                    },
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'notes',
              type: 'textarea',
              admin: {
                description: 'Internal notes about the order',
              },
            },
          ],
        },
        {
          label: 'Transactions',
          fields: [
            {
              name: 'transactions',
              type: 'join',
              collection: 'transactions',
              on: 'order',
              admin: {
                description: 'Transactions associated with this order',
                defaultColumns: ['transactionId', 'user', 'amount', 'status'],
              },
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
