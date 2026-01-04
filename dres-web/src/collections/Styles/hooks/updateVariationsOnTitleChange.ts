import type { CollectionAfterChangeHook } from 'payload'

/**
 * When a style's title changes, update all related variations
 * to regenerate their titles and slugs with the new style title
 */
export const updateVariationsOnTitleChange: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only run on update operations
  if (operation !== 'update') return doc

  const { payload } = req

  // Check if title actually changed
  const previousTitle = previousDoc?.title
  const newTitle = doc?.title

  if (!previousTitle || !newTitle || previousTitle === newTitle) {
    return doc
  }

  payload.logger.info(`📝 Style title changed from "${previousTitle}" to "${newTitle}" - updating variations...`)

  try {
    // Find all variations for this style
    const variations = await payload.find({
      collection: 'variations',
      where: {
        style: { equals: doc.id },
      },
      limit: 1000, // Get all variations
      depth: 0,
    })

    if (variations.docs.length === 0) {
      payload.logger.info(`📝 No variations found for style ${doc.id}`)
      return doc
    }

    payload.logger.info(`📝 Found ${variations.docs.length} variations to update`)

    // Update each variation to trigger the slug/title regeneration hook
    for (const variation of variations.docs) {
      try {
        // Pass context flag to force slug/title regeneration
        await payload.update({
          collection: 'variations',
          id: variation.id,
          data: {
            // Empty data - the beforeChange hook will regenerate title/slug
          },
          context: {
            forceRegenerateSlug: true,
          },
        })
        payload.logger.info(`📝 Updated variation ${variation.id}`)
      } catch (error) {
        payload.logger.error(`📝 Failed to update variation ${variation.id}: ${error}`)
      }
    }

    payload.logger.info(`📝 Finished updating ${variations.docs.length} variations for style ${doc.id}`)
  } catch (error) {
    payload.logger.error(`📝 Error updating variations for style ${doc.id}: ${error}`)
  }

  return doc
}
