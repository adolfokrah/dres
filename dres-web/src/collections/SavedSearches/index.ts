import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { getMySavedSearches } from './endpoints/getMySavedSearches'
import { saveSearch } from './endpoints/saveSearch'
import { deleteSavedSearch } from './endpoints/deleteSavedSearch'

export const SavedSearches: CollectionConfig = {
  slug: 'saved-searches',
  admin: {
    group: 'Users',
    defaultColumns: ['user', 'name', 'createdAt'],
    description: 'User saved product searches',
  },
  endpoints: [
    {
      path: '/my-searches',
      method: 'get',
      handler: getMySavedSearches,
    },
    {
      path: '/save',
      method: 'post',
      handler: saveSearch,
    },
    {
      path: '/:id/delete',
      method: 'delete',
      handler: deleteSavedSearch,
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
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The user who saved the search',
      },
    },
    {
      name: 'name',
      type: 'text',
      admin: {
        description: 'Optional name for the saved search',
      },
    },
    {
      name: 'searchData',
      type: 'group',
      admin: {
        description: 'The search/filter parameters',
      },
      fields: [
        {
          name: 'departmentId',
          type: 'text',
        },
        {
          name: 'departmentName',
          type: 'text',
        },
        {
          name: 'collectionId',
          type: 'text',
        },
        {
          name: 'collectionName',
          type: 'text',
        },
        {
          name: 'categoryId',
          type: 'text',
        },
        {
          name: 'categoryName',
          type: 'text',
        },
        {
          name: 'brandId',
          type: 'text',
        },
        {
          name: 'brandName',
          type: 'text',
        },
        {
          name: 'filterType',
          type: 'text',
          admin: {
            description: 'e.g., new_in, best_sellers, sale',
          },
        },
        {
          name: 'sortBy',
          type: 'text',
          admin: {
            description: 'e.g., newest, price_low, price_high',
          },
        },
        {
          name: 'sortPrice',
          type: 'text',
          admin: {
            description: 'asc or desc',
          },
        },
        {
          name: 'minPrice',
          type: 'number',
        },
        {
          name: 'maxPrice',
          type: 'number',
        },
        {
          name: 'selectedAttributes',
          type: 'json',
          admin: {
            description: 'Map of attributeId to array of optionIds',
          },
        },
      ],
    },
  ],
  timestamps: true,
}
