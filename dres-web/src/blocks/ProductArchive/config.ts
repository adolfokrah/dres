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
      name: 'showSeeAll',
      type: 'checkbox',
      required: false,
      defaultValue: true,
      admin: {
        description: 'Show the "See all" button',
      },
    },
    {
      name: 'seeAllText',
      type: 'text',
      required: false,
      defaultValue: 'See all',
      admin: {
        description: 'Text for the "See all" button',
        condition: (data, siblingData) => siblingData?.showSeeAll === true,
      },
    },
    {
      name: 'department',
      type: 'select',
      required: false,
      options: [
        {
          label: 'Men',
          value: 'men',
        },
        {
          label: 'Women',
          value: 'women',
        },
        {
          label: 'Kids',
          value: 'kids',
        },
      ],
      admin: {
        description: 'Filter products by department (uses slug). Leave empty to use user preference.',
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
