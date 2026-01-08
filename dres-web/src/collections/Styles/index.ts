import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { anyone } from '../../access/anyone'
import { getStyleReviewsEndpoint } from './endpoints/getStyleReviews'
import { getMyDraftStyles } from './endpoints/getMyDraftStyles'
import { getMyProducts } from './endpoints/getMyProducts'
import { getStyleDetails } from './endpoints/getStyleDetails'
import { updateVariationsOnTitleChange } from './hooks/updateVariationsOnTitleChange'
import { validatePublish } from './hooks/validatePublish'

export const Styles: CollectionConfig = {
  slug: 'styles',
  admin: {
    group: 'Catalog',
    useAsTitle: 'title',
    defaultColumns: ['title', 'department', 'category', 'brand', 'createdAt'],
    description: 'Product styles - the main product definition',
  },
  indexes: [
    // Common catalog filters
    { fields: ['status'] },
    // Note: collection, category, brand, seller are relationship fields - Payload auto-indexes them
    // Compound index to accelerate multi-filter queries
    { fields: ['status', 'collection', 'category', 'brand'] },
  ],
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  hooks: {
    beforeChange: [
      // Auto-set seller to current user on create
      ({ req, operation, data }) => {
        if (operation === 'create' && req.user) {
          data.seller = req.user.id
        }
        return data
      },
      // Validate before publishing
      validatePublish,
    ],
    afterChange: [
      // Update variation titles/slugs when style title changes
      updateVariationsOnTitleChange,
    ],
  },
  endpoints: [
    {
      path: '/:id/reviews',
      method: 'get',
      handler: getStyleReviewsEndpoint,
    },
    {
      path: '/my-drafts',
      method: 'get',
      handler: getMyDraftStyles,
    },
    {
      path: '/my-products',
      method: 'get',
      handler: getMyProducts,
    },
    {
      path: '/:id/details',
      method: 'get',
      handler: getStyleDetails,
    },
  ],
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Published', value: 'published' },
        { label: 'Archived', value: 'archived' },
      ],
      admin: {
        description: 'Only published styles will be visible to buyers. Archived styles are hidden from seller.',
        position: 'sidebar',
      },
    },
    {
      name: 'seller',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        description: 'The user selling this product',
      },
    },
    {
      name: 'title',
      type: 'text',
    },
    {
      name: 'description',
      type:'textarea',
    },
    {
      name: 'isResell',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this product is a resell from a returned item (e.g., from a thrift store)',
      },
    },
    {
      name: 'department',
      type: 'relationship',
      relationTo: 'departments',
      admin: {
        description: 'Select a department first to filter available collections',
      },
    },
    {
      name: 'collection',
      type: 'relationship',
      relationTo: 'collections',
      admin: {
        description: 'Select a collection',
      },
      filterOptions: ({ data }) => {
        const departmentId = data?.department
        if (departmentId) {
          return {
            departments: {
              contains: typeof departmentId === 'object' ? departmentId.id : departmentId,
            },
          }
        }
        return true
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      filterOptions: ({ data }) => {
        const collectionId = data?.collection
        if (collectionId) {
          return {
            collections: {
              contains: typeof collectionId === 'object' ? collectionId.id : collectionId,
            },
          }
        }
        return true
      },
      admin: {
        description: 'Select a category',
        condition: (data) => Boolean(data?.collection),
      },
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      admin: {
        description: 'Select a brand',
        condition: (data) => Boolean(data?.category),
      },
    },
    {
      name: 'variations',
      type: 'join',
      collection: 'variations',
      on: 'style',
      admin: {
        description: 'Product variations (color/size combinations)',
      },
    },
    {
      name: 'boost',
      type: 'join',
      collection: 'style-boosts',
      on: 'style',
      admin: {
        description: 'Boosts for increased visibility',
      },
    }
  ],
}
