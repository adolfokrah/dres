import type { GlobalConfig } from 'payload'

import { link } from '@/fields/link'
import { revalidateHeader } from './hooks/revalidateHeader'

export const Header: GlobalConfig = {
  slug: 'header',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'navItems',
      type: 'array',
      label: 'Navigation Items',
      admin: {
        description: 'Main navigation menu items that appear in the header',
        initCollapsed: true,
        components: {
          RowLabel: '@/Header/RowLabel#RowLabel',
        },
      },
      fields: [
        {
          name: 'label',
          type: 'text',
          required: true,
          admin: {
            description: 'The text displayed in the navigation',
          },
        },
        {
          name: 'highlighted',
          type: 'checkbox',
          label: 'Highlight (Red)',
          defaultValue: false,
          admin: {
            description: 'Display this nav item in red (e.g., for Sale)',
          },
        },
        link({
          appearances: false,
          disableLabel: true,
          overrides: {
            name: 'link',
          },
        }),
        // Nested submenu items with unlimited depth
        {
          name: 'subItems',
          type: 'array',
          label: 'Sub Menu Items',
          admin: {
            description: 'Add dropdown submenu items (supports unlimited nesting)',
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
              disableLabel: true,
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
                description: 'Highlight this item (bold/prominent in dropdown)',
              },
            },
            // Level 2 nesting
            {
              name: 'subItems',
              type: 'array',
              label: 'Nested Sub Items',
              admin: {
                description: 'Add deeper nested items (Level 2)',
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
                  disableLabel: true,
                  overrides: {
                    name: 'link',
                  },
                }),
                // Level 3 nesting
                {
                  name: 'subItems',
                  type: 'array',
                  label: 'Deeply Nested Items',
                  admin: {
                    description: 'Add even deeper nested items (Level 3)',
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
                      disableLabel: true,
                      overrides: {
                        name: 'link',
                      },
                    }),
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
}
