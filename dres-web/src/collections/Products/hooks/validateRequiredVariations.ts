import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

export const validateRequiredVariations: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  // Only validate on create and update
  if (operation !== 'create' && operation !== 'update') return data

  const payload = req.payload

  // Get category ID from data
  const categoryId = data?.category
    ? typeof data.category === 'object'
      ? (data.category as { id: string }).id
      : data.category
    : null

  if (!categoryId) return data

  try {
    // Fetch the category to check for variant attributes
    const category = await payload.findByID({
      collection: 'categories',
      id: categoryId,
      depth: 0,
    })

    // Check if category has variant attributes
    const variantAttributes = category?.variantAttributes as string[] | undefined
    const hasVariantAttributes = variantAttributes && variantAttributes.length > 0

    if (hasVariantAttributes) {
      // Check if product has at least one variation
      const variations = data?.variations as Array<unknown> | undefined
      
      if (!variations || variations.length === 0) {
        throw new APIError(
          'This category requires at least one variation. Please add product variations with the required variant options.',
          400,
        )
      }
    }
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    // Log other errors but don't block the save
    payload.logger.error(`Error validating required variations: ${error}`)
  }

  return data
}
