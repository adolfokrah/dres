import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { generateVariationSlug } from './hooks/generateVariationSlug'
import { trendingVariations } from './endpoints/trending'
import { recordView } from './endpoints/recordView'

export const Variations: CollectionConfig = {
  slug: 'variations',
  admin: {
    useAsTitle: 'slug',
    group: 'Ecommerce',
    defaultColumns: ['style', 'images', 'variants', 'slug'],
    description: 'Product variations - specific color/size combinations',
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  endpoints: [
    {
      path: '/trending',
      method: 'get',
      handler: trendingVariations,
    },
    {
      path: '/record-view',
      method: 'post',
      handler: recordView,
    },
  ],
  hooks: {
    beforeChange: [generateVariationSlug],
  },
  fields: [
    {
      name: 'style',
      type: 'relationship',
      relationTo: 'styles',
      required: true,
      admin: {
        description: 'The style this variation belongs to',
      },
    },
    {
      name: 'variants',
      type: 'array',
      admin: {
        description: 'Variant options (e.g., Color: Red, Size: Large)',
        components: {
          RowLabel: '@/collections/Variations/VariantRowLabel#VariantRowLabel',
        },
      },
      fields: [
        {
          name: 'variant',
          type: 'relationship',
          relationTo: 'attributes',
          required: true,
          admin: {
            description: 'Select the attribute type (e.g., Color, Size)',
          },
        },
        {
          name: 'value',
          type: 'relationship',
          relationTo: 'attributeOptions',
          required: true,
          filterOptions: ({ siblingData }) => {
            const data = siblingData as { variant?: string | { id: string } }
            const variantId = data?.variant
            if (variantId) {
              return {
                attribute: {
                  equals: typeof variantId === 'object' ? variantId.id : variantId,
                },
              }
            }
            return true
          },
          admin: {
            description: 'Select the value for this attribute',
            condition: (_, siblingData) => {
              const data = siblingData as { variant?: string }
              return Boolean(data?.variant)
            },
          },
        },
      ],
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      admin: {
        description: 'Variation images (first image is the main image)',
        components: {
          Cell: '@/components/ImageCell#ImageCell',
        },
      },
    },
    {
      name: 'skus',
      type: 'join',
      collection: 'skus',
      on: 'variation',
      admin: {
        description: 'SKUs for this variation (inventory & pricing)',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly slug',
        readOnly: true,
      },
    },
  ],
}
