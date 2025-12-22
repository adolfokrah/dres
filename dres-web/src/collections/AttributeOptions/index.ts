import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

export const AttributeOptions: CollectionConfig = {
  slug: 'attributeOptions',
  admin: {
    useAsTitle: 'name',
    group: 'Ecommerce',
    defaultColumns: ['name', 'slug', 'attribute', 'updatedAt'],
    description: 'Options for product attributes (e.g., "Slim Fit", "Leather")',
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
      admin: {
        description: 'Option name (e.g., "Slim Fit", "Leather", "Cotton")',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      admin: {
        description: 'URL-friendly slug (e.g., "slim-fit", "leather", "cotton")',
      },
    },
    {
      name: 'attribute',
      type: 'relationship',
      relationTo: 'attributes',
      required: true,
      admin: {
        description: 'The attribute this option belongs to',
      },
    },
  ],
  timestamps: true,
}
