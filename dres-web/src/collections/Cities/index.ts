import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

export const Cities: CollectionConfig = {
  slug: 'cities',
  admin: {
    useAsTitle: 'name',
    group: 'Locations',
    defaultColumns: ['name', 'country', 'region', 'updatedAt'],
    description: 'Cities within countries',
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
        description: 'City name (e.g., "Accra")',
      },
    },
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      admin: {
        description: 'Country this city belongs to',
      },
    },
    {
      name: 'region',
      type: 'relationship',
      relationTo: 'regions',
      admin: {
        description: 'Region/State this city belongs to (optional)',
      },
    },
  ],
  timestamps: true,
}
