import type { CollectionConfig, Where } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { generateSKUTitle } from './hooks/generateSKUTitle'

interface SKUOptionItem {
  option?: string | { id: string }
  value?: string | { id: string }
}

export const SKUs: CollectionConfig = {
  slug: 'skus',
  admin: {
    group: 'Ecommerce',
    defaultColumns: ['title', 'variation', 'skuOptions', 'price', 'stock', 'updatedAt'],
    description: 'SKUs - inventory tracking with pricing for each variation',
    useAsTitle: 'title',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeChange: [
      // Calculate selling price (price + 10% platform fee)
      async ({ data }) => {
        if (data?.price !== undefined) {
          data.sellingPrice = Math.round(data.price * 1.1 * 100) / 100
        }
        return data
      },
      // Generate SKU code if not provided
      async ({ data, operation }) => {
        if (operation === 'create' && !data?.sku) {
          data.sku = `SKU-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
        }
        return data
      },
      // Generate title from variation options + sku options + price
      generateSKUTitle,
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      admin: {
        hidden: true,
        readOnly: true,
      },
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'Unique SKU code (auto-generated if empty)',
      },
    },
    {
      name: 'variation',
      type: 'relationship',
      relationTo: 'variations',
      required: true,
      admin: {
        description: 'The variation this SKU belongs to',
      },
      index: true,
    },
    {
      name: 'skuOptions',
      type: 'array',
      admin: {
        description: 'SKU options (e.g., Size: M)',
        components: {
          RowLabel: '@/collections/SKUs/SKUOptionRowLabel#SKUOptionRowLabel',
        },
      },
      validate: (value) => {
        // Validate no duplicate attributes
        if (!value || !Array.isArray(value)) return true
        const attributeIds = (value as SKUOptionItem[])
          .map((item) => {
            if (!item?.option) return null
            return typeof item.option === 'object' ? item.option.id : item.option
          })
          .filter(Boolean)
        const uniqueIds = new Set(attributeIds)
        if (uniqueIds.size !== attributeIds.length) {
          return 'Each attribute can only be used once per SKU'
        }
        return true
      },
      maxRows: 1,
      fields: [
        {
          name: 'option',
          type: 'relationship',
          relationTo: 'attributes',
          required: true,
          filterOptions: ({ data, siblingData }): Where => {
            // Get all already-selected attribute IDs from other items
            const skuOptions = ((data as { skuOptions?: SKUOptionItem[] })?.skuOptions || []) as SKUOptionItem[]
            const currentOption = (siblingData as SKUOptionItem)?.option
            const currentOptionId = currentOption 
              ? (typeof currentOption === 'object' ? currentOption.id : currentOption)
              : null
            
            const usedAttributeIds = skuOptions
              .map((item) => {
                if (!item?.option) return null
                return typeof item.option === 'object' ? item.option.id : item.option
              })
              .filter((id): id is string => id !== null && id !== currentOptionId)
            
            // Only show attributes with level = 'sku' and not already used
            const filter: Where = {
              level: { equals: 'sku' },
            }
            
            if (usedAttributeIds.length > 0) {
              filter.id = { not_in: usedAttributeIds }
            }
            
            return filter
          },
          admin: {
            description: 'Select the attribute type (e.g., Size)',
          },
        },
        {
          name: 'value',
          type: 'relationship',
          relationTo: 'attributeOptions',
          required: true,
          filterOptions: ({ siblingData }) => {
            const data = siblingData as { option?: string | { id: string } }
            const optionId = data?.option
            if (optionId) {
              return {
                attribute: {
                  equals: typeof optionId === 'object' ? optionId.id : optionId,
                },
              }
            }
            return true
          },
          admin: {
            description: 'Select the value for this attribute',
            condition: (_, siblingData) => {
              const data = siblingData as { option?: string }
              return Boolean(data?.option)
            },
          },
        },
      ],
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Base price for this SKU',
      },
    },
    {
      name: 'sellingPrice',
      type: 'number',
      admin: {
        description: 'Final selling price (auto-calculated: price + platform fee)',
        readOnly: true,
      },
    },
    {
      name: 'compareAtPrice',
      type: 'number',
      min: 0,
      admin: {
        description: 'Original price before discount (shows as crossed out)',
      },
    },
    {
      name: 'stock',
      type: 'number',
      min: 0,
      defaultValue: 0,
      admin: {
        description: 'Available quantity (0 = sold out)',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this SKU is available for purchase',
      },
    },
    {
      name: 'barcode',
      type: 'text',
      admin: {
        description: 'Barcode/UPC for this SKU',
      },
    },
    {
      name: 'weight',
      type: 'number',
      min: 0,
      admin: {
        description: 'Weight in grams (for shipping calculations)',
      },
    },
  ],
  timestamps: true,
}
