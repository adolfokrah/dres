import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'

export const VariantTypesCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    group: 'Products',
  },
})
