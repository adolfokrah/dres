import type { CollectionAfterChangeHook } from 'payload'

/**
 * When a style's category changes, set all its variations to 'draft' status
 * and clear attribute values from variations and SKUs.
 * This forces the seller to review and update attribute values that may no longer be valid
 * for the new category.
 */
export const resetVariationsOnCategoryChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only run on update operations
  if (operation !== 'update') return doc

  // Get category IDs (handle both object and string formats)
  const previousCategoryId = typeof previousDoc?.category === 'object' 
    ? previousDoc?.category?.id 
    : previousDoc?.category
  const newCategoryId = typeof doc.category === 'object' 
    ? doc.category?.id 
    : doc.category

  // Check if category actually changed
  if (!previousCategoryId || !newCategoryId || previousCategoryId === newCategoryId) {
    return doc
  }

  const { payload } = req

  payload.logger.info(
    `Category changed for style ${doc.id}: ${previousCategoryId} -> ${newCategoryId}. Resetting variations and SKUs.`
  )

  try {
    // Find all variations for this style
    const variations = await payload.find({
      collection: 'variations',
      where: {
        style: { equals: doc.id },
      },
      limit: 1000,
      depth: 0,
    })

    if (variations.docs.length === 0) {
      return doc
    }

    const variationIds = variations.docs.map((v) => v.id)

    // Update all variations to draft status and clear their variant attributes
    for (const variation of variations.docs) {
      await payload.update({
        collection: 'variations',
        id: variation.id,
        data: {
          status: 'draft',
          // Clear variant attributes since they may no longer be valid
          variants: [],
        },
        // Skip hooks to avoid infinite loops
        context: {
          skipVariationHooks: true,
        },
      })
    }

    payload.logger.info(
      `Reset ${variations.docs.length} variations to draft for style ${doc.id}`
    )

    // Find all SKUs for these variations
    const skus = await payload.find({
      collection: 'skus',
      where: {
        variation: { in: variationIds },
      },
      limit: 10000,
      depth: 0,
    })

    if (skus.docs.length > 0) {
      // Clear SKU options since they may no longer be valid for the new category
      // Note: SKUs don't have 'draft' status, only 'active' and 'archived'
      for (const sku of skus.docs) {
        await payload.update({
          collection: 'skus',
          id: sku.id,
          data: {
            // Clear SKU options since they may no longer be valid
            skuOptions: [],
          },
        })
      }

      payload.logger.info(
        `Cleared options from ${skus.docs.length} SKUs for style ${doc.id}`
      )
    }
  } catch (error) {
    payload.logger.error(`Error resetting variations/SKUs on category change: ${error}`)
    // Don't throw - let the category change proceed even if cleanup fails
  }

  return doc
}
