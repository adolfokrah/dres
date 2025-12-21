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
    slugField({
      position: undefined,
    }),
  ],
}
