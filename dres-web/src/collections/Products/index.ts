import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'
import { calculateSellingPrices } from './hooks/calculateSellingPrices'
import { validateUniqueVariations } from './hooks/validateUniqueVariations'
import { validateRequiredVariations } from './hooks/validateRequiredVariations'
import { processProductMainImage } from './hooks/processProductMainImage'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'title',
    group: 'Ecommerce',
    defaultColumns: ['title', 'images',  'brand', 'category', 'seller'],
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  hooks: {
    beforeChange: [calculateSellingPrices],
    beforeValidate: [validateUniqueVariations, validateRequiredVariations],
    afterChange: [processProductMainImage],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    slugField(),
    {
      name: 'description',
      type: 'richText',
    },
    {
      name: 'isResell',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Whether this product is a resell from a returned item (e.g., from a thrift store)',
      },
    },
    {
      name: 'images',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      required: true,
      admin: {
        description: 'Product images (first image is the main image)',
        components: {
          Cell: '@/components/ImageCell#ImageCell',
        },
      },
    },
    {
      name: 'department',
      type: 'relationship',
      relationTo: 'departments',
      required: true,
      admin: {
        description: 'Select a department first to filter available categories',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      filterOptions: ({ data }) => {
        const departmentId = data?.department
        if (departmentId) {
          return {
            departments: {
              contains: typeof departmentId === 'object' ? departmentId.id : departmentId,
            },
          }
        }
        return true
      },
      admin: {
        description: 'Select a department first to filter available categories',
        condition: (data) => Boolean(data?.department),
      },
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
        description: 'Current price for this product',
      },
    },
    {
      name: 'compareAtPrice',
      type: 'number',
      admin: {
        description: 'Original price before discount (shows as crossed out, e.g., "Was $500")',
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
      name: 'stock',
      type: 'number',
      min: 0,
      admin: {
        description: 'Available quantity (0 = sold out). Leave empty for unlimited stock.',
        components: {
          Field: '@/collections/Products/ProductStockField#ProductStockField',
        },
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
      type: 'join',
      collection: 'product-variations',
      on: 'product',
      admin: {
        description: 'Product variations with different options, prices, and inventory',
        allowCreate: true,
        defaultColumns: ['images','options', 'price', 'sellingPrice', 'compareAtPrice',  'stock', 'updatedAt'],
      },
    },
    {
      name: 'boosts',
      type: 'join',
      collection: 'product-boosts',
      on: 'product',
      admin: {
        description: 'Boost history for this product',
        defaultColumns: ['tier', 'status', 'startDate', 'endDate', 'createdAt'],
      },
    },
    {
      name: 'stats',
      type: 'join',
      collection: 'product-stats',
      on: 'product',
      admin: {
        description: 'Sales statistics for this product',
        defaultColumns: ['totalSales', 'totalOrders', 'totalItemsSold', 'lastSaleAt'],
      },
    },
    {
      name: 'reviews',
      type: 'join',
      collection: 'reviews',
      on: 'product',
      admin: {
        description: 'Customer reviews for this product',
        defaultColumns: ['user', 'review', 'rating', 'createdAt'],
      },
    },
  ],
}
