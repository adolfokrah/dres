import type { CollectionConfig, PayloadHandler } from 'payload'

import { authenticated } from '../../access/authenticated'

/**
 * GET /api/shippingRates/me
 * Get current user's shipping rates
 */
const getMyShippingRates: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const rates = await payload.find({
    collection: 'shippingRates',
    where: {
      user: { equals: user.id },
    },
    depth: 2,
    sort: '-createdAt',
    limit: 100,
  })

  return Response.json(rates)
}

export const ShippingRates: CollectionConfig = {
  slug: 'shippingRates',
  admin: {
    useAsTitle: 'id',
    group: 'Orders',
    defaultColumns: ['user', 'cities', 'deliveryCost', 'updatedAt'],
    description: 'Shipping rates set by sellers for their products',
  },
  endpoints: [
    {
      path: '/me',
      method: 'get',
      handler: getMyShippingRates,
    },
  ],
  access: {
    // Users can only read their own shipping rates or any for checkout
    read: ({ req: { user } }) => {
      if (!user) return true // Allow public read for checkout
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    // Users can only create their own shipping rates
    create: authenticated,
    // Users can only update their own shipping rates
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    // Users can only delete their own shipping rates
    delete: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
  },
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        // Auto-set user and country on create
        if (operation === 'create') {
          // Auto-set user to current user if not provided
          if (!data?.user && req.user) {
            data.user = req.user.id
          }
          
          // Auto-set country from user
          if (data?.user && !data?.country) {
            const userId = typeof data.user === 'object' ? data.user.id : data.user
            const user = await req.payload.findByID({
              collection: 'users',
              id: userId,
              depth: 0,
            })
            if (user?.country) {
              data.country = typeof user.country === 'object' ? user.country.id : user.country
            }
          }
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
      admin: {
        description: 'The seller who owns this shipping rate',
      },
    },
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      admin: {
        description: 'Country (auto-set from seller)',
        readOnly: true,
      },
    },
    {
      name: 'cities',
      type: 'relationship',
      relationTo: 'cities',
      hasMany: true,
      required: true,
      admin: {
        description: 'Cities this shipping rate applies to',
      },
    },
    {
      name: 'deliveryCost',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Delivery cost (in country currency)',
      },
    },
    {
      name: 'freeShippingThreshold',
      type: 'number',
      min: 0,
      admin: {
        description: 'Order amount above which shipping is free (leave empty for no free shipping)',
      },
    },
    {
      name: 'estimatedDays',
      type: 'group',
      admin: {
        description: 'Estimated delivery time',
      },
      fields: [
        {
          name: 'min',
          type: 'number',
          min: 1,
          admin: {
            description: 'Minimum days',
          },
        },
        {
          name: 'max',
          type: 'number',
          min: 1,
          admin: {
            description: 'Maximum days',
          },
        },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this shipping rate is currently active',
      },
    },
  ],
  timestamps: true,
}
