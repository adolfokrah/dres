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
      type: 'json',
      required: true,
      admin: {
        description: 'Complete search parameters (keywords, filters, categories, etc.)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this saved search is active and will send notifications for new matches',
      },
    },
    {
      name: 'lastChecked',
      type: 'date',
      admin: {
        description: 'Last time this search was checked for new matches',
      },
    },
    {
      name: 'lastNotificationSent',
      type: 'date',
      admin: {
        description: 'Last time a notification was sent for this search',
      },
    },
  ],
  timestamps: true,
}
