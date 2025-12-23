import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { createSellerTransactionOnDelivery } from './hooks/createSellerTransactionOnDelivery'
import { createRefundTransaction } from './hooks/createRefundTransaction'
import { calculateOrderTotalsAndStatus } from './hooks/calculateOrderTotalsAndStatus'
import { updateSalesStats } from './hooks/updateSalesStats'

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
    beforeChange: [calculateOrderTotalsAndStatus],
    // Create seller transaction when item is delivered, create refund when item is returned or not available, update sales stats
    afterChange: [createSellerTransactionOnDelivery, createRefundTransaction, updateSalesStats],
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
