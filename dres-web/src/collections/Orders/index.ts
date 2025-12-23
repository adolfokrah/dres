import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { createSellerTransactionOnDelivery } from './hooks/createSellerTransactionOnDelivery'
import { createRefundTransaction } from './hooks/createRefundTransaction'
import { calculateOrderTotalsAndStatus } from './hooks/calculateOrderTotalsAndStatus'
import { updateSalesStats } from './hooks/updateSalesStats'
import { reduceStockOnOrder } from './hooks/reduceStockOnOrder'
import { restoreStockOnReturn } from './hooks/restoreStockOnReturn'

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
    // Reduce stock on order creation, restore stock on return, create seller transaction when item is delivered, create refund when item is returned or not available, update sales stats
    afterChange: [reduceStockOnOrder, restoreStockOnReturn, createSellerTransactionOnDelivery, createRefundTransaction, updateSalesStats],
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
      name: 'sellers',
      type: 'relationship',
      relationTo: 'users',
      hasMany: true,
      admin: {
        description: 'All sellers involved in this order (auto-populated)',
        readOnly: true,
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
              type: 'array',
              required: true,
              admin: {
                description: 'Order items with individual shipping status',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'product',
                      type: 'relationship',
                      relationTo: 'products',
                      admin: {
                        description: 'Reference to the product',
                        width: '50%',
                      },
                    },
                    {
                      name: 'seller',
                      type: 'relationship',
                      relationTo: 'users',
                      admin: {
                        description: 'The seller of this item',
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'productTitle',
                      type: 'text',
                      required: true,
                      admin: {
                        description: 'Product title at time of purchase',
                        width: '50%',
                      },
                    },
                    {
                      name: 'sellerName',
                      type: 'text',
                      admin: {
                        description: 'Seller name at time of purchase',
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  name: 'productImage',
                  type: 'text',
                  admin: {
                    description: 'URL to product image at time of purchase',
                  },
                },
                {
                  name: 'variationOptions',
                  type: 'json',
                  admin: {
                    description: 'Selected variation options (e.g., {"Size": "M", "Color": "Blue"})',
                  },
                },
                {
                  name: 'variationId',
                  type: 'text',
                  admin: {
                    description: 'ID of the selected variation (for stock management)',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'price',
                      type: 'number',
                      required: true,
                      admin: {
                        description: 'Selling price (what customer paid)',
                        width: '25%',
                      },
                    },
                    {
                      name: 'originalPrice',
                      type: 'number',
                      admin: {
                        description: 'Original price before commission',
                        width: '25%',
                      },
                    },
                    {
                      name: 'quantity',
                      type: 'number',
                      required: true,
                      defaultValue: 1,
                      admin: {
                        width: '25%',
                      },
                    },
                    {
                      name: 'shippingFee',
                      type: 'number',
                      defaultValue: 0,
                      admin: {
                        width: '25%',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'buyerProtection',
                      type: 'checkbox',
                      defaultValue: false,
                      admin: {
                        description: 'Buyer protection enabled',
                        width: '50%',
                      },
                    },
                    {
                      name: 'buyerProtectionFee',
                      type: 'number',
                      defaultValue: 0,
                      admin: {
                        description: '80% of shipping fee if enabled',
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  name: 'shippingStatus',
                  type: 'select',
                  required: true,
                  defaultValue: 'placed',
                  options: [
                    { label: 'Placed', value: 'placed' },
                    { label: 'Out for Delivery', value: 'out_for_delivery' },
                    { label: 'Delivered', value: 'delivered' },
                    { label: 'Return in Progress', value: 'return_in_progress' },
                    { label: 'Returned', value: 'returned' },
                    { label: 'Not Available', value: 'not_available' },
                  ],
                  admin: {
                    description: 'Shipping status for this item',
                  },
                },
                {
                  name: 'statusLogs',
                  type: 'array',
                  admin: {
                    description: 'History of status changes',
                  },
                  fields: [
                    {
                      name: 'status',
                      type: 'text',
                      required: true,
                    },
                    {
                      name: 'timestamp',
                      type: 'date',
                      required: true,
                      admin: {
                        date: { pickerAppearance: 'dayAndTime' },
                      },
                    },
                  ],
                },
                {
                  name: 'returnReason',
                  type: 'select',
                  options: [
                    { label: 'Wrong item sent', value: 'wrong_item' },
                    { label: 'Fake / Not Authentic', value: 'fake_item' },
                    { label: 'Item arrived damaged', value: 'damaged' },
                    { label: 'Item not as described', value: 'not_as_described' },
                  ],
                  admin: {
                    description: 'Reason for return (required when returning)',
                    condition: (data, siblingData) =>
                      siblingData?.shippingStatus === 'return_in_progress' ||
                      siblingData?.shippingStatus === 'returned',
                  },
                },
                {
                  name: 'returnImage',
                  type: 'upload',
                  relationTo: 'media',
                  admin: {
                    description: 'Photo evidence for return',
                    condition: (data, siblingData) =>
                      siblingData?.shippingStatus === 'return_in_progress' ||
                      siblingData?.shippingStatus === 'returned',
                  },
                },
              ],
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
                  name: 'subtotal',
                  type: 'number',
                  required: true,
                  defaultValue: 0,
                  admin: {
                    description: 'Subtotal (products only)',
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
                    description: 'Grand total (products + shipping + buyer protection - discount)',
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
            {
              type: 'row',
              fields: [
                {
                  name: 'discountCode',
                  type: 'relationship',
                  relationTo: 'discount-codes',
                  admin: {
                    description: 'Applied discount code (reference)',
                    width: '33%',
                  },
                },
                {
                  name: 'discountCodeUsed',
                  type: 'text',
                  admin: {
                    description: 'Discount code that was applied (e.g., SAVE20)',
                    readOnly: true,
                    width: '33%',
                  },
                },
                {
                  name: 'discountAmount',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Discount amount applied',
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
                  type: 'text',
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
