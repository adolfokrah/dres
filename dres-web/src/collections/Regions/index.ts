import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { getRegionsByCountry } from './endpoints/getRegionsByCountry'

export const Regions: CollectionConfig = {
  slug: 'regions',
  admin: {
    useAsTitle: 'name',
    group: 'Locations',
    defaultColumns: ['name', 'country', 'updatedAt'],
    description: 'Regions/States within countries',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  endpoints: [
    {
      path: '/by-country',
      method: 'get',
      handler: getRegionsByCountry,
    },
  ],
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Region name (e.g., "Greater Accra")',
      },
    },
    {
      name: 'country',
      type: 'relationship',
      relationTo: 'countries',
      required: true,
      admin: {
        description: 'Country this region belongs to',
      },
    },
    {
      name: 'cities',
      type: 'join',
      collection: 'cities',
      on: 'region',
      admin: {
        description: 'Cities in this region',
      },
    },
  ],
  timestamps: true,
}
