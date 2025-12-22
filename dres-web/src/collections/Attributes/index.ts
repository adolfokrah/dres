import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

export const Attributes: CollectionConfig = {
  slug: 'attributes',
  admin: {
    useAsTitle: 'name',
    group: 'Ecommerce',
    defaultColumns: ['name', 'updatedAt'],
    description: 'Product attributes like Fit, Material, Style, etc.',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Attribute name (e.g., "Fit", "Material", "Style")',
      },
    },
    {
      name: 'categories',
      type: 'join',
      collection: 'categories',
      on: 'attributes',
      admin: {
        description: 'Categories that use this attribute',
      },
    },
    {
      name: 'options',
      type: 'join',
      collection: 'attributeOptions',
      on: 'attribute',
      admin: {
        description: 'Options available for this attribute',
      },
    },
  ],
  timestamps: true,
}
