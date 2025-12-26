import type { Block } from 'payload'

export const FeaturedGrid: Block = {
  slug: 'featuredGrid',
  interfaceName: 'FeaturedGridBlock',
  labels: {
    singular: 'Featured Grid',
    plural: 'Featured Grids',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Section title, e.g. "Shop by Category"',
      },
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      minRows: 1,
      maxRows: 12,
      admin: {
        description: 'Grid items with image and label',
      },
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            description: 'Text shown below the image, e.g. "CLOTHING"',
          },
        },
        {
          name: 'link',
          type: 'text',
          admin: {
            description: 'URL to navigate to when clicked, e.g. "/categories/clothing"',
          },
        },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '3',
      options: [
        { label: '2 Columns', value: '2' },
        { label: '3 Columns', value: '3' },
        { label: '4 Columns', value: '4' },
      ],
      admin: {
        description: 'Number of columns on desktop',
      },
    },
    {
      name: 'aspectRatio',
      type: 'select',
      defaultValue: 'square',
      options: [
        { label: 'Square (1:1)', value: 'square' },
        { label: 'Portrait (3:4)', value: 'portrait' },
        { label: 'Landscape (4:3)', value: 'landscape' },
      ],
    },
  ],
}
