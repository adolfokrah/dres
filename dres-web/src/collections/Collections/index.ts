import type { CollectionConfig } from 'payload'

export const Collections: CollectionConfig = {
  slug: 'collections',
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
    },
    {
      name: 'departments',
      type: 'relationship',
      relationTo: 'departments',
      hasMany: true,
      admin: {
        description: 'Departments that can use this collection',
      },
    },
    {
      name: 'categories',
      type: 'join',
      collection: 'categories',
      on: 'collections',
      admin: {
        description: 'Categories in this collection',
      }
    }
  ],
}
