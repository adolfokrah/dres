import type { CollectionConfig, Where } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { generateVariationSlug } from './hooks/generateVariationSlug'
import { processProductMainImage } from './hooks/processProductMainImage'
import { trendingVariations } from './endpoints/trending'
import { newArrivals } from './endpoints/newArrivals'
import { featuredVariations } from './endpoints/featured'
import { recentlyViewedVariations } from './endpoints/recentlyViewed'
import { recordView } from './endpoints/recordView'
import { filteredVariations } from './endpoints/filtered'
import { getVariation } from './endpoints/getVariation'
import { getVariationSeller } from './endpoints/getVariationSeller'
import { getSimilarVariations } from './endpoints/getSimilarVariations'
import { getSellerVariations } from './endpoints/getSellerVariations'

interface VariantItem {
  variant?: string | { id: string }
  value?: string | { id: string }
}

export const Variations: CollectionConfig = {
  slug: 'variations',
  admin: {
    useAsTitle: 'title',
    group: 'Catalog',
    defaultColumns: ['title', 'style', 'images', 'variants'],
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
      path: '/new-arrivals',
      method: 'get',
      handler: newArrivals,
    },
    {
      path: '/featured',
      method: 'get',
      handler: featuredVariations,
    },
    {
      path: '/recently-viewed',
      method: 'get',
      handler: recentlyViewedVariations,
    },
    {
      path: '/filtered',
      method: 'get',
      handler: filteredVariations,
    },
    {
      path: '/:slug/details',
      method: 'get',
      handler: getVariation,
    },
    {
      path: '/:id/seller',
      method: 'get',
      handler: getVariationSeller,
    },
    {
      path: '/:id/similar',
      method: 'get',
      handler: getSimilarVariations,
    },
    {
      path: '/seller/:sellerId',
      method: 'get',
      handler: getSellerVariations,
    },
    {
      path: '/record-view',
      method: 'post',
      handler: recordView,
    },
  ],
  hooks: {
    beforeChange: [generateVariationSlug],
    afterChange: [processProductMainImage],
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
      name: 'style',
      type: 'relationship',
      relationTo: 'styles',
      required: true,
      admin: {
        description: 'The style this variation belongs to',
      },
    },
    {
      label: 'Attributes',
      name: 'variants',
      type: 'array',
      admin: {
        description: 'Variant options (e.g., Color: Red, Material: Leather)',
        components: {
          RowLabel: '@/collections/Variations/VariantRowLabel#VariantRowLabel',
        },
      },
      validate: (value) => {
        // Validate no duplicate attributes
        if (!value || !Array.isArray(value)) return true
        const attributeIds = (value as VariantItem[])
          .map((item) => {
            if (!item?.variant) return null
            return typeof item.variant === 'object' ? item.variant.id : item.variant
          })
          .filter(Boolean)
        const uniqueIds = new Set(attributeIds)
        if (uniqueIds.size !== attributeIds.length) {
          return 'Each attribute can only be used once per variation'
        }
        return true
      },
      fields: [
        {
          name: 'variant',
          type: 'relationship',
          relationTo: 'attributes',
          required: true,
          filterOptions: ({ data, siblingData }): Where => {
            // Get all already-selected attribute IDs from other items
            const variants = ((data as { variants?: VariantItem[] })?.variants || []) as VariantItem[]
            const currentVariant = (siblingData as VariantItem)?.variant
            const currentVariantId = currentVariant 
              ? (typeof currentVariant === 'object' ? currentVariant.id : currentVariant)
              : null
            
            const usedAttributeIds = variants
              .map((item) => {
                if (!item?.variant) return null
                return typeof item.variant === 'object' ? item.variant.id : item.variant
              })
              .filter((id): id is string => id !== null && id !== currentVariantId)
            
            // Only show attributes with level = 'variation' and not already used
            const filter: Where = {
              level: { equals: 'variation' },
            }
            
            if (usedAttributeIds.length > 0) {
              filter.id = { not_in: usedAttributeIds }
            }
            
            return filter
          },
          admin: {
            description: 'Select the attribute type (e.g., Color, Material)',
          },
        },
        {
          name: 'value',
          type: 'relationship',
          relationTo: 'attributeOptions',
          required: true,
          filterOptions: ({ siblingData }) => {
            const data = siblingData as VariantItem
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
              const data = siblingData as VariantItem
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
      required: false, // Not required so sellers can add images later in the mobile app
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
    {
      name: 'stats',
      type: 'join',
      collection: 'variation-stats',
      on: 'variation',
      admin: {
        description: 'Stats for this variation',
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        {
          label: 'Active',
          value: 'active',
        },
        {
          label: 'Archived',
          value: 'archived',
        },
      ],
      defaultValue: 'active',
    }
  ],
}
