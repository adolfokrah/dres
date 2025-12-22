import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { createSellerTransactionOnDelivery } from './hooks/createSellerTransactionOnDelivery'

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

          // Auto-update order status based on item statuses
          const itemStatuses = data.items.map((item: { shippingStatus?: string }) => item.shippingStatus)
          
          if (itemStatuses.length > 0) {
            const allPlaced = itemStatuses.every((status) => status === 'placed')
            const allReturned = itemStatuses.every((status) => status === 'returned')
            const allFinished = itemStatuses.every((status) => status === 'delivered' || status === 'returned')
            const hasOutForDelivery = itemStatuses.some((status) => status === 'out_for_delivery')
            const hasReturnInProgress = itemStatuses.some((status) => status === 'return_in_progress')
            
            if (allPlaced) {
              // All items are still placed - order is placed
              data.status = 'placed'
            } else if (allReturned) {
              // All items returned - order is cancelled (full refund)
              data.status = 'cancelled'
            } else if (allFinished) {
              // All items are either delivered or returned - order is completed
              data.status = 'completed'
            } else if (hasOutForDelivery || hasReturnInProgress) {
              // Some items are in transit - order is in progress
              data.status = 'in_progress'
            } else {
              // Mixed statuses - order is in progress
              data.status = 'in_progress'
            }
          }
        }

        return data
      },
    ],
    // Create seller transaction when item is marked as delivered
    afterChange: [createSellerTransactionOnDelivery],
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
            description: 'Auto-calculated: Placed (all placed), In Progress (items in transit), Completed (all delivered/returned), Cancelled (all returned)',
            width: '50%',
            components: {
              Cell: '@/collections/Orders/OrderStatusCell#OrderStatusCell',
            },
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
              //     price: number, // Selling price (what customer paid)
              //     originalPrice: number, // Original price (seller's price before commission)
              //     quantity: number,
              //     shippingFee: number, // Shipping fee for this item
              //     buyerProtection: boolean, // Whether buyer protection is enabled
              //     buyerProtectionFee: number, // 80% of shipping fee if enabled
              //     shippingStatus: 'placed' | 'out_for_delivery' | 'delivered' | 'return_in_progress' | 'returned' | 'not_available',
              //     statusLogs: Array<{ status: string, timestamp: string }> // Journey log of status changes
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
                    width: '25%',
                  },
                },
                {
                  name: 'totalAmount',
                  type: 'number',
                  required: true,
                  defaultValue: 0,
                  admin: {
                    description: 'Total order amount (products only)',
                    readOnly: true,
                    width: '25%',
                  },
                },
                {
                  name: 'grandTotal',
                  type: 'number',
                  required: true,
                  defaultValue: 0,
                  admin: {
                    description: 'Grand total (products + shipping + buyer protection)',
                    readOnly: true,
                    width: '25%',
                  },
                },
                {
                  name: 'currency',
                  type: 'relationship',
                  relationTo: 'currencies',
                  admin: {
                    description: 'Currency (from customer country)',
                    readOnly: true,
                    width: '25%',
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
              name: 'placedAt',
              type: 'date',
              admin: {
                description: 'When the order was placed',
                date: {
                  pickerAppearance: 'dayAndTime',
                },
              },
              defaultValue: () => new Date().toISOString(),
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
                defaultColumns: ['transactionId', 'user', 'amount', 'fees', 'paystackFees', 'commissionFees', 'type', 'status'],
              },
            },
          ],
        },
      ],
    },
  ],
  timestamps: true,
}
