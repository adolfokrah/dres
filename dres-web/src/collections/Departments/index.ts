import type { CollectionConfig } from 'payload'

export const Departments: CollectionConfig = {
  slug: 'departments',
  admin: {
    useAsTitle: 'name',
    group: 'Catalog',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'categories',
      type: 'join',
      collection: 'categories',
      on: 'departments',
      admin: {
        description: 'Categories in this department',
        defaultColumns: ['collections', 'title'],
      },
    },
  ],
}
