import type { CollectionAfterChangeHook } from 'payload'

/**
 * Hook to set mediaFolder to 'products' for all images associated with a variation
 * This runs after the variation is saved to ensure images are properly categorized
 */
export const setProductImagesFolder: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  // Only process on create or update
  if (operation !== 'create' && operation !== 'update') {
    return doc
  }

  // Get image IDs from the variation
  const imageIds: string[] = []
  
  if (doc.images && Array.isArray(doc.images)) {
    for (const img of doc.images) {
      if (typeof img === 'string') {
        imageIds.push(img)
      } else if (img?.id) {
        imageIds.push(img.id)
      }
    }
  }

  // Update each image to have mediaFolder = 'products'
  if (imageIds.length > 0) {
    try {
      await Promise.all(
        imageIds.map(async (imageId) => {
          try {
            // Check current folder
            const media = await req.payload.findByID({
              collection: 'media',
              id: imageId,
              depth: 0,
            })
            
            // Only update if not already set to 'products'
            if (media && media.mediaFolder !== 'products') {
              await req.payload.update({
                collection: 'media',
                id: imageId,
                data: {
                  mediaFolder: 'products',
                },
              })
            }
          } catch (error) {
            // Log but don't fail - image might not exist
            req.payload.logger.warn(`Could not update mediaFolder for image ${imageId}`)
          }
        })
      )
    } catch (error) {
      req.payload.logger.error({ err: error, msg: 'Error setting product images folder' })
    }
  }

  return doc
}
