import type { CollectionConfig, Where } from 'payload'

import { authenticated } from '../../access/authenticated'
import { createOrderFromCart } from './hooks/createOrderFromCart'
import { validateCartStock } from './hooks/validateCartStock'
import { applyDiscountCode } from './hooks/applyDiscountCode'
import { applyPointsRedemption } from './hooks/applyPointsRedemption'
import { calculateCartTotals } from './hooks/calculateCartTotals'
import { addToCart } from './endpoints/addToCart'
import { getCart } from './endpoints/getCart'
import { updateCartItem } from './endpoints/updateCartItem'
import { removeCartItem } from './endpoints/removeCartItem'
import { updateShipping } from './endpoints/updateShipping'
import { applyPromoCode, removePromoCode } from './endpoints/applyPromoCode'
import { placeOrder } from './endpoints/placeOrder'

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
  endpoints: [
    {
      path: '/add-item',
      method: 'post',
      handler: addToCart,
    },
    {
      path: '/my-cart',
      method: 'get',
      handler: getCart,
    },
    {
      path: '/update-item',
      method: 'patch',
      handler: updateCartItem,
    },
    {
      path: '/remove-item',
      method: 'post',
      handler: removeCartItem,
    },
    {
      path: '/update-shipping',
      method: 'post',
      handler: updateShipping,
    },
    {
      path: '/apply-promo',
      method: 'post',
      handler: applyPromoCode,
    },
    {
      path: '/remove-promo',
      method: 'post',
      handler: removePromoCode,
    },
    {
      path: '/place-order',
      method: 'post',
      handler: placeOrder,
    },
  ],
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
          name: 'variation',
          type: 'relationship',
          relationTo: 'variations',
          required: true,
          // Filter variations to only show those where seller is from the same country as the cart user
          filterOptions: ({ user }) => {
            // Get the logged-in user's country
            const userCountry = user?.country
            
            // If we have the user's country, filter variations by seller's country
            if (userCountry) {
              const countryId = typeof userCountry === 'object' ? userCountry.id : userCountry
              return {
                'style.seller.country': {
                  equals: countryId,
                },
              }
            }
            
            // Fallback: show all products if country not available
            return true
          },
          admin: {
            description: 'Variations available from sellers in your country',
          },
        },
        {
          name: 'sku',
          type: 'relationship',
          relationTo: 'skus',
          admin: {
            description: 'Select a SKU for this variation',
            condition: (data, siblingData) => Boolean(siblingData?.variation),
          },
          // Filter SKUs to only show those for the selected variation
          filterOptions: ({ siblingData, data }): boolean | Where => {
            const variation = (siblingData as Record<string, unknown>)?.variation as string | { id: string } | undefined
            const variationId = variation
              ? typeof variation === 'object'
                ? variation.id
                : variation
              : null

            if (!variationId) return false

            // Get current SKU ID (to not exclude itself when editing)
            const currentSku = (siblingData as Record<string, unknown>)?.sku as string | { id: string } | undefined
            const currentSkuId = currentSku
              ? typeof currentSku === 'object'
                ? currentSku.id
                : currentSku
              : null

            // Get all SKU IDs already in the cart (except current item)
            const items = (data as Record<string, unknown>)?.items as Array<{
              variation?: string | { id: string }
              sku?: string | { id: string }
            }> | undefined

            const usedSkuIds: string[] = []
            if (items && Array.isArray(items)) {
              for (const item of items) {
                const itemSku = item?.sku
                if (itemSku) {
                  const skuId = typeof itemSku === 'object' ? itemSku.id : itemSku
                  // Don't exclude the current item's SKU
                  if (skuId && skuId !== currentSkuId) {
                    usedSkuIds.push(skuId)
                  }
                }
              }
            }

            // Build filter
            const filter: Where = {
              variation: {
                equals: variationId,
              },
              isActive: {
                equals: true,
              },
            }

            // Exclude already used SKUs
            if (usedSkuIds.length > 0) {
              filter.id = {
                not_in: usedSkuIds,
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
            description: 'Price (auto-populated from selected SKU)',
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
