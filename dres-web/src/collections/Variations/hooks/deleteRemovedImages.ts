import type { CollectionBeforeChangeHook } from 'payload'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'

// Check storage type
const getStorageType = (): 'S3' | 'local' => {
  if (process.env.AWS_S3_BUCKET_NAME) return 'S3'
  return 'local'
}

// Initialize S3 client
const getS3Client = () => {
  return new S3Client({
    region: process.env.AWS_DEFAULT_REGION || 'us-east-1',
    endpoint: process.env.AWS_ENDPOINT_URL,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
    forcePathStyle: true,
  })
}

/**
 * Extract S3 key from URL
 */
function extractS3Key(url: string): string | null {
  try {
    // URL format: https://storage.railway.app/bucket-name/key
    const bucketName = process.env.AWS_S3_BUCKET_NAME
    if (!bucketName) return null
    
    const regex = new RegExp(`/${bucketName}/(.+)$`)
    const match = url.match(regex)
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
 * Hook to delete images from storage when removed from a variation
 * Supports S3 and local storage
 */
export const deleteRemovedImages: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  const storageType = getStorageType()
  
  // Only process on update when using cloud storage
  if (operation !== 'update' || storageType === 'local') {
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

  for (const imageId of removedImageIds) {
    try {
      const mediaDoc = await req.payload.findByID({
        collection: 'media',
        id: imageId,
        depth: 0,
      })

      if (mediaDoc?.url) {
        // Delete from S3 storage
        const s3Key = extractS3Key(mediaDoc.url)
        if (s3Key) {
          req.payload.logger.info(`Deleting image from S3: ${s3Key}`)
          try {
            const s3Client = getS3Client()
            await s3Client.send(new DeleteObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: s3Key,
            }))
            req.payload.logger.info(`Deleted image from S3: ${s3Key}`)
          } catch (deleteError) {
            req.payload.logger.warn(`Failed to delete image from S3: ${s3Key} - ${deleteError}`)
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
