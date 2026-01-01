import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { createSellerTransactionOnDelivery } from './hooks/createSellerTransactionOnDelivery'
import { createRefundTransaction } from './hooks/createRefundTransaction'
import { calculateOrderTotalsAndStatus } from './hooks/calculateOrderTotalsAndStatus'
import { calculateTotalCommission } from './hooks/calculateTotalCommission'
import { updateSalesStats } from './hooks/updateSalesStats'
import { reduceStockOnOrder } from './hooks/reduceStockOnOrder'
import { restoreStockOnReturn } from './hooks/restoreStockOnReturn'
import { restoreStockOnCancel } from './hooks/restoreStockOnCancel'
import { awardPointsOnDelivery } from './hooks/awardPointsOnDelivery'
import { notifySellersOnOrderPlaced } from './hooks/notifySellersOnOrderPlaced'
import { notifyCustomerOnStatusChange } from './hooks/notifyCustomerOnStatusChange'
import { returnItem } from './endpoints/returnItem'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'orderId',
    group: 'Ecommerce',
    defaultColumns: ['orderId', 'user', 'status', 'totalItems', 'totalAmount', 'createdAt'],
    description: 'Customer orders',
  },
  endpoints: [
    {
      path: '/:id/return-item',
      method: 'post',
      handler: returnItem,
    },
  ],
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
    // Reduce stock on order creation, restore stock on return/cancel, notify sellers, create seller transaction when item is delivered, create refund when item is returned or not available, update sales stats, award points, notify customer, then calculate commission
    afterChange: [reduceStockOnOrder, restoreStockOnReturn, restoreStockOnCancel, notifySellersOnOrderPlaced, createSellerTransactionOnDelivery, createRefundTransaction, updateSalesStats, awardPointsOnDelivery, notifyCustomerOnStatusChange, calculateTotalCommission],
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
          defaultValue: 'new',
          options: [
            { label: 'New (Awaiting Payment)', value: 'new' },
            { label: 'Placed', value: 'placed' },
            { label: 'In Progress', value: 'in_progress' },
            { label: 'Completed', value: 'completed' },
            { label: 'Cancelled', value: 'cancelled' },
          ],
          admin: {
            description: 'New (awaiting payment), Placed (payment received), In Progress (items in transit), Completed (all delivered/returned), Cancelled (payment failed or all returned)',
            width: '50%',
            components: {
              Cell: '@/collections/Orders/OrderStatusCell#OrderStatusCell',
            },
          },
        },
      ],
    },
    {
      name: 'cart',
      type: 'relationship',
      relationTo: 'carts',
      admin: {
        description: 'The cart this order was created from',
        readOnly: true,
      },
    },
    {
      name: 'paymentTransaction',
      type: 'relationship',
      relationTo: 'transactions',
      admin: {
        description: 'The payment transaction for this order',
        readOnly: true,
      },
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
                      name: 'variation',
                      type: 'relationship',
                      relationTo: 'variations',
                      admin: {
                        description: 'Reference to the variation',
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
                      name: 'variationTitle',
                      type: 'text',
                      required: true,
                      admin: {
                        description: 'Variation title at time of purchase',
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
                  name: 'sellerImage',
                  type: 'text',
                  admin: {
                    description: 'URL to seller profile photo at time of purchase',
                  },
                },
                {
                  name: 'variationImage',
                  type: 'text',
                  admin: {
                    description: 'URL to variation image at time of purchase',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'sku',
                      type: 'relationship',
                      relationTo: 'skus',
                      admin: {
                        description: 'Reference to the SKU',
                        width: '50%',
                      },
                    },
                    {
                      name: 'skuTitle',
                      type: 'text',
                      admin: {
                        description: 'SKU title at time of purchase (e.g., "Red / M / GHS 99")',
                        width: '50%',
                      },
                    },
                  ],
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
                    { label: 'Cancelled', value: 'cancelled' },
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
                    description: 'Grand total (products + shipping + buyer protection - discount - points)',
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
            {
              type: 'row',
              fields: [
                {
                  name: 'pointsRedeemed',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Points redeemed for this order',
                    readOnly: true,
                    width: '50%',
                  },
                },
                {
                  name: 'pointsDiscount',
                  type: 'number',
                  defaultValue: 0,
                  admin: {
                    description: 'Discount from redeemed points',
                    readOnly: true,
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'commissionBreakdownTable',
              type: 'ui',
              admin: {
                components: {
                  Field: '@/collections/Orders/components/CommissionBreakdownTable',
                },
              },
            },
            {
              type: 'group',
              name: 'commissionBreakdown',
              label: ' ',
              admin: {
                condition: () => false, // Hide from UI, only used for data storage
              },
              fields: [
                {
                  name: 'totalTransactionFees',
                  type: 'number',
                  defaultValue: 0,
                },
                {
                  name: 'totalPaystackFees',
                  type: 'number',
                  defaultValue: 0,
                },
                {
                  name: 'totalBuyerProtectionFees',
                  type: 'number',
                  defaultValue: 0,
                },
                {
                  name: 'discountAmount',
                  type: 'number',
                  defaultValue: 0,
                },
                {
                  name: 'pointsDiscount',
                  type: 'number',
                  defaultValue: 0,
                },
                {
                  name: 'totalCommission',
                  type: 'number',
                  defaultValue: 0,
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
