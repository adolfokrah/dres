import type { CollectionConfig } from 'payload'

export const Collections: CollectionConfig = {
  slug: 'collections',
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
