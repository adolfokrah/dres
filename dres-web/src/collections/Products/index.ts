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
    beforeChange: [
      async ({ data }) => {
        // Auto-calculate selling price for product level (price + 10%)
        if (data?.price !== undefined && data?.price !== null) {
          data.sellingPrice = Math.round(data.price * 1.10 * 100) / 100
        }
        
        // Auto-calculate selling price for each variation (price + 10%)
        if (data?.variations && Array.isArray(data.variations)) {
          data.variations = data.variations.map((variation: { price?: number; sellingPrice?: number }) => {
            if (variation.price !== undefined && variation.price !== null) {
              variation.sellingPrice = Math.round(variation.price * 1.10 * 100) / 100 // Add 10% and round to 2 decimal places
            }
            return variation
          })
        }
        
        return data
      },
    ],
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
      name: 'price',
      type: 'number',
      required: true,
      admin: {
        description: 'Base price for this product (used when variation has no price)',
      },
    },
    {
      name: 'sellingPrice',
      type: 'number',
      admin: {
        description: 'Final selling price (auto-calculated: price + 10% platform fee)',
        readOnly: true,
      },
    },
    {
      type: 'collapsible',
      label: 'Product Attributes',
      admin: {
        initCollapsed: false,
        condition: (data) => Boolean(data?.category),
        description: 'Additional product details like Material, Fit, etc.',
      },
      fields: [
        {
          name: 'attributes',
          type: 'json',
          admin: {
            description: 'Select attributes that apply to this product (all optional)',
            components: {
              Field: '@/components/ProductAttributes#ProductAttributesField',
            },
          },
        },
      ],
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
          required: true,
          admin: {
            description: 'Your price for this variation',
          },
        },
        {
          name: 'sellingPrice',
          type: 'number',
          admin: {
            description: 'Final selling price (auto-calculated: price + 10% platform fee)',
            readOnly: true,
          },
        },
        {
          name: 'images',
          type: 'relationship',
          relationTo: 'media',
          hasMany: true,
          filterOptions: ({ siblingData, data }) => {
            // Get the product's images
            const productImages = data?.images as string[] | { id: string }[] | undefined
            if (productImages && Array.isArray(productImages) && productImages.length > 0) {
              const imageIds = productImages.map((img) => 
                typeof img === 'object' ? img.id : img
              )
              return {
                id: {
                  in: imageIds,
                },
              }
            }
            // If no product images, return empty filter (no options)
            return {
              id: {
                equals: 'no-images-available',
              },
            }
          },
          admin: {
            description: 'Select images from the product gallery for this variation',
          },
        },
      ],
    },
  ],
}
