import type { CollectionAfterChangeHook } from 'payload'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { removeBackgroundFromBuffer, isRemoveBgConfigured } from '@/utilities/removeBackground'

// Initialize S3 client for Supabase storage
const getS3Client = () => {
  return new S3Client({
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
    },
    region: process.env.S3_REGION || 'local',
    endpoint: process.env.S3_ENDPOINT,
    forcePathStyle: true,
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
 * Hook to process the first product image and remove its background
 * This ensures the main product image (images[0]) has a clean white background
 * Works with S3/Supabase storage (compatible with Vercel's read-only filesystem)
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
//   if (operation === 'update' && firstImageId === previousFirstImageId) {
//     return doc
//   }

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

    // Download image from S3/Supabase
    const s3Client = getS3Client()
    const bucket = process.env.S3_BUCKET || ''
    
    let imageBuffer: Buffer
    
    try {
      const getCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: mediaDoc.filename,
      })
      
      const response = await s3Client.send(getCommand)
      
      if (!response.Body) {
        req.payload.logger.error(`Failed to download image from S3: ${mediaDoc.filename}`)
        return doc
      }
      
      // Convert stream to buffer
      const chunks: Uint8Array[] = []
      for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
        chunks.push(chunk)
      }
      imageBuffer = Buffer.concat(chunks)
    } catch (error) {
      req.payload.logger.error(`Failed to download image from S3: ${error}`)
      return doc
    }

    // Remove background and keep it transparent
    const result = await removeBackgroundFromBuffer(imageBuffer, {
      size: 'auto',
      format: 'png',
    })

    if (!result.success || !result.buffer) {
      req.payload.logger.error(`Failed to remove background for product ${doc.id}: ${result.error}`)
      return doc
    }

    // Upload processed image to S3/Supabase (overwrite original)
    try {
      const putCommand = new PutObjectCommand({
        Bucket: bucket,
        Key: mediaDoc.filename,
        Body: result.buffer,
        ContentType: 'image/png',
      })
      
      await s3Client.send(putCommand)
    } catch (error) {
      req.payload.logger.error(`Failed to upload processed image to S3: ${error}`)
      return doc
    }

    // Mark the media as processed
    await req.payload.update({
      collection: 'media',
      id: mediaDoc.id,
      data: {
        backgroundRemoved: true,
      },
    })

    req.payload.logger.info(`Background removed for product ${doc.id} main image: ${mediaDoc.filename}`)
  } catch (error) {
    req.payload.logger.error(`Error processing product main image: ${error}`)
  }

  return doc
}
