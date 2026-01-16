import type { Field } from 'payload'
import { link } from './link'

// Recursive nested menu field configuration
export const nestedMenuItems: Field = {
  name: 'subItems',
  type: 'array',
  label: 'Sub Menu Items',
  admin: {
    description: 'Add nested submenu items (supports unlimited nesting)',
    initCollapsed: true,
  },
  fields: [
    {
      name: 'label',
      type: 'text',
      required: true,
      admin: {
        description: 'The text displayed for this menu item',
      },
    },
    link({
      appearances: false,
      overrides: {
        name: 'link',
      },
    }),
    {
      name: 'featured',
      type: 'checkbox',
      label: 'Featured Item',
      defaultValue: false,
      admin: {
        description: 'Highlight this item (bold/prominent in mega menu)',
      },
    },
    // Self-referencing for nested submenus
    // This creates unlimited nesting capability
    {
      name: 'subItems',
      type: 'array',
      label: 'Nested Sub Items',
      admin: {
        description: 'Add even deeper nested items',
        initCollapsed: true,
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
        },
        link({
          appearances: false,
          overrides: {
            name: 'link',
          },
        }),
      ],
    },
  ],
}
