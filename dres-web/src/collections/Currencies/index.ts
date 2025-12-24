import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

export const Currencies: CollectionConfig = {
  slug: 'currencies',
  admin: {
    useAsTitle: 'name',
    group: 'Settings',
    defaultColumns: ['name', 'code', 'symbol', 'isActive'],
    description: 'Supported currencies',
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
        description: 'Full currency name (e.g., "US Dollar")',
      },
    },
    {
      name: 'code',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'ISO 4217 currency code (e.g., "USD")',
      },
    },
    {
      name: 'symbol',
      type: 'text',
      required: true,
      admin: {
        description: 'Currency symbol (e.g., "$", "€", "₵")',
      },
    },
    {
      name: 'exchangeRateToGHS',
      type: 'number',
      required: true,
      defaultValue: 1,
      min: 0,
      admin: {
        description: 'Exchange rate to GHS (base currency). E.g., 1 USD = 15 GHS → enter 15. For GHS, enter 1.',
      },
    },
    {
      name: 'isBaseCurrency',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Is this the base currency (GHS)? Only one currency should be marked as base.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this currency is available for use',
      },
    },
  ],
  timestamps: true,
}
