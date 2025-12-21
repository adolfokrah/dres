import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import type { Field, FieldHook } from 'payload'

// Hook to auto-generate value from label (lowercase, spaces replaced with -)
const generateValueFromLabel: FieldHook = ({ data, value, operation }) => {
  // Only auto-generate if no value is set or on create
  if (operation === 'create' || !value) {
    if (data?.label && typeof data.label === 'string') {
      return data.label
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // Replace spaces with -
        .replace(/[^a-z0-9-]/g, '') // Remove special characters
    }
  }
  return value
}

export const VariantOptionsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  admin: {
    ...defaultCollection.admin,
    group: 'Products',
  },
  fields: [
    // Override default fields to make variantType editable
    ...(defaultCollection.fields || []).map((field) => {
      if ('name' in field && field.name === 'variantType') {
        return {
          ...field,
          admin: {
            ...('admin' in field ? field.admin : {}),
            readOnly: false, // Make it editable
          },
        }
      }
      // Auto-generate value from label
      if ('name' in field && field.name === 'value') {
        return {
          ...field,
          hooks: {
            ...('hooks' in field ? field.hooks : {}),
            beforeChange: [
              ...('hooks' in field && field.hooks?.beforeChange ? field.hooks.beforeChange : []),
              generateValueFromLabel,
            ],
          },
        }
      }
      return field
    }) as Field[],
    {
      name: 'mainCategories',
      type: 'relationship',
      relationTo: 'mainCategories',
      hasMany: true,
      admin: {
        description: 'Select which main categories this option applies to (e.g., W12 L42 for Bottoms only)',
      },
    },
  ],
})
