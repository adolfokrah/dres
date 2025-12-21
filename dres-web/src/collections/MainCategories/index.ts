import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const MainCategories: CollectionConfig = {
  slug: 'mainCategories',
  access: {
    read: () => true,
  },
  admin: {
    group: 'Ecommerce',
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'allowedVariants',
      type: 'relationship',
      relationTo: 'variantTypes',
      hasMany: true,
      admin: {
        description: 'Select which variant types (e.g., Size, Color) are allowed for products in this main category',
      },
    },
    slugField({
      position: undefined,
    }),
  ],
}
