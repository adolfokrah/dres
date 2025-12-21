import { CollectionOverride } from '@payloadcms/plugin-ecommerce/types'
import type { PayloadRequest, Where, RelationshipField } from 'payload'

export const VariantsCollection: CollectionOverride = ({ defaultCollection }) => ({
  ...defaultCollection,
  fields: [
    ...(defaultCollection.fields || []).map((field) => {
      // Add main category filtering to options field
      if ('name' in field && field.name === 'options' && field.type === 'relationship') {
        const relationshipField: RelationshipField = {
          ...field,
          filterOptions: async ({
            data,
            req,
          }: {
            data: Record<string, unknown>
            req: PayloadRequest
          }) => {
            // Get the product to find its category and main categories
            if (!data?.product) {
              return {
                id: {
                  in: [],
                },
              }
            }

            try {
              const productId =
                typeof data.product === 'object' && data.product !== null
                  ? (data.product as { id: string | number }).id
                  : (data.product as string | number)

              const product = await req.payload.findByID({
                collection: 'products',
                id: productId,
                depth: 2,
              })

              if (!product) {
                return {
                  id: {
                    in: [],
                  },
                }
              }

              // Get variant type IDs from product
              const variantTypeIDs: (string | number)[] = []
              if (product.variantTypes && Array.isArray(product.variantTypes)) {
                product.variantTypes.forEach((vt: { id: string | number } | string | number) => {
                  const id = typeof vt === 'object' ? vt.id : vt
                  if (id) variantTypeIDs.push(id)
                })
              }

              if (variantTypeIDs.length === 0) {
                return {
                  id: {
                    in: [],
                  },
                }
              }

              // Get main category IDs from product's category
              let mainCategoryIds: (string | number)[] = []
              if (product.categories) {
                const category =
                  typeof product.categories === 'object'
                    ? product.categories
                    : await req.payload.findByID({
                        collection: 'categories',
                        id: product.categories,
                        depth: 1,
                      })

                if (category?.mainCategories && Array.isArray(category.mainCategories)) {
                  mainCategoryIds = category.mainCategories.map(
                    (mc: { id: string | number } | string | number) =>
                      typeof mc === 'object' ? mc.id : mc,
                  )
                }
              }

              // Build query: filter by variant types and main categories
              // Only show options that belong to the product's main categories
              const query: Where = {
                and: [
                  {
                    variantType: {
                      in: variantTypeIDs,
                    },
                  },
                  mainCategoryIds.length > 0
                    ? {
                        mainCategories: {
                          in: mainCategoryIds,
                        },
                      }
                    : {},
                ],
              }

              return query
            } catch (error) {
              console.error('Error filtering variant options:', error)
              return {
                id: {
                  in: [],
                },
              }
            }
          },
        }
        return relationshipField
      }
      return field
    }),
  ],
})
