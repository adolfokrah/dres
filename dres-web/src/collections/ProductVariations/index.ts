import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { validateUniqueVariation } from './hooks/validateUniqueVariation'

export const ProductVariations: CollectionConfig = {
  slug: 'product-variations',
  admin: {
    group: 'Ecommerce',
    defaultColumns: ['options', 'images', 'product', 'price', 'stock', 'updatedAt'],
    description: 'Product variations with specific options, pricing, and inventory',
    useAsTitle: 'title',
  },
  access: {
    read: anyone,
    create: authenticated,
    update: authenticated,
    delete: authenticated,
  },
  hooks: {
    beforeValidate: [validateUniqueVariation],
    beforeChange: [
      // Calculate selling price (price + 10% platform fee)
      async ({ data }) => {
        if (data?.price !== undefined) {
          data.sellingPrice = Math.round(data.price * 1.1 * 100) / 100
        }
        return data
      },
      // Generate title from options
      async ({ data, req }) => {
        if (!data?.options || !Array.isArray(data.options) || data.options.length === 0) {
          return data
        }

        const optionIds = data.options.map((opt: string | { id: string }) =>
          typeof opt === 'object' ? opt.id : opt
        )

        try {
          const options = await req.payload.find({
            collection: 'attributeOptions',
            where: { id: { in: optionIds } },
            depth: 0,
            limit: 20,
          })

          const names = options.docs.map((opt) => opt.name).filter(Boolean)
          data.title = names.length > 0 ? names.join(', ') : 'Variation'
        } catch {
          data.title = 'Variation'
        }

        return data
      },
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
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      admin: {
        description: 'The product this variation belongs to',
      },
      index: true,
    },
    {
      name: 'options',
      type: 'relationship',
      relationTo: 'attributeOptions',
      hasMany: true,
      required: true,
      admin: {
        description: 'Select one option per variant type (e.g., Size: M, Color: Red)',
        components: {
          Field: '@/collections/ProductVariations/VariationOptionsField#VariationOptionsField',
        },
      },
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Base price for this variation',
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
      admin: {
        description: 'Available quantity (0 = sold out, empty = unlimited)',
      },
    },
    {
      name: 'images',
      type: 'relationship',
      relationTo: 'media',
      hasMany: true,
      admin: {
        description: 'Select images from the product gallery for this variation',
        condition: (data, siblingData) => Boolean(siblingData?.product),
        components: {
          Field: '@/collections/ProductVariations/VariationImagesField#VariationImagesField',
          Cell: '@/components/ImageCell#ImageCell',
        },
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Whether this variation is available for purchase',
      },
    },
  ],
  timestamps: true,
}
