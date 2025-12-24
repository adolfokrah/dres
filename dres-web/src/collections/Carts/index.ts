import type { CollectionConfig, Where } from 'payload'

import { authenticated } from '../../access/authenticated'
import { createOrderFromCart } from './hooks/createOrderFromCart'
import { validateCartStock } from './hooks/validateCartStock'
import { applyDiscountCode } from './hooks/applyDiscountCode'
import { applyPointsRedemption } from './hooks/applyPointsRedemption'
import { calculateCartTotals } from './hooks/calculateCartTotals'

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
    // Calculate item count, total amount, buyer protection fees, apply discounts/points, and set currency before save
    beforeChange: [applyDiscountCode, applyPointsRedemption, calculateCartTotals],
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
          type: 'relationship',
          relationTo: 'product-variations',
          admin: {
            description: 'Select a variation for this product',
            condition: (data, siblingData) => Boolean(siblingData?.product),
          },
          // Filter variations to only show those for the selected product
          // and exclude variations already selected in other cart items
          filterOptions: ({ siblingData, data }): boolean | Where => {
            const product = (siblingData as Record<string, unknown>)?.product as string | { id: string } | undefined
            const productId = product
              ? typeof product === 'object'
                ? product.id
                : product
              : null

            if (!productId) return false

            // Get current variation ID (to not exclude itself when editing)
            const currentVariation = (siblingData as Record<string, unknown>)?.variation as string | { id: string } | undefined
            const currentVariationId = currentVariation
              ? typeof currentVariation === 'object'
                ? currentVariation.id
                : currentVariation
              : null

            // Get all variation IDs already in the cart (except current item)
            const items = (data as Record<string, unknown>)?.items as Array<{
              product?: string | { id: string }
              variation?: string | { id: string }
            }> | undefined

            const usedVariationIds: string[] = []
            if (items && Array.isArray(items)) {
              for (const item of items) {
                const itemVariation = item?.variation
                if (itemVariation) {
                  const varId = typeof itemVariation === 'object' ? itemVariation.id : itemVariation
                  // Don't exclude the current item's variation
                  if (varId && varId !== currentVariationId) {
                    usedVariationIds.push(varId)
                  }
                }
              }
            }

            // Build filter
            const filter: Where = {
              product: {
                equals: productId,
              },
              isActive: {
                equals: true,
              },
            }

            // Exclude already used variations
            if (usedVariationIds.length > 0) {
              filter.id = {
                not_in: usedVariationIds,
              }
            }

            return filter
          },
        },
        {
          name: 'price',
          type: 'number',
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
      name: 'subtotal',
      type: 'number',
      admin: {
        description: 'Subtotal (products only, before shipping/fees - used for discount calculation)',
        readOnly: true,
      },
      defaultValue: 0,
    },
    {
      name: 'grandTotal',
      type: 'number',
      admin: {
        description: 'Grand total (subtotal + shipping + buyer protection - discount)',
        readOnly: true,
      },
      defaultValue: 0,
    },
    {
      name: 'discountCode',
      type: 'relationship',
      relationTo: 'discount-codes',
      admin: {
        description: 'Applied discount code (discount applies to subtotal)',
      },
    },
    {
      name: 'discountAmount',
      type: 'number',
      admin: {
        description: 'Discount amount applied (percentage of subtotal)',
        readOnly: true,
      },
      defaultValue: 0,
    },
    {
      name: 'pointsToRedeem',
      type: 'number',
      min: 0,
      admin: {
        description: 'Points to redeem as discount (1 point = 1 currency unit)',
      },
      defaultValue: 0,
    },
    {
      name: 'pointsDiscount',
      type: 'number',
      admin: {
        description: 'Discount from redeemed points (auto-calculated)',
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
