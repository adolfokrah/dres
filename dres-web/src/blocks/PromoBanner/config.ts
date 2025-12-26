import type { Block } from 'payload'

import { link } from '../../fields/link'

export const PromoBanner: Block = {
  slug: 'promoBanner',
  interfaceName: 'PromoBannerBlock',
  labels: {
    singular: 'Promo Banner',
    plural: 'Promo Banners',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Main headline, e.g. "First Time?"',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      required: true,
      admin: {
        description: 'Supporting text, e.g. "Shop: 10% off with code WELCOMEVC..."',
      },
    },
    {
      name: 'actionText',
      type: 'text',
      required: true,
      defaultValue: 'Get started',
      admin: {
        description: 'CTA button text',
      },
    },
    link({
      appearances: false,
      overrides: {
        name: 'actionLink',
        label: 'Action Link',
        admin: {
          description: 'Where the CTA button links to',
        },
      },
    }),
    {
      name: 'backgroundColor',
      type: 'select',
      defaultValue: 'light',
      options: [
        { label: 'Light Gray', value: 'light' },
        { label: 'White', value: 'white' },
        { label: 'Info (Blue)', value: 'info' },
        { label: 'Success (Green)', value: 'success' },
        { label: 'Warning (Yellow)', value: 'warning' },
        { label: 'Error (Red)', value: 'error' },
      ],
    },
  ],
}
