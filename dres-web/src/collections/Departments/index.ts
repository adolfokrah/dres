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
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'URL-friendly identifier (e.g., "men", "women")',
      },
      hooks: {
        beforeValidate: [
          ({ value, data }) => {
            // Auto-generate slug from name if not provided
            if (!value && data?.name) {
              return data.name.toLowerCase().replace(/\s+/g, '-')
            }
            return value
          },
        ],
      },
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
