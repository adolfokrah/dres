import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

/**
 * Prevents creating duplicate product variations with the same options combination
 * for the same product.
 */
export const validateUniqueVariation: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data?.product || !data?.options) return data

  const payload = req.payload

  // Get the product ID
  const productId = typeof data.product === 'object' ? data.product.id : data.product

  // Get the options IDs and sort them for consistent comparison
  const optionIds = (data.options as (string | { id: string })[])
    .map((opt) => (typeof opt === 'object' ? opt.id : opt))
    .filter(Boolean)
    .sort()

  if (optionIds.length === 0) return data

  // Find existing variations for this product
  const existingVariations = await payload.find({
    collection: 'product-variations',
    where: {
      product: {
        equals: productId,
      },
    },
    depth: 1, // Get options populated
    limit: 100,
  })

  // Fetch the product name for better error messages
  let productName = 'this product'
  try {
    const product = await payload.findByID({
      collection: 'products',
      id: productId,
      depth: 0,
    })
    if (product?.title) {
      productName = `"${product.title}"`
    }
  } catch {
    // Use default name
  }

  // Fetch option names for better error messages
  const optionNames: string[] = []
  try {
    for (const optId of optionIds) {
      const option = await payload.findByID({
        collection: 'attributeOptions',
        id: optId,
        depth: 1,
      })
      if (option?.name) {
        const attrName = typeof option.attribute === 'object' ? option.attribute.name : ''
        optionNames.push(attrName ? `${attrName}: ${option.name}` : option.name)
      }
    }
  } catch {
    // Use IDs if names can't be fetched
  }

  const optionsDescription = optionNames.length > 0 
    ? optionNames.join(', ') 
    : `options [${optionIds.join(', ')}]`

  // Check each existing variation
  for (const variation of existingVariations.docs) {
    // Skip the current document on update
    if (operation === 'update' && originalDoc?.id === variation.id) {
      continue
    }

    // Get the existing variation's option IDs and sort them
    const existingOptionIds = (variation.options as (string | { id: string })[])
      ?.map((opt) => (typeof opt === 'object' ? opt.id : opt))
      .filter(Boolean)
      .sort() || []

    // Compare the two arrays
    if (
      optionIds.length === existingOptionIds.length &&
      optionIds.every((id, index) => id === existingOptionIds[index])
    ) {
      throw new APIError(
        `Duplicate variation: ${productName} already has a variation with ${optionsDescription}. Each product can only have one variation per unique combination of options.`,
        400,
      )
    }
  }

  return data
}
