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
    // Also reset image validation status to pending for re-validation with new category
    for (const variation of variations.docs) {
      const hasImages = variation.images && Array.isArray(variation.images) && variation.images.length > 0
      const wasRejectedOrFlagged = variation.imageValidationStatus === 'flagged' || variation.imageValidationStatus === 'rejected'

      await payload.update({
        collection: 'variations',
        id: variation.id,
        data: {
          status: 'draft',
          // Clear variant attributes since they may no longer be valid
          variants: [],
          // Reset image validation to pending so it re-runs with new category
          // This is important because validation checks if images match the category
          imageValidationStatus: 'pending',
          imageValidationScore: null,
          imageValidationNotes: null,
        },
        // Skip hooks to avoid infinite loops - but allow image validation to run if needed
        context: {
          skipVariationHooks: true,
          skipHooks: true,
        },
      })

      // If variation has images and was previously rejected/flagged,
      // trigger a new validation with the new category
      if (hasImages && wasRejectedOrFlagged) {
        payload.logger.info(
          `Re-triggering image validation for variation ${variation.id} after category change (was ${variation.imageValidationStatus})`
        )
        // We need to trigger validation manually since we're skipping hooks
        // Import and call the validation function asynchronously
        setImmediate(async () => {
          try {
            // Fetch the variation with images to trigger validation
            const updatedVariation = await payload.findByID({
              collection: 'variations',
              id: variation.id,
              depth: 1,
            })

            if (updatedVariation.images && updatedVariation.images.length > 0) {
              // Update with images to trigger validation hook
              await payload.update({
                collection: 'variations',
                id: variation.id,
                data: {
                  // Touch the images field to trigger validation
                  images: updatedVariation.images.map((img: { id: string } | string) =>
                    typeof img === 'string' ? img : img.id
                  ),
                },
                context: {
                  skipHooks: false,
                  skipVariationHooks: true,
                },
              })
            }
          } catch (error) {
            payload.logger.error(`Error re-triggering validation for variation ${variation.id}: ${error}`)
          }
        })
      }
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
