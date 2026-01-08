import type { CollectionAfterChangeHook } from 'payload'
import { removeBackgroundFromBuffer, isRemoveBgConfigured } from '@/utilities/removeBackground'
import sharp from 'sharp'
import { UTApi } from 'uploadthing/server'
import path from 'path'
import fs from 'fs/promises'

// Image size configurations matching Payload's Media collection
const IMAGE_SIZES = [
  { name: 'thumbnail', width: 300 },
  { name: 'square', width: 500, height: 500 },
  { name: 'small', width: 600 },
  { name: 'medium', width: 900 },
  { name: 'large', width: 1400 },
  { name: 'xlarge', width: 1920 },
  { name: 'og', width: 1200, height: 630, crop: true },
] as const

// Check if we're using UploadThing (production) or local storage
const isUsingUploadThing = () => process.env.NODE_ENV === 'production' && !!process.env.UPLOADTHING_TOKEN

// Initialize UploadThing API client
const getUploadThingClient = () => {
  return new UTApi({
    token: process.env.UPLOADTHING_TOKEN,
  })
}

interface MediaDoc {
  id: string
  filename?: string
  mimeType?: string
  url?: string
  backgroundRemoved?: boolean
}

/**
 * Download image buffer from URL (works with UploadThing URLs)
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
 * Read image from local file system
 */
async function readImageFromLocal(filename: string): Promise<Buffer> {
  const mediaDir = path.resolve(process.cwd(), 'media')
  const filePath = path.join(mediaDir, filename)
  return await fs.readFile(filePath)
}

/**
 * Write image to local file system
 */
async function writeImageToLocal(filename: string, buffer: Buffer): Promise<boolean> {
  try {
    const mediaDir = path.resolve(process.cwd(), 'media')
    const filePath = path.join(mediaDir, filename)
    await fs.writeFile(filePath, new Uint8Array(buffer))
    return true
  } catch (error) {
    console.error('Local file write error:', error)
    return false
  }
}

/**
 * Upload image to UploadThing and return the new URL
 */
async function uploadToUploadThing(
  utapi: UTApi, 
  buffer: Buffer, 
  filename: string, 
  contentType: string
): Promise<string | null> {
  try {
    // Convert Buffer to Uint8Array for File constructor
    const uint8Array = new Uint8Array(buffer)
    const blob = new Blob([uint8Array], { type: contentType })
    const file = new File([blob], filename, { type: contentType })
    const response = await utapi.uploadFiles([file])
    
    if (response[0]?.data?.ufsUrl) {
      return response[0].data.ufsUrl
    }
    return null
  } catch (error) {
    console.error('UploadThing upload error:', error)
    return null
  }
}

