import type { CollectionConfig, Where } from 'payload'

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
          label: 'Products',
          fields: [
            {
              name: 'products',
              type: 'join',
              collection: 'products',
              on: 'seller',
              admin: {
                description: 'Products listed by this seller',
                defaultColumns: ['title', 'price', 'category', 'status', 'createdAt'],
              },
            },
          ],
        },
        {
          label: 'Orders',
          fields: [
            {
              name: 'orders',
              type: 'join',
              collection: 'orders',
              on: 'customer',
              admin: {
                description: 'Orders placed by this user',
                defaultColumns: ['orderId', 'status', 'totalAmount', 'createdAt'],
              },
            },
          ],
        },
        {
          label: 'Sales',
          fields: [
            {
              name: 'sales',
              type: 'join',
              collection: 'orders',
              on: 'sellers',
              admin: {
                description: 'Orders containing items sold by this user',
                defaultColumns: ['orderId', 'status', 'totalAmount', 'createdAt'],
              },
            },
          ],
        },
        {
          label: 'Transactions',
          fields: [
            {
              name: 'transactions',
              type: 'join',
              collection: 'transactions',
              on: 'user',
              admin: {
                description: 'Transaction history for this user',
                defaultColumns: ['type', 'amount', 'status', 'createdAt'],
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
        {
          label: 'Shipping Addresses',
          fields: [
            {
              name: 'addresses',
              type: 'array',
              admin: {
                description: 'Saved addresses for shipping',
              },
              fields: [
                {
                  name: 'label',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'Address label (e.g., Home, Work, etc.)',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'fullName',
                      type: 'text',
                      required: true,
                      admin: {
                        description: 'Recipient full name',
                        width: '50%',
                      },
                    },
                    {
                      name: 'phone',
                      type: 'text',
                      required: true,
                      admin: {
                        description: 'Contact phone number',
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  name: 'address',
                  type: 'textarea',
                  required: true,
                  admin: {
                    description: 'Street address',
                  },
                },
                {
                  name: 'country',
                  type: 'relationship',
                  relationTo: 'countries',
                  required: true,
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'region',
                      type: 'relationship',
                      relationTo: 'regions',
                      filterOptions: ({ siblingData }) => {
                        const data = siblingData as Record<string, unknown>
                        const countryId = data?.country
                        if (!countryId) return true
                        return {
                          country: {
                            equals: typeof countryId === 'object' && countryId !== null ? (countryId as { id: string }).id : countryId,
                          },
                        }
                      },
                      admin: {
                        description: 'Select country first',
                        condition: (data, siblingData) => Boolean(siblingData?.country),
                        width: '50%',
                      },
                    },
                    {
                      name: 'city',
                      type: 'relationship',
                      relationTo: 'cities',
                      required: true,
                      filterOptions: ({ siblingData }): Where | boolean => {
                        const data = siblingData as Record<string, unknown>
                        const countryId = data?.country
                        const regionId = data?.region
                        if (regionId) {
                          return {
                            region: {
                              equals: typeof regionId === 'object' && regionId !== null ? (regionId as { id: string }).id : regionId,
                            },
                          }
                        }
                        if (countryId) {
                          return {
                            country: {
                              equals: typeof countryId === 'object' && countryId !== null ? (countryId as { id: string }).id : countryId,
                            },
                          }
                        }
                        return true
                      },
                      admin: {
                        description: 'Select country first',
                        condition: (data, siblingData) => Boolean(siblingData?.country),
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  name: 'postalCode',
                  type: 'text',
                  admin: {
                    description: 'ZIP/Postal code',
                  },
                },
                {
                  name: 'deliveryNotes',
                  type: 'textarea',
                  admin: {
                    description: 'Special delivery instructions',
                  },
                },
                {
                  name: 'isDefault',
                  type: 'checkbox',
                  defaultValue: false,
                  admin: {
                    description: 'Set as default shipping address',
                  },
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
