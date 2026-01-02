import type { CollectionConfig } from 'payload'

import { anyone } from '../../access/anyone'
import { authenticated } from '../../access/authenticated'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  admin: {
    useAsTitle: 'category',
    group: 'Catalog',
    defaultColumns: ['category', 'departments', 'collections'],
  },
  fields: [
    {
      name: 'category',
      type: 'text',
      required: true,
    },
    {
      name: 'collections',
      type: 'relationship',
      relationTo: 'collections',
      hasMany: true,
      admin: {
        description: 'Select which collections this falls under (e.g., Dresses, Bottoms, Shoes)',
      },
    },

    {
      name: 'departments',
      type: 'relationship',
      relationTo: 'departments',
      hasMany: true,
      admin: {
        description: 'Select which departments this category belongs to',
      },
    },
    {
      name: 'brands',
      type: 'relationship',
      relationTo: 'brands',
      hasMany: true,
      admin: {
        description: 'Select which brands are available in this category',
      },
    },
    {
      name: 'attributes',
      type: 'relationship',
      relationTo: 'attributes',
      hasMany: true,
      admin: {
        description: 'Attributes available for products in this category (e.g., Fit, Material, Style)',
      },
    },
    {
      name: 'variantAttributes',
      type: 'relationship',
      relationTo: 'attributes',
      hasMany: true,
      filterOptions: ({ data }) => {
        // Only show attributes that are selected in the attributes field above
        const selectedAttributes = data?.attributes as string[] | { id: string }[] | undefined
        if (selectedAttributes && Array.isArray(selectedAttributes) && selectedAttributes.length > 0) {
          const attributeIds = selectedAttributes.map((attr) =>
            typeof attr === 'object' ? attr.id : attr
          )
          return {
            id: {
              in: attributeIds,
            },
          }
        }
        // If no attributes selected, show nothing
        return {
          id: {
            equals: 'no-attributes-selected',
          },
        }
      },
      admin: {
        description: 'Attributes used as variation types (e.g., Size, Color) - select from attributes above',
      },
    },
    {
      name: 'variationStats',
      type: 'join',
      collection: 'variation-stats',
      on: 'category',
      admin: {
        description: 'Variation stats for this category (for top variations, sellers, brands)',
      },
    },
  ],
}
