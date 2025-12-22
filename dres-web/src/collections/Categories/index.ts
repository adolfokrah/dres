import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Ecommerce',
    defaultColumns: ['title', 'departments', 'collections'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'collections',
      type: 'relationship',
      relationTo: 'collections',
      hasMany: true,
      admin: {
        description: 'Select which collections this falls under (e.g., Dresses, Bottoms, Shoes)',
      },
    },

    {
      name: 'departments',
      type: 'relationship',
      relationTo: 'departments',
      hasMany: true,
      admin: {
        description: 'Select which departments this category belongs to',
      },
    },
    {
      name: 'brands',
      type: 'relationship',
      relationTo: 'brands',
      hasMany: true,
      admin: {
        description: 'Select which brands are available in this category',
      },
    },
    {
      name: 'attributes',
      type: 'relationship',
      relationTo: 'attributes',
      hasMany: true,
      admin: {
        description: 'Attributes available for products in this category (e.g., Fit, Material, Style)',
      },
    },
    {
      name: 'variantAttributes',
      type: 'relationship',
      relationTo: 'attributes',
      hasMany: true,
      admin: {
        description: 'Attributes used as variation types (e.g., Size, Color) - must be a subset of attributes above',
      },
    },
  ],
}
