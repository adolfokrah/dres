import type { CollectionBeforeChangeHook } from 'payload'
import { UTApi } from 'uploadthing/server'

// Check if we're using UploadThing
const isUsingUploadThing = () => {
  if (process.env.FORCE_UPLOADTHING === 'true') return !!process.env.UPLOADTHING_TOKEN
  return process.env.NODE_ENV === 'production' && !!process.env.UPLOADTHING_TOKEN
}

// Initialize UploadThing API client
const getUploadThingClient = () => {
  return new UTApi({
    token: process.env.UPLOADTHING_TOKEN,
  })
}

/**
 * Extract UploadThing file key from URL
 */
function extractUploadThingFileKey(url: string): string | null {
  try {
    const match = url.match(/\/f\/([a-zA-Z0-9_-]+)/)
    if (match && match[1]) {
      return match[1]
    }
    return null
  } catch {
    return null
  }
}

interface ImageRelation {
  image?: string | { id: string; url?: string }
}

/**
 * Hook to delete images from UploadThing when removed from a variation
 * Compares previous images with new images and deletes any that were removed
 */
export const deleteRemovedImages: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  // Only process on update when using UploadThing
  if (operation !== 'update' || !isUsingUploadThing()) {
    return data
  }

  // Get original and new image IDs
  const originalImages = originalDoc?.images || []
  const newImages = data?.images || []

  // Extract IDs from image relations
  const getImageId = (img: ImageRelation | string): string | null => {
    if (typeof img === 'string') return img
    if (typeof img === 'object' && img.image) {
      return typeof img.image === 'string' ? img.image : img.image.id
    }
    return null
  }

  const originalImageIds = new Set<string>(
    originalImages.map(getImageId).filter((id: string | null): id is string => id !== null)
  )
  const newImageIds = new Set<string>(
    newImages.map(getImageId).filter((id: string | null): id is string => id !== null)
  )

  // Find removed image IDs
  const removedImageIds: string[] = []
  originalImageIds.forEach((id: string) => {
    if (!newImageIds.has(id)) {
      removedImageIds.push(id)
    }
  })

  if (removedImageIds.length === 0) {
    return data
  }

  req.payload.logger.info(`Detected ${removedImageIds.length} removed image(s) from variation`)

  // Fetch the media documents to get their URLs
  const utapi = getUploadThingClient()
  
  for (const imageId of removedImageIds) {
    try {
      const mediaDoc = await req.payload.findByID({
        collection: 'media',
        id: imageId,
        depth: 0,
      })

      if (mediaDoc?.url) {
        const fileKey = extractUploadThingFileKey(mediaDoc.url)
        if (fileKey) {
          req.payload.logger.info(`Deleting image from UploadThing: ${fileKey}`)
          try {
            await utapi.deleteFiles([fileKey])
            req.payload.logger.info(`Deleted image from UploadThing: ${fileKey}`)
          } catch (deleteError) {
            req.payload.logger.warn(`Failed to delete image from UploadThing: ${fileKey} - ${deleteError}`)
          }
        }
      }

      // Also delete the media document from Payload
      try {
        await req.payload.delete({
          collection: 'media',
          id: imageId,
        })
        req.payload.logger.info(`Deleted media document: ${imageId}`)
      } catch (mediaDeleteError) {
        req.payload.logger.warn(`Failed to delete media document: ${imageId} - ${mediaDeleteError}`)
      }
    } catch (error) {
      req.payload.logger.error(`Error processing removed image ${imageId}: ${error}`)
    }
  }

  return data
}
