import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

// Helper to create a unique key from variation options
const getVariationKey = (options: Record<string, number | null> | null | undefined): string => {
  if (!options || typeof options !== 'object') return ''
  // Sort keys to ensure consistent comparison
  const sortedEntries = Object.entries(options)
    .filter(([, value]) => value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(sortedEntries)
}

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    group: 'Ecommerce',
    defaultColumns: ['title', 'brand', 'category', 'seller'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        const variations = data?.variations as Array<{ options?: Record<string, number | null> }> | undefined
        
        if (!variations || !Array.isArray(variations) || variations.length <= 1) {
          return data
        }

        const seenVariations = new Map<string, number>()

        for (let i = 0; i < variations.length; i++) {
          const variation = variations[i]
          const options = variation?.options
          const key = getVariationKey(options)

          if (key) {
            const existingIndex = seenVariations.get(key)
            if (existingIndex !== undefined) {
              // Build a readable description of the duplicate options
              const optionsList = options
                ? Object.entries(options)
                    .filter(([, val]) => val !== null)
                    .map(([name]) => name)
                    .join(', ')
                : 'unknown options'

              throw new APIError(
                `Duplicate variation found! Variation ${i + 1} has the same options as Variation ${existingIndex + 1} (${optionsList}). Please ensure each variation has a unique combination of options.`,
                400
              )
            }
            seenVariations.set(key, i)
          }
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      admin: {
        description: 'Product images (first image is the main image)',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
    },
    {
      name: 'brand',
      type: 'relationship',
      relationTo: 'brands',
      required: true,
      admin: {
        description: 'Select a category first to filter available brands',
        condition: (data) => Boolean(data?.category),
      },
    },
    {
      name: 'seller',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        description: 'The user selling this product',
      },
    },
    {
      name: 'condition',
      type: 'select',
      required: true,
      options: [
        { label: 'New with tags', value: 'new_with_tags' },
        { label: 'New without tags', value: 'new_without_tags' },
        { label: 'Like new', value: 'like_new' },
        { label: 'Good', value: 'good' },
        { label: 'Fair', value: 'fair' },
      ],
      admin: {
        description: 'The condition of the product',
      },
    },
    {
      name: 'material',
      type: 'relationship',
      relationTo: 'materials',
      filterOptions: ({ data }) => {
        const category = data?.category as string | { id: string } | undefined
        if (category) {
          return {
            categories: {
              contains: typeof category === 'object' ? category.id : category,
            },
          }
        }
        return true
      },
      admin: {
        description: 'Main material of the product',
        condition: (data) => Boolean(data?.category),
      },
    },
    {
      name: 'variations',
      type: 'array',
      admin: {
        description: 'Product variations with different options, prices, and images',
        condition: (data) => Boolean(data?.category),
        components: {
          RowLabel: '@/collections/Products/VariationRowLabel#VariationRowLabel',
        },
      },
      fields: [
        {
          name: 'options',
          type: 'json',
          admin: {
            components: {
              Field: '@/components/VariationOptions#VariationOptionsField',
            },
            description: 'Select options for each variant type',
          },
        },
        {
          name: 'price',
          type: 'number',
          admin: {
            description: 'Override price for this variation (optional)',
          },
        },
        {
          name: 'images',
          type: 'relationship',
          relationTo: 'media',
          hasMany: true,
          admin: {
            description: 'Specific images for this variation (optional)',
          },
        },
      ],
    },
  ],
}
