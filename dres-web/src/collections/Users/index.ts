import type { CollectionConfig } from 'payload'

import { authenticated } from '../../access/authenticated'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: authenticated,
    create: authenticated,
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['firstName', 'lastName', 'email', 'role'],
    useAsTitle: 'email',
  },
  auth: true,
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Personal Info',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'firstName',
                  type: 'text',
                  required: true,
                },
                {
                  name: 'lastName',
                  type: 'text',
                  required: true,
                },
              ],
            },
            {
              name: 'shopName',
              type: 'text',
              admin: {
                description: 'Your shop or business name',
              },
            },
            {
              name: 'photo',
              type: 'upload',
              relationTo: 'media',
            },
          ],
        },
        {
          label: 'Location',
          fields: [
            {
              name: 'country',
              type: 'relationship',
              relationTo: 'countries',
              required: true,
              admin: {
                description: 'Your country (determines currency for products and shipping)',
              },
            },
            {
              name: 'language',
              type: 'select',
              defaultValue: 'en',
              options: [
                { label: 'English', value: 'en' },
                { label: 'French', value: 'fr' },
                { label: 'German', value: 'de' },
                { label: 'Spanish', value: 'es' },
                { label: 'Italian', value: 'it' },
                { label: 'Portuguese', value: 'pt' },
                { label: 'Dutch', value: 'nl' },
                { label: 'Japanese', value: 'ja' },
                { label: 'Chinese', value: 'zh' },
                { label: 'Korean', value: 'ko' },
              ],
            },
          ],
        },
        {
          label: 'Shipping Rates',
          fields: [
            {
              name: 'shippingRates',
              type: 'join',
              collection: 'shippingRates',
              on: 'user',
              admin: {
                description: 'Shipping rates set by this seller',
                defaultColumns: ['cities', 'deliveryCost', 'freeShippingThreshold', 'estimatedDays'],
              },
            },
          ],
        },
        {
          label: 'Withdrawal Account',
          fields: [
            {
              type: 'group',
              name: 'withdrawalAccount',
              admin: {
                description: 'Bank account details for receiving payments from sold items',
              },
              fields: [
                {
                  name: 'accountName',
                  type: 'text',
                  admin: {
                    description: 'Account holder name',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'accountNumber',
                      type: 'text',
                      admin: {
                        description: 'Account number',
                        width: '50%',
                      },
                    },
                    {
                      name: 'bank',
                      type: 'text',
                      admin: {
                        description: 'Bank or payment provider (e.g., MTN Mobile Money)',
                        width: '50%',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'user',
      options: [
        { label: 'Admin', value: 'admin' },
        { label: 'User', value: 'user' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'accountStatus',
      type: 'select',
      required: true,
      defaultValue: 'active',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Banned', value: 'banned' },
        { label: 'Deleted', value: 'deleted' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'vacationMode',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'When enabled, your products will be hidden from buyers',
      },
    },
  ],
  timestamps: true,
}
