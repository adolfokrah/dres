import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'
import { anyone } from '../../access/anyone'
import { getStyleReviewsEndpoint } from './endpoints/getStyleReviews'

export const Styles: CollectionConfig = {
  slug: 'styles',
  admin: {
    group: 'Catalog',
    useAsTitle: 'title',
    defaultColumns: ['title', 'department', 'category', 'brand', 'createdAt'],
    description: 'Product styles - the main product definition',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: ({ req: { user } }) => {
      if (!user) return false
      return user.role === 'admin'
    },
  },
  endpoints: [
    {
      path: '/:id/reviews',
      method: 'get',
      handler: getStyleReviewsEndpoint,
    },
  ],
  fields: [
    {
      name: 'seller',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The user selling this product',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
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
      required: true,
      admin: {
        description: 'Select a department first to filter available collections',
      },
    },
    {
      name: 'collection',
      type: 'relationship',
      relationTo: 'collections',
      required: true,
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
      required: true,
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
      required: true,
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