/**
 * Hook to process the first product image and remove its background
 * This ensures the main product image (images[0]) has a clean white background
 * Works with both UploadThing (production) and local file storage (development)
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
  
  // Check if the first image changed
  const previousFirstImageId = previousDoc?.images?.[0]
    ? typeof previousDoc.images[0] === 'object' 
      ? previousDoc.images[0].id 
      : previousDoc.images[0]
    : null

  // Skip if first image hasn't changed (unless it's a new product)
  // if (operation === 'update' && firstImageId === previousFirstImageId) {
  //   return doc
  // }

  try {
    // Fetch the first image media document
    const mediaDoc = await req.payload.findByID({
      collection: 'media',
      id: firstImageId,
      depth: 0,
    }) as MediaDoc

    if (!mediaDoc || !mediaDoc.filename) {
      return doc
    }

    // Skip if already processed
    if (mediaDoc.backgroundRemoved) {
      req.payload.logger.info(`Image ${mediaDoc.id} already has background removed - skipping`)
      return doc
    }

    // Only process images
    if (!mediaDoc.mimeType?.startsWith('image/')) {
      return doc
    }

    req.payload.logger.info(`Processing background removal for product ${doc.id} main image: ${mediaDoc.filename}`)

    const useUploadThing = isUsingUploadThing()
    let imageBuffer: Buffer
    
    // Download the image
    try {
      if (useUploadThing && mediaDoc.url) {
        // Download from UploadThing URL
        req.payload.logger.info(`Downloading image from UploadThing: ${mediaDoc.url}`)
        imageBuffer = await downloadImageFromUrl(mediaDoc.url)
      } else {
        // Read from local file system
        req.payload.logger.info(`Reading image from local storage: ${mediaDoc.filename}`)
        imageBuffer = await readImageFromLocal(mediaDoc.filename)
      }
    } catch (error) {
      req.payload.logger.error(`Failed to download/read image: ${error}`)
      return doc
    }

    // Remove background and keep it transparent
    const result = await removeBackgroundFromBuffer(imageBuffer, {
      format: 'png',
    })

    if (!result.success || !result.buffer) {
      req.payload.logger.error(`Failed to remove background for product ${doc.id}: ${result.error}`)
      return doc
    }

    // Get original file extension and determine format
    const originalExtension = mediaDoc.filename.split('.').pop()?.toLowerCase() || 'jpg'
    const isPng = originalExtension === 'png'
    const contentType = isPng ? 'image/png' : 'image/jpeg'
    
    // Convert processed image to original format
    // For non-PNG, flatten transparency to white background
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
    
    // Upload processed main image
    let newUrl: string | undefined
    
    if (useUploadThing) {
      // Upload to UploadThing
      const utapi = getUploadThingClient()
      req.payload.logger.info(`Uploading processed image to UploadThing: ${mediaDoc.filename}`)
      
      const uploadedUrl = await uploadToUploadThing(utapi, processedBuffer, mediaDoc.filename, contentType)
      if (!uploadedUrl) {
        req.payload.logger.error(`Failed to upload processed image to UploadThing`)
        return doc
      }
      newUrl = uploadedUrl
      req.payload.logger.info(`Uploaded processed image to UploadThing: ${uploadedUrl}`)
    } else {
      // Write to local file system
      const success = await writeImageToLocal(mediaDoc.filename, processedBuffer)
      if (!success) {
        req.payload.logger.error(`Failed to write processed image to local storage`)
        return doc
      }
      req.payload.logger.info(`Saved processed image locally: ${mediaDoc.filename}`)

      // Generate and save all resized versions locally
      try {
        const metadata = await sharp(result.buffer).metadata()
        const originalWidth = metadata.width || 1920
        const originalHeight = metadata.height || 1080
        const baseFilename = mediaDoc.filename.replace(/\.[^/.]+$/, '')

        for (const size of IMAGE_SIZES) {
          try {
            let resizedBuffer: Buffer
            const sizeHeight = 'height' in size ? size.height : undefined
            const sizeFilename = `${baseFilename}-${size.width}x${sizeHeight || Math.round((originalHeight / originalWidth) * size.width)}.${originalExtension}`

            let sharpInstance = sharp(result.buffer)
            
            if (sizeHeight && 'crop' in size && size.crop) {
              sharpInstance = sharpInstance.resize(size.width, sizeHeight, { fit: 'cover', position: 'center' })
            } else if (sizeHeight) {
              sharpInstance = sharpInstance.resize(size.width, sizeHeight, { fit: 'cover', position: 'center' })
            } else {
              sharpInstance = sharpInstance.resize(size.width, null, { withoutEnlargement: true })
            }

            if (isPng) {
              resizedBuffer = await sharpInstance.png({ compressionLevel: 8 }).toBuffer()
            } else {
              // Flatten transparency to white for JPEG
              resizedBuffer = await sharpInstance
                .flatten({ background: { r: 255, g: 255, b: 255 } })
                .jpeg({ quality: 85 })
                .toBuffer()
            }

            await writeImageToLocal(sizeFilename, resizedBuffer)
            req.payload.logger.info(`Saved resized image locally: ${sizeFilename}`)
          } catch (sizeError) {
            req.payload.logger.error(`Failed to generate ${size.name} size: ${sizeError}`)
          }
        }
      } catch (error) {
        req.payload.logger.error(`Failed to generate resized images: ${error}`)
      }
    }

    // Mark the media as processed and update URL if using UploadThing
    const updateData: Record<string, unknown> = {
      backgroundRemoved: true,
    }
    
    if (newUrl) {
      updateData.url = newUrl
    }
    
    await req.payload.update({
      collection: 'media',
      id: mediaDoc.id,
      data: updateData,
    })

    req.payload.logger.info(`Background removed for product ${doc.id} main image: ${mediaDoc.filename}`)
  } catch (error) {
    req.payload.logger.error(`Error processing product main image: ${error}`)
  }

  return doc
}
