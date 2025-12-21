import { slugField } from 'payload'
import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  access: {
    read: () => true,
  },
  admin: {
    useAsTitle: 'title',
    group: 'Ecommerce',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
    },
    {
      name: 'departments',
      type: 'relationship',
      relationTo: 'departments',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'mainCategories',
      type: 'relationship',
      relationTo: 'mainCategories',
      hasMany: true,
      admin: {
        position: 'sidebar',
      },
    },
    slugField({
      position: undefined,
    }),
  ],
}
