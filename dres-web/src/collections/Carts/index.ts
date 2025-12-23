import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { createOrderFromCart } from './hooks/createOrderFromCart'
import { validateCartStock } from './hooks/validateCartStock'

export const Carts: CollectionConfig = {
  slug: 'carts',
  admin: {
    useAsTitle: 'id',
    group: 'Ecommerce',
    defaultColumns: ['user', 'status', 'itemCount', 'updatedAt'],
    description: 'Shopping carts for users',
  },
  access: {
    // Users can only read their own cart
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        customer: {
          equals: user.id,
        },
      }
    },
    // Users can only create their own cart
    create: authenticated,
    // Users can only update their own cart
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        customer: {
          equals: user.id,
        },
      }
    },
    // Only admins can delete carts
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  hooks: {
    // Validate stock before allowing items in cart
    beforeValidate: [validateCartStock],
    // Calculate item count, total amount, buyer protection fees, and set currency before save
    beforeChange: [
      async ({ data, req }) => {
        if (data?.items && Array.isArray(data.items)) {
          // Calculate buyer protection fee for each item (80% of shipping fee if enabled)
          data.items = data.items.map((item: { 
            buyerProtection?: boolean
            shippingFee?: number
            buyerProtectionFee?: number
            quantity?: number
            price?: number
          }) => {
            if (item.buyerProtection && item.shippingFee) {
              item.buyerProtectionFee = Math.round(item.shippingFee * 0.80 * 100) / 100
            } else {
              item.buyerProtectionFee = 0
            }
            return item
          })

          // Calculate item count
          data.itemCount = data.items.reduce((total: number, item: { quantity?: number }) => {
            return total + (item.quantity || 0)
          }, 0)
          
          // Calculate total amount (price * qty + shipping + buyer protection)
          data.totalAmount = data.items.reduce((total: number, item: { 
            quantity?: number
            price?: number
            shippingFee?: number
            buyerProtectionFee?: number
          }) => {
            const quantity = item.quantity || 0
            const price = item.price || 0
            const shippingFee = item.shippingFee || 0
            const buyerProtectionFee = item.buyerProtectionFee || 0
            return total + (quantity * price) + shippingFee + buyerProtectionFee
          }, 0)
        }
        
        // Auto-set currency from customer's country
        if (data?.customer && !data?.currency) {
          const customerId = typeof data.customer === 'object' ? data.customer.id : data.customer
          const customer = await req.payload.findByID({
            collection: 'users',
            id: customerId,
            depth: 1,
          })
          
          if (customer?.country) {
            const country = customer.country
            if (typeof country === 'object' && country.currency) {
              data.currency = typeof country.currency === 'object' ? country.currency.id : country.currency
            }
          }
        }
        
        return data
      },
    ],
    // Create order when cart status changes to 'converted'
    afterChange: [createOrderFromCart],
  },
  fields: [
    {
      name: 'customer',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      // Each user can only have one active cart
      unique: false, // We'll handle this with status
      admin: {
        description: 'The customer who owns this cart',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Converted to Order', value: 'converted' },
        { label: 'Abandoned', value: 'abandoned' },
      ],
      admin: {
        description: 'Cart status',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 0,
      admin: {
        description: 'Items in the cart',
        components: {
          RowLabel: '@/collections/Carts/CartItemRowLabel#CartItemRowLabel',
        },
      },
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
          // Filter products to only show those where seller is from the same country as the cart user
          filterOptions: ({ user }) => {
            // Get the logged-in user's country
            const userCountry = user?.country
            
            // If we have the user's country, filter products by seller's country
            if (userCountry) {
              const countryId = typeof userCountry === 'object' ? userCountry.id : userCountry
              return {
                'seller.country': {
                  equals: countryId,
                },
              }
            }
            
            // Fallback: show all products if country not available
            return true
          },
          admin: {
            description: 'Products available from sellers in your country',
          },
        },
        {
          name: 'variation',
          type: 'number',
          admin: {
            description: 'Select a variation from the product',
            condition: (data, siblingData) => Boolean(siblingData?.product),
            components: {
              Field: '@/collections/Carts/VariationSelect#VariationSelectField',
            },
          },
        },
        {
          name: 'price',
          type: 'number',
          required: true,
          min: 0,
          admin: {
            description: 'Price (auto-populated from selected variation)',
            readOnly: true,
          },
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
          admin: {
            description: 'Quantity of this item',
          },
        },
        {
          name: 'shippingFee',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: {
            description: 'Shipping fee for this item',
          },
        },
        {
          name: 'buyerProtection',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Add buyer protection (80% of shipping fee)',
          },
        },
        {
          name: 'buyerProtectionFee',
          type: 'number',
          min: 0,
          defaultValue: 0,
          admin: {
            description: 'Buyer protection fee (auto-calculated: 80% of shipping fee)',
            readOnly: true,
          },
        },
        {
          name: 'addedAt',
          type: 'date',
          admin: {
            description: 'When this item was added to the cart',
            date: {
              pickerAppearance: 'dayAndTime',
            },
          },
          defaultValue: () => new Date().toISOString(),
        },
      ],
    },
    {
      name: 'itemCount',
      type: 'number',
      admin: {
        description: 'Total number of items in cart (auto-calculated)',
        readOnly: true,
      },
      defaultValue: 0,
    },
    {
      name: 'totalAmount',
      type: 'number',
      admin: {
        description: 'Total amount of cart (auto-calculated)',
        readOnly: true,
      },
      defaultValue: 0,
    },
    {
      name: 'currency',
      type: 'relationship',
      relationTo: 'currencies',
      admin: {
        description: 'Currency (auto-set from customer country)',
        readOnly: true,
      },
    },
    {
      name: 'purchasedAt',
      type: 'date',
      admin: {
        description: 'When the cart was converted to an order',
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Optional notes for the order',
      },
    },
  ],
  timestamps: true,
}
