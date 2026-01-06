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
    {
      name: 'defaultShippingRate',
      label: 'Default Shipping Rate (GHS)',
      type: 'number',
      required: true,
      defaultValue: 30,
      min: 0,
      admin: {
        description: 'Default shipping fee in GHS when seller has not set up shipping rates',
      },
    },
    {
      type: 'collapsible',
      label: 'Rewards & Points',
      admin: {
        initCollapsed: false,
      },
      fields: [
        {
          name: 'pointsEarningRate',
          label: 'Points Earning Rate',
          type: 'number',
          required: true,
          defaultValue: 0.01,
          min: 0,
          max: 1,
          admin: {
            description: 'Points earned per 1 GHS spent (e.g., 0.01 = 1 point per 100 GHS, 0.1 = 1 point per 10 GHS)',
            step: 0.001,
          },
        },
        {
          name: 'pointsRedemptionRate',
          label: 'Points Redemption Rate (GHS per point)',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 0,
          admin: {
            description: 'How much 1 point is worth in GHS when redeeming (e.g., 1 = 1 point = 1 GHS discount)',
            step: 0.01,
          },
        },
        {
          name: 'pointsMultiplier',
          label: 'Points Multiplier',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 0,
          admin: {
            description: 'Bonus multiplier for points (e.g., 2 = double points promotion)',
            step: 0.1,
          },
        },
        {
          name: 'pointsEnabled',
          label: 'Points System Enabled',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description: 'Enable or disable the rewards points system',
          },
        },
      ],
    },
  ],
}
