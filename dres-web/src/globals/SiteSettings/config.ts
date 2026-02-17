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
      name: 'minOrderValue',
      label: 'Minimum Order Value (GHS)',
      type: 'number',
      required: true,
      defaultValue: 30,
      min: 0,
      admin: {
        description: 'Minimum subtotal required to place an order (excludes shipping and BP fees)',
      },
    },
    {
      name: 'buyerProtectionFeeRate',
      label: 'Buyer Protection Fee Rate (%)',
      type: 'number',
      required: true,
      defaultValue: 4,
      min: 0,
      max: 100,
      admin: {
        description: 'The buyer protection fee as a percentage of item total (price × quantity). e.g., 4 for 4%',
      },
    },
    {
      name: 'refundTransactionFeeRate',
      label: 'Refund Transaction Fee Rate (%)',
      type: 'number',
      required: true,
      defaultValue: 5,
      min: 0,
      max: 100,
      admin: {
        description: 'Fee deducted from refunds when customer has no buyer protection (e.g., 5 for 5%)',
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
    {
      type: 'collapsible',
      label: 'Withdrawal Fees',
      admin: {
        initCollapsed: false,
        description: 'Configure transfer fees for withdrawals per country and payment method',
      },
      fields: [
        {
          name: 'withdrawalFees',
          label: 'Country Withdrawal Fees',
          type: 'array',
          admin: {
            description: 'Set withdrawal transfer fees per country. If a country is not listed, the default fee of 1 GHS will be used.',
          },
          fields: [
            {
              name: 'country',
              type: 'relationship',
              relationTo: 'countries',
              required: true,
              admin: {
                description: 'Country to apply these fees to',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'mobileMoneyFee',
                  label: 'Mobile Money Transfer Fee',
                  type: 'number',
                  required: true,
                  defaultValue: 1,
                  min: 0,
                  admin: {
                    description: 'Fixed fee for mobile money withdrawals (in local currency)',
                    width: '50%',
                  },
                },
                {
                  name: 'bankTransferFee',
                  label: 'Bank Transfer Fee',
                  type: 'number',
                  required: true,
                  defaultValue: 5,
                  min: 0,
                  admin: {
                    description: 'Fixed fee for bank account withdrawals (in local currency)',
                    width: '50%',
                  },
                },
              ],
            },
          ],
        },
        {
          name: 'defaultMobileMoneyFee',
          label: 'Default Mobile Money Fee',
          type: 'number',
          required: true,
          defaultValue: 1,
          min: 0,
          admin: {
            description: 'Default mobile money transfer fee when country is not configured (in GHS)',
          },
        },
        {
          name: 'defaultBankTransferFee',
          label: 'Default Bank Transfer Fee',
          type: 'number',
          required: true,
          defaultValue: 5,
          min: 0,
          admin: {
            description: 'Default bank transfer fee when country is not configured (in GHS)',
          },
        },
        {
          name: 'minimumWithdrawalAmount',
          label: 'Minimum Withdrawal Amount',
          type: 'number',
          required: true,
          defaultValue: 5,
          min: 1,
          admin: {
            description: 'Minimum amount required to withdraw (in GHS). User balance must be at least this amount.',
          },
        },
      ],
    },
  ],
}
