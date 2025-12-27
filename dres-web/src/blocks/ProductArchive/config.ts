import type { Block } from 'payload'

export const ProductArchiveBlock: Block = {
  slug: 'productArchive',
  interfaceName: 'ProductArchiveBlock',
  labels: {
    singular: 'Product Archive',
    plural: 'Product Archives',
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      defaultValue: 'Recently Viewed',
      admin: {
        description: 'The heading for this product section',
      },
    },
    {
      name: 'queryType',
      type: 'select',
      required: true,
      defaultValue: 'trending',
      options: [
        {
          label: 'Trending',
          value: 'trending',
        },
        {
          label: 'New Arrivals',
          value: 'new-arrivals',
        },
        {
          label: 'Recently Viewed',
          value: 'recently-viewed',
        },
        {
          label: 'Featured',
          value: 'featured',
        },
      ],
      admin: {
        description: 'Type of products to display',
      },
    },
    {
      name: 'seeAllLink',
      type: 'text',
      required: false,
      defaultValue: '/shop',
      admin: {
        description: 'URL for the "See all" button',
      },
    },
    {
      name: 'seeAllText',
      type: 'text',
      required: false,
      defaultValue: 'See all',
      admin: {
        description: 'Text for the "See all" button',
      },
    },
    {
      name: 'department',
      type: 'select',
      required: false,
      options: [
        {
          label: 'Men',
          value: '694eee871a36e6d75fbb15af',
        },
        {
          label: 'Women',
          value: '694eee871a36e6d75fbb15b1',
        },
        {
          label: 'Kids',
          value: '694eee871a36e6d75fbb15b3',
        },
      ],
      admin: {
        description: 'Filter products by department',
      },
    },
    {
      name: 'limit',
      type: 'number',
      required: false,
      defaultValue: 8,
      min: 1,
      max: 20,
      admin: {
        description: 'Number of products to display',
      },
    },
  ],
}
