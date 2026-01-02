import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

export const Countries: CollectionConfig = {
  slug: 'countries',
  admin: {
    useAsTitle: 'name',
    group: 'Locations',
    defaultColumns: ['name', 'code', 'currency', 'isActive'],
    description: 'Supported countries with their currencies',
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
        description: 'Country name (e.g., "Ghana")',
      },
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'ISO country code (e.g., "GH")',
      },
    },
    {
      name: 'currency',
      type: 'relationship',
      relationTo: 'currencies',
      required: true,
      admin: {
        description: 'Default currency for this country',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this country is available for sellers',
      },
    },
  ],
  timestamps: true,
}
