import type { CollectionAfterChangeHook } from 'payload'
import OpenAI from 'openai'
import { getServerSideURL } from '../../../utilities/getURL'
import { processBackgroundRemoval } from './processProductMainImage'

interface ImageValidationResult {
  approved: boolean
  score: number
  issues: string[]
  detectedType: string
}

interface MediaDoc {
  id: string
  filename?: string
  url?: string
  mimeType?: string
}

interface StyleDoc {
  id: string
  title?: string
  category?: string | { id: string; category?: string }
  seller?: string | { id: string }
}

/**
 * Validates variation images using OpenAI GPT-4o-mini Vision
 * Runs async after variation is saved - doesn't block the save
 */
export const validateVariationImages: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Skip if no images or if validation is disabled
  if (!process.env.OPENAI_API_KEY) {
    req.payload.logger.warn('[ImageValidation] OPENAI_API_KEY not set - skipping validation')
    return doc
  }

  // Skip if context indicates we should skip hooks
  if (req.context?.skipHooks || req.context?.skipImageValidation) return doc

  const currentImages = (doc.images || []) as (string | MediaDoc)[]
  const previousImages = (previousDoc?.images || []) as (string | MediaDoc)[]

  // Get image IDs for comparison
  const currentImageIds = currentImages.map((img) =>
    typeof img === 'string' ? img : img.id
  )
  const previousImageIds = previousImages.map((img) =>
    typeof img === 'string' ? img : img.id
  )

  // Check if images changed
  const imagesChanged =
    currentImageIds.length !== previousImageIds.length ||
    currentImageIds.some((id, i) => id !== previousImageIds[i])

  // Only validate if images changed and there are images
  if (!imagesChanged || currentImageIds.length === 0) {
    return doc
  }

  // Run validation async (don't block the response)
  setImmediate(async () => {
    try {
      await performImageValidation(req.payload, doc, currentImages)
    } catch (error) {
      req.payload.logger.error(`[ImageValidation] Error: ${error}`)
    }
  })

  return doc
}

