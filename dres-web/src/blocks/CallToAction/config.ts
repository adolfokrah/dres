import type { Block } from 'payload'

export const CallToAction: Block = {
  slug: 'cta',
  interfaceName: 'CallToActionBlock',
  fields: [
    {
      name: 'style',
      type: 'select',
      defaultValue: 'image',
      options: [
        {
          label: 'Image-based CTA',
          value: 'image',
        },
      ],
      admin: {
        description: 'Choose the CTA style',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Background image for the CTA',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'Main heading text (e.g., "Interested in Womenswear?")',
      },
    },
    {
      name: 'buttonText',
      type: 'text',
      required: true,
      defaultValue: 'Update preference',
      admin: {
        description: 'Text for the action button',
      },
    },
    {
      name: 'buttonLink',
      type: 'text',
      required: true,
      admin: {
        description: 'URL or path for the button action',
      },
    },
  ],
  labels: {
    plural: 'Calls to Action',
    singular: 'Call to Action',
  },
}
