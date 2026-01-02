import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { getMyFavorites } from './endpoints/getMyFavorites'
import { addToFavorites } from './endpoints/addToFavorites'
import { removeFromFavorites } from './endpoints/removeFromFavorites'
import { checkFavorite } from './endpoints/checkFavorite'

export const Favorites: CollectionConfig = {
  slug: 'favorites',
  admin: {
    group: 'Users',
    defaultColumns: ['user', 'product', 'createdAt'],
    description: 'User favorite products',
  },
  endpoints: [
    {
      path: '/my-favorites',
      method: 'get',
      handler: getMyFavorites,
    },
    {
      path: '/add',
      method: 'post',
      handler: addToFavorites,
    },
    {
      path: '/remove/:variationId',
      method: 'delete',
      handler: removeFromFavorites,
    },
    {
      path: '/check/:variationId',
      method: 'get',
      handler: checkFavorite,
    },
  ],
  access: {
    read: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
    create: authenticated,
    update: ({ req: { user } }) => {
      if (!user) return false
      if (user.role === 'admin') return true
      return {
        user: {
          equals: user.id,
        },
      }
    },
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
  indexes: [
    {
      fields: ['user', 'variation'],
      unique: true,
    },
  ],
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The user who favorited the product',
      },
    },
    {
      name: 'variation',
      type: 'relationship',
      relationTo: 'variations',
      required: true,
      admin: {
        description: 'The favorited variation',
      },
    },
  ],
  timestamps: true,
}
