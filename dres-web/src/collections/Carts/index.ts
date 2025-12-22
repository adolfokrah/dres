import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

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
        user: {
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
        user: {
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
    // Calculate item count and total amount before save
    beforeChange: [
      ({ data }) => {
        if (data?.items && Array.isArray(data.items)) {
          // Calculate item count
          data.itemCount = data.items.reduce((total: number, item: { quantity?: number }) => {
            return total + (item.quantity || 0)
          }, 0)
          
          // Calculate total amount
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
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      // Each user can only have one active cart
      unique: false, // We'll handle this with status
      admin: {
        description: 'The user who owns this cart',
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
