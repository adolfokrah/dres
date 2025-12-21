import type { CollectionConfig } from 'payload'

export const VariantTypes: CollectionConfig = {
  slug: 'variantTypes',
  admin: {
    useAsTitle: 'name',
    group: 'Ecommerce',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
    },
    {
      name: 'options',
      type: 'join',
      collection: 'variantOptions',
      on: 'variantType',
      admin: {
        description: 'Options for this variant type',
        defaultColumns: ['label', 'slug', 'categories'],
      },
    },
  ],
}
