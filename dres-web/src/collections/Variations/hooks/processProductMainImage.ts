import type { CollectionAfterChangeHook } from 'payload'
import { removeBackgroundFromBuffer, isRemoveBgConfigured } from '@/utilities/removeBackground'
import sharp from 'sharp'

interface MediaDoc {
  id: string
  filename?: string
  mimeType?: string
  url?: string
  backgroundRemoved?: boolean
}

/**
 * Download image buffer from URL
 */
async function downloadImageFromUrl(url: string): Promise<Buffer> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`)
  }
  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Hook to process the first product image and remove its background
 * Uses Payload's local API to update the media document with the processed image
 * Runs asynchronously in the background to avoid blocking the request
 */
export const processProductMainImage: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Check if Remove.bg is configured
  if (!isRemoveBgConfigured()) {
    return doc
  }

  // Only process if images exist
  if (!doc.images || !Array.isArray(doc.images) || doc.images.length === 0) {
    return doc
  }

  // Get the first image ID
  const firstImageId = typeof doc.images[0] === 'object' ? doc.images[0].id : doc.images[0]

  // On update, check if first image actually changed
  if (operation === 'update' && previousDoc?.images?.length > 0) {
    const previousFirstImageId = typeof previousDoc.images[0] === 'object' 
      ? previousDoc.images[0].id 
      : previousDoc.images[0]
    
    // Skip if first image hasn't changed (e.g., just removing other images)
    if (firstImageId === previousFirstImageId) {
      return doc
    }
  }

  // Run background removal asynchronously to avoid blocking the request
  processBackgroundRemoval(req.payload, firstImageId).catch((error) => {
    req.payload.logger.error(`Background removal failed: ${error}`)
  })

  return doc
}

/**
 * Process background removal asynchronously
 */
async function processBackgroundRemoval(payload: any, firstImageId: string) {
  try {
    // 1. Fetch the first image media document to get its ID and details
    const mediaDoc = await payload.findByID({
      collection: 'media',
      id: firstImageId,
      depth: 0,
    }) as MediaDoc

    if (!mediaDoc || !mediaDoc.filename) {
      return
    }

    // Skip if already processed
    if (mediaDoc.backgroundRemoved) {
      payload.logger.info(`Image ${mediaDoc.id} already has background removed - skipping`)
      return
    }

    // Only process images
    if (!mediaDoc.mimeType?.startsWith('image/')) {
      return
    }

    payload.logger.info(`Processing background removal for media ${mediaDoc.id}: ${mediaDoc.filename}`)

    // Download the image from server
    let imageBuffer: Buffer
    try {
      // Always download from server URL
      const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://dres.app'
      const imageUrl = mediaDoc.url?.startsWith('http') 
        ? mediaDoc.url 
        : `${serverUrl}/api/media/file/${mediaDoc.filename}`
      
      payload.logger.info(`Downloading image from: ${imageUrl}`)
      imageBuffer = await downloadImageFromUrl(imageUrl)
    } catch (error) {
      payload.logger.error(`Failed to download image: ${error}`)
      return
    }

    // 2. Remove background
    const result = await removeBackgroundFromBuffer(imageBuffer, {
      format: 'png',
    })

    if (!result.success || !result.buffer) {
      payload.logger.error(`Failed to remove background: ${result.error}`)
      return
    }

    // Get original file extension and determine format
    const originalExtension = mediaDoc.filename.split('.').pop()?.toLowerCase() || 'jpg'
    const isPng = originalExtension === 'png'
    const mimeType = isPng ? 'image/png' : 'image/jpeg'
    
    // Convert processed image to original format
    let processedBuffer: Buffer
    if (isPng) {
      processedBuffer = result.buffer
    } else {
      // Flatten transparent background to white for JPEG
      processedBuffer = await sharp(result.buffer)
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: 90 })
        .toBuffer()
    }

    // 3. Use Payload local API to update the media document with the processed image
    payload.logger.info(`Updating media ${mediaDoc.id} with processed image...`)

    await payload.update({
      collection: 'media',
      id: mediaDoc.id,
      data: {
        backgroundRemoved: true,
      },
      file: {
        data: processedBuffer,
        name: mediaDoc.filename,
        mimetype: mimeType,
        size: processedBuffer.length,
      },
    })

    payload.logger.info(`Background removed for media ${mediaDoc.id}`)
  } catch (error) {
    payload.logger.error(`Error processing product main image: ${error}`)
  }
}
