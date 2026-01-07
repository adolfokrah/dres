import type { CollectionConfig, Where } from 'payload'

import { authenticated } from '../../access/authenticated'
import { adminOnly } from '../../access/adminOnly'
import { generateUsername } from './hooks/generateUsername'
import { beforeLogin } from './hooks/beforeLogin'
import { getSellerInfo } from './endpoints/getSellerInfo'
import { firebaseOAuth } from './endpoints/firebaseOAuth'
import { addAddress, deleteAddress, setDefaultAddress, updateAddress } from './endpoints/addresses'
import { getUserStats } from './endpoints/getUserStats'
import { updateEmail, resendVerification } from './endpoints/updateEmail'
import { getBanksEndpoint, resolveAccountEndpoint, saveWithdrawalAccountEndpoint } from './endpoints/resolveBankAccount'

export const Users: CollectionConfig = {
  slug: 'users',
  access: {
    admin: adminOnly, // Only admins can access the CMS
    create: () => true, // Allow public registration
    delete: authenticated,
    read: authenticated,
    update: authenticated,
  },
  admin: {
    defaultColumns: ['firstName', 'lastName', 'email', 'role'],
    useAsTitle: 'email',
    group: 'Users',
  },
  auth: {
    tokenExpiration: 31536000, // 1 year in seconds
    verify: true, // Require email verification
    maxLoginAttempts: 5, // Automatically lock a user out after X amount of failed logins
    lockTime: 600 * 1000, // Time period to allow the max login attempts
    // More options are available
  },
  hooks: {
    beforeLogin: [beforeLogin],
  },
  endpoints: [
    {
      path: '/:id/seller',
      method: 'get',
      handler: getSellerInfo,
    },
    {
      path: '/:id/stats',
      method: 'get',
      handler: getUserStats,
    },
    {
      path: '/oauth/firebase',
      method: 'post',
      handler: firebaseOAuth,
    },
    {
      path: '/addresses',
      method: 'post',
      handler: addAddress,
    },
    {
      path: '/addresses/:index',
      method: 'delete',
      handler: deleteAddress,
    },
    {
      path: '/addresses/:index',
      method: 'put',
      handler: updateAddress,
    },
    {
      path: '/addresses/:index/default',
      method: 'patch',
      handler: setDefaultAddress,
    },
    {
      path: '/update-email',
      method: 'post',
      handler: updateEmail,
    },
    {
      path: '/resend-verification',
      method: 'post',
      handler: resendVerification,
    },
    getBanksEndpoint,
    resolveAccountEndpoint,
    saveWithdrawalAccountEndpoint,
  ],
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
              name: 'username',
              type: 'text',
              unique: true,
              admin: {
                description: 'Your unique username (will be auto-generated if not provided)',
              },
              hooks: {
                beforeValidate: [generateUsername],
              },
            },
            {
              name: 'phone',
              type: 'text',
              admin: {
                description: 'Contact phone number for returns and inquiries',
              },
            },
            {
              name: 'photo',
              type: 'upload',
              relationTo: 'media',
            }
          ],
        },
        {
          label: 'Location',
          fields: [
            {
              name: 'country',
              type: 'relationship',
              relationTo: 'countries',
              admin: {
                description: 'Your country (determines currency for products and shipping)',
              },
              // Default to Ghana - will be set on create via hook
              hooks: {
                beforeValidate: [
                  async ({ value, req }) => {
                    // If no country is set, default to Ghana
                    if (!value) {
                      const ghana = await req.payload.find({
                        collection: 'countries',
                        where: { code: { equals: 'GH' } },
                        limit: 1,
                      })
                      if (ghana.docs.length > 0) {
                        return ghana.docs[0].id
                      }
                    }
                    return value
                  },
                ],
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
          label: 'Styles',
          fields: [
            {
              name: 'styles',
              type: 'join',
              collection: 'styles',
              on: 'seller',
              admin: {
                description: 'Product styles listed by this seller',
                defaultColumns: ['title', 'department', 'category', 'createdAt'],
              },
            },
          ],
        },
        {
          label: 'Purchases',
          fields: [
            {
              name: 'purchases',
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
                defaultColumns: ['orderId', 'status', 'createdAt'],
              },
            },
          ],
        },
        {
          label: 'Favorites',
          fields: [
            {
              name: 'favorites',
              type: 'join',
              collection: 'favorites',
              on: 'user',
              admin: {
                description: 'Products favorited by this user',
                defaultColumns: ['product', 'createdAt'],
              },
            },
          ],
        },
        {
          label: 'Following',
          fields: [
            {
              name: 'following',
              type: 'join',
              collection: 'follows',
              on: 'follower',
              admin: {
                description: 'Users this person is following',
                defaultColumns: ['following', 'createdAt'],
              },
            },
          ],
        },
        {
          label: 'Followers',
          fields: [
            {
              name: 'followers',
              type: 'join',
              collection: 'follows',
              on: 'following',
              admin: {
                description: 'Users following this person',
                defaultColumns: ['follower', 'createdAt'],
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
        { label: 'To Be Archived', value: 'to-be-archived' },
        { label: 'Archived', value: 'archived' },
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
    {
      name: 'oauthProvider',
      type: 'select',
      options: [
        { label: 'Apple', value: 'apple' },
        { label: 'Google', value: 'google' },
      ],
      admin: {
        position: 'sidebar',
        description: 'OAuth provider used for sign in',
        readOnly: true,
      },
    },
    {
      name: 'oauthId',
      type: 'text',
      admin: {
        position: 'sidebar',
        description: 'OAuth provider user ID',
        readOnly: true,
      },
    },
  ],
  timestamps: true,
}
