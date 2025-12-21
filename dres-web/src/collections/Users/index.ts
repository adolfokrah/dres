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
          label: 'International Info',
          fields: [
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
            {
              name: 'currency',
              type: 'select',
              defaultValue: 'USD',
              options: [
                { label: 'US Dollar (USD)', value: 'USD' },
                { label: 'Euro (EUR)', value: 'EUR' },
                { label: 'British Pound (GBP)', value: 'GBP' },
                { label: 'Japanese Yen (JPY)', value: 'JPY' },
                { label: 'Canadian Dollar (CAD)', value: 'CAD' },
                { label: 'Australian Dollar (AUD)', value: 'AUD' },
                { label: 'Swiss Franc (CHF)', value: 'CHF' },
                { label: 'Chinese Yuan (CNY)', value: 'CNY' },
                { label: 'Indian Rupee (INR)', value: 'INR' },
                { label: 'Ghana Cedi (GHS)', value: 'GHS' },
                { label: 'Nigerian Naira (NGN)', value: 'NGN' },
              ],
            },
            {
              name: 'country',
              type: 'select',
              options: [
                { label: 'United States', value: 'US' },
                { label: 'United Kingdom', value: 'GB' },
                { label: 'Canada', value: 'CA' },
                { label: 'Australia', value: 'AU' },
                { label: 'Germany', value: 'DE' },
                { label: 'France', value: 'FR' },
                { label: 'Italy', value: 'IT' },
                { label: 'Spain', value: 'ES' },
                { label: 'Netherlands', value: 'NL' },
                { label: 'Japan', value: 'JP' },
                { label: 'China', value: 'CN' },
                { label: 'India', value: 'IN' },
                { label: 'Ghana', value: 'GH' },
                { label: 'Nigeria', value: 'NG' },
                { label: 'South Africa', value: 'ZA' },
                { label: 'Brazil', value: 'BR' },
                { label: 'Mexico', value: 'MX' },
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
  ],
  timestamps: true,
}