async function performImageValidation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  images: (string | MediaDoc)[]
) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  payload.logger.info(`[ImageValidation] Validating ${images.length} images for variation ${doc.id}`)

  // Fetch full image documents if needed
  const imageIds = images.map((img) => (typeof img === 'string' ? img : img.id))
  const mediaDocs = await payload.find({
    collection: 'media',
    where: { id: { in: imageIds } },
    limit: imageIds.length,
  })

  // Sort mediaDocs to match the original imageIds order
  // payload.find returns docs in database order, not the order we requested
  const sortedMediaDocs = imageIds
    .map((id) => (mediaDocs.docs as MediaDoc[]).find((doc) => doc.id === id))
    .filter((doc): doc is MediaDoc => doc !== undefined)

  // Get category and seller from style
  let categoryName = 'Unknown'
  let sellerId: string | null = null
  let style: StyleDoc | null = null

  if (doc.style) {
    const styleId = typeof doc.style === 'string' ? doc.style : doc.style.id
    style = (await payload.findByID({
      collection: 'styles',
      id: styleId,
      depth: 1,
    })) as StyleDoc

    if (style?.category) {
      categoryName =
        typeof style.category === 'string'
          ? style.category
          : style.category.category || 'Unknown'
    }

    if (style?.seller) {
      sellerId = typeof style.seller === 'string' ? style.seller : style.seller.id
    }
  }

  // Build image contents using URLs (works with S3/cloud storage)
  const imageContents: OpenAI.Chat.Completions.ChatCompletionContentPart[] = []
  const serverUrl = getServerSideURL()

  for (const mediaDoc of sortedMediaDocs) {
    if (mediaDoc.url) {
      // Convert relative URLs to absolute URLs for OpenAI
      const fullUrl = mediaDoc.url.startsWith('http')
        ? mediaDoc.url
        : `${serverUrl}${mediaDoc.url}`
      payload.logger.info(`[ImageValidation] Adding image URL: ${fullUrl}`)
      imageContents.push({
        type: 'image_url',
        image_url: {
          url: fullUrl,
          detail: 'low', // Use low detail to reduce costs
        },
      })
    } else {
      payload.logger.warn(`[ImageValidation] No URL for media doc: ${mediaDoc.id}`)
    }
  }

  if (imageContents.length === 0) {
    payload.logger.warn(`[ImageValidation] No valid images to validate for variation ${doc.id}`)
    return
  }

  // Add the prompt
  imageContents.push({
    type: 'text',
    text: `You are a product image validator for a fashion marketplace called DRES.

Analyze these ${imageContents.length - 1} product image(s) and determine if they meet our quality guidelines.

Expected Product Category: "${categoryName}"

Guidelines:
1. Images must be real product photos (not screenshots, memes, AI-generated, or unrelated images)
2. Images should show actual clothing/fashion items matching the category "${categoryName}"
3. All images should appear to be of the same or similar product
4. Image quality should be acceptable (not extremely blurry or dark)
5. No explicit, offensive, or inappropriate content

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "approved": true/false,
  "score": 0-100,
  "issues": ["list of specific issues found, empty if approved"],
  "detectedType": "what type of item you see in the images"
}`,
  })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: imageContents,
        },
      ],
    })

    const content = response.choices[0]?.message?.content || '{}'

    // Parse the JSON response
    let result: ImageValidationResult
    try {
      // Remove any markdown formatting if present
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
      result = JSON.parse(jsonStr)
    } catch {
      payload.logger.error(`[ImageValidation] Failed to parse response: ${content}`)
      result = {
        approved: true, // Default to approved if parsing fails
        score: 50,
        issues: ['Could not parse validation response'],
        detectedType: 'Unknown',
      }
    }

    payload.logger.info(
      `[ImageValidation] Result for ${doc.id}: approved=${result.approved}, score=${result.score}, detected=${result.detectedType}`
    )

    // Determine validation status (only 3 states: pending, approved, rejected)
    const status: 'pending' | 'approved' | 'rejected' = result.approved ? 'approved' : 'rejected'

    // Build update data
    const updateData: Record<string, unknown> = {
      imageValidationStatus: status,
      imageValidationScore: result.score,
      imageValidationNotes:
        result.issues.length > 0
          ? `Detected: ${result.detectedType}. Issues: ${result.issues.join(', ')}`
          : `Detected: ${result.detectedType}. Images approved.`,
    }

    // If rejected, set variation status to draft
    if (status === 'rejected') {
      updateData.status = 'draft'
      payload.logger.warn(
        `[ImageValidation] Variation ${doc.id} rejected: ${result.issues.join(', ')}. Setting status to draft.`
      )
    }

    payload.logger.info(`[ImageValidation] Updating variation ${doc.id} with data: ${JSON.stringify(updateData)}`)

    // Update the variation with validation results
    const updatedVariation = await payload.update({
      collection: 'variations',
      id: doc.id,
      data: updateData,
      context: {
        skipHooks: true, // Prevent infinite loop
        skipImageValidation: true,
      },
    })

    payload.logger.info(`[ImageValidation] Variation ${doc.id} updated. New status: ${updatedVariation.status}, imageValidationStatus: ${updatedVariation.imageValidationStatus}`)

    // If approved, trigger background removal for the first image
    if (status === 'approved' && images.length > 0) {
      const firstImageId = typeof images[0] === 'string' ? images[0] : images[0].id
      payload.logger.info(`[ImageValidation] Images approved, triggering background removal for ${firstImageId}`)

      // Run background removal async
      processBackgroundRemoval(payload, firstImageId).catch((error) => {
        payload.logger.error(`[ImageValidation] Background removal failed: ${error}`)
      })
    }

    // If rejected, notify the seller
    if (status === 'rejected' && sellerId) {
      const issuesSummary = result.issues.length > 0
        ? result.issues.join(', ')
        : 'Image quality issues detected'

      // Get first image for notification thumbnail
      const firstImageId = images.length > 0
        ? (typeof images[0] === 'string' ? images[0] : images[0].id)
        : null

      // Build the correct path for mobile app navigation
      const styleId = style?.id || (typeof doc.style === 'string' ? doc.style : doc.style?.id)

      await payload.create({
        collection: 'notifications',
        data: {
          user: sellerId,
          type: 'system',
          message: `Your product images were rejected: ${issuesSummary}. Please upload new images.`,
          image: firstImageId,
          path: `/sell/style/${styleId}/variation/${doc.id}`,
          metadata: {
            variationId: doc.id,
            styleId: styleId,
            validationStatus: status,
            validationScore: result.score,
            issues: result.issues,
          },
        },
        context: {
          skipHooks: false, // Allow push notification to be sent
        },
      })

      payload.logger.info(
        `[ImageValidation] Notification sent to seller ${sellerId} for variation ${doc.id}`
      )
    }
  } catch (error) {
    payload.logger.error(`[ImageValidation] OpenAI API error: ${error}`)
  }
}
