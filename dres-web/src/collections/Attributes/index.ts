import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

export const Attributes: CollectionConfig = {
  slug: 'attributes',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
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
      name: 'level',
      type: 'select',
      required: true,
      defaultValue: 'variation',
      options: [
        { label: 'Variation Level', value: 'variation' },
        { label: 'SKU Level', value: 'sku' },
      ],
      admin: {
        description: 'Where this attribute should be used - Variation (e.g., Color) or SKU (e.g., Size)',
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
    {
      name: 'categories',
      type: 'join',
      collection: 'categories',
      on: 'attributes',
      admin: {
        description: 'Categories that use this attribute',
      },
    },
   
  ],
  timestamps: true,
}
