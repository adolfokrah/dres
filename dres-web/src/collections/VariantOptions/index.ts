import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

export const VariantOptionsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  fields: [
    ...(defaultCollection.fields || []),
    {
      name: 'mainCategories',
      type: 'relationship',
      relationTo: 'mainCategories',
      hasMany: true,
      admin: {
        description: 'Select which main categories this option applies to (e.g., W12 L42 for Bottoms only)',
      },
    },
  ],
})
