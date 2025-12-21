import { CallToAction } from '@/blocks/CallToAction/config'
import { Content } from '@/blocks/Content/config'
import { MediaBlock } from '@/blocks/MediaBlock/config'
import { slugField } from 'payload'
import { generatePreviewPath } from '@/utilities/generatePreviewPath'
import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import {
  MetaDescriptionField,
  MetaImageField,
  MetaTitleField,
  OverviewField,
  PreviewField,
} from '@payloadcms/plugin-seo/fields'
import {
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'
import { DefaultDocumentIDType, Where } from 'payload'
import {
  checkVariantRequirement,
  setVariantTypesFromMainCategory,
} from './hooks/checkVariantRequirement'

export const ProductsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  hooks: {
    ...defaultCollection?.hooks,
    // Ensure variantTypes is always an array to prevent plugin validation errors
    beforeChange: [
      ...(defaultCollection?.hooks?.beforeChange || []),
      async ({ data }) => {
        if (data && !data.variantTypes) {
          data.variantTypes = []
        }
        return data
      },
    ],
    beforeRead: [
      ...(defaultCollection?.hooks?.beforeRead || []),
      async ({ doc }) => {
        if (doc && !doc.variantTypes) {
          doc.variantTypes = []
        }
        return doc
      },
    ],
  },
  admin: {
    ...defaultCollection?.admin,
    defaultColumns: ['title', 'enableVariants', '_status', 'variants.variants'],
    livePreview: {
      url: ({ data, req }) =>
        generatePreviewPath({
          slug: data?.slug,
          collection: 'products',
          req,
        }),
    },
    preview: (data, { req }) =>
      generatePreviewPath({
        slug: data?.slug as string,
        collection: 'products',
        req,
      }),
    useAsTitle: 'title',
  },
  defaultPopulate: {
    ...defaultCollection?.defaultPopulate,
    title: true,
    slug: true,
    variantOptions: true,
    variants: true,
    enableVariants: true,
    gallery: true,
    priceInUSD: true,
    inventory: true,
    meta: true,
    seller: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      type: 'tabs',
      tabs: [
        {
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: lexicalEditor({
                features: ({ rootFeatures }) => {
                  return [
                    ...rootFeatures,
                    HeadingFeature({ enabledHeadingSizes: ['h1', 'h2', 'h3', 'h4'] }),
                    FixedToolbarFeature(),
                    InlineToolbarFeature(),
                    HorizontalRuleFeature(),
                  ]
                },
              }),
              label: false,
              required: false,
            },
            {
              name: 'gallery',
              type: 'array',
              minRows: 1,
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
                {
                  name: 'variantOption',
                  type: 'relationship',
                  relationTo: 'variantOptions',
                  admin: {
                    condition: (data) => {
                      return data?.enableVariants === true && data?.variantTypes?.length > 0
                    },
                  },
                  filterOptions: async ({ data, req }) => {
                    if (data?.enableVariants && data?.variantTypes?.length) {
                      const variantTypeIDs = data.variantTypes.map(
                        (item: DefaultDocumentIDType | { id: DefaultDocumentIDType }) => {
                          if (typeof item === 'object' && item?.id) {
                            return item.id
                          }
                          return item
                        },
                      ) as DefaultDocumentIDType[]

                      if (variantTypeIDs.length === 0)
                        return {
                          variantType: {
                            in: [],
                          },
                        }

                      // Get the product's category's main categories
                      let mainCategoryIds: (string | number)[] = []
                      if (data?.categories) {
                        try {
                          const categoryId =
                            typeof data.categories === 'object' && data.categories !== null
                              ? (data.categories as { id: string | number }).id
                              : (data.categories as string | number)

                          const categoryDoc = await req.payload.findByID({
                            collection: 'categories',
                            id: categoryId,
                            depth: 1,
                          })

                          if (categoryDoc?.mainCategories) {
                            mainCategoryIds = (categoryDoc.mainCategories as Array<{ id: string | number } | string | number>).map(
                              (mc) => (typeof mc === 'object' ? mc.id : mc)
                            )
                          }
                        } catch (error) {
                          console.error('Error fetching category:', error)
                        }
                      }

                      // Filter by variant type and main categories
                      const query: Where = {
                        and: [
                          {
                            variantType: {
                              in: variantTypeIDs,
                            },
                          },
                          mainCategoryIds.length > 0
                            ? {
                                or: [
                                  {
                                    mainCategories: {
                                      in: mainCategoryIds,
                                    },
                                  },
                                  {
                                    mainCategories: {
                                      exists: false,
                                    },
                                  },
                                ],
                              }
                            : {},
                        ],
                      }

                      return query
                    }

                    return {
                      variantType: {
                        in: [],
                      },
                    }
                  },
                },
              ],
            },

            {
              name: 'layout',
              type: 'blocks',
              blocks: [CallToAction, Content, MediaBlock],
            },
          ],
          label: 'Content',
        },
        {
          fields: [
            ...(defaultCollection.fields.map((field) => {
              // Hide enableVariants field - we'll manage it via hook
              if ('name' in field && field.name === 'enableVariants') {
                return {
                  ...field,
                  admin: {
                    ...('admin' in field ? field.admin : {}),
                    readOnly: true,
                  },
                  hooks: {
                    ...('hooks' in field ? field.hooks : {}),
                    beforeChange: [
                      ...('hooks' in field && field.hooks?.beforeChange
                        ? field.hooks.beforeChange
                        : []),
                      checkVariantRequirement,
                    ],
                  },
                }
              }
              // Auto-populate variantTypes from main category (read-only)
              if ('name' in field && field.name === 'variantTypes') {
                return {
                  ...field,
                  admin: {
                    ...('admin' in field ? field.admin : {}),
                    readOnly: true,
                  },
                  hooks: {
                    ...('hooks' in field ? field.hooks : {}),
                    beforeChange: [
                      ...('hooks' in field && field.hooks?.beforeChange
                        ? field.hooks.beforeChange
                        : []),
                      setVariantTypesFromMainCategory,
                    ],
                  },
                }
              }
              return field
            }) as typeof defaultCollection.fields),
            {
              name: 'relatedProducts',
              type: 'relationship',
              filterOptions: ({ id }) => {
                if (id) {
                  return {
                    id: {
                      not_in: [id],
                    },
                  }
                }

                // ID comes back as undefined during seeding so we need to handle that case
                return {
                  id: {
                    exists: true,
                  },
                }
              },
              hasMany: true,
              relationTo: 'products',
            },
          ],
          label: 'Product Details',
        },
        {
          name: 'meta',
          label: 'SEO',
          fields: [
            OverviewField({
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
              imagePath: 'meta.image',
            }),
            MetaTitleField({
              hasGenerateFn: true,
            }),
            MetaImageField({
              relationTo: 'media',
            }),

            MetaDescriptionField({}),
            PreviewField({
              // if the `generateUrl` function is configured
              hasGenerateFn: true,

              // field paths to match the target field for data
              titlePath: 'meta.title',
              descriptionPath: 'meta.description',
            }),
          ],
        },
      ],
    },
    {
      name: 'seller',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: {
        position: 'sidebar',
      },
      defaultValue: ({ user }) => user?.id,
      hooks: {
        beforeChange: [
          ({ req, value }) => {
            // If no seller is set, default to the current user
            if (!value && req.user) {
              return req.user.id
            }
            return value
          },
        ],
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      admin: {
        position: 'sidebar',
        sortOptions: 'title',
      },
      relationTo: 'categories',
    },
    slugField(),
  ],
})
