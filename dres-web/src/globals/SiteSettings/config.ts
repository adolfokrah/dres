import type { GlobalConfig } from 'payload'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site Settings',
  access: {
    read: () => true, // Public read access
  },
  admin: {
    group: 'Settings',
  },
  fields: [
    {
      name: 'commissionRate',
      label: 'Commission Rate (%)',
      type: 'number',
      required: true,
      defaultValue: 10,
      min: 0,
      max: 100,
      admin: {
        description: 'The commission percentage charged on each sale (e.g., 10 for 10%)',
      },
    },
    {
      name: 'buyerProtectionFeeRate',
      label: 'Buyer Protection Fee Rate (%)',
      type: 'number',
      required: true,
      defaultValue: 8,
      min: 0,
      max: 100,
      admin: {
        description: 'The buyer protection fee as a percentage of the item price (e.g., 8 for 8%)',
      },
    },
  ],
}
