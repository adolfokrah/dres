import type { CollectionConfig } from 'payload'
import { slugField } from 'payload'

export const VariantOptions: CollectionConfig = {
  slug: 'variantOptions',
  admin: {
    useAsTitle: 'label',
    group: 'Ecommerce',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'variantType',
      type: 'relationship',
      relationTo: 'variantTypes',
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    slugField({
      fieldToUse: 'label'
      
    }),
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      admin: {
        description: 'Select which categories this option applies to (e.g., W12 L42 for Bottoms only)',
      },
    },
  ],
}
