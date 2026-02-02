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
  brand?: string | { id: string; name?: string }
  seller?: string | { id: string }
  authenticity?: 'original' | 'replica'
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

  // Only validate if:
  // 1. Images changed
  // 2. There are at least 3 images (minimum required for activation)
  // 3. Status is 'pending' or not set (don't re-validate approved/rejected)
  const validationStatus = doc.imageValidationStatus as string | undefined
  const shouldValidate =
    imagesChanged &&
    currentImageIds.length >= 3 &&
    (!validationStatus || validationStatus === 'pending')

  if (!shouldValidate) {
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

  payload.logger.info(`[ImageValidation] Validating ${images.length} images for variation ${doc.id} (authenticity check: pending)`)

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

  // Get category, seller, brand, and authenticity from style
  let categoryName = 'Unknown'
  let brandName: string | null = null
  let sellerId: string | null = null
  let style: StyleDoc | null = null
  let isOriginal = false
  let isOtherBrand = false

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

    // Get brand name from style
    if (style?.brand) {
      brandName =
        typeof style.brand === 'string'
          ? style.brand
          : style.brand.name || null

      // Check if brand is "Other" (case insensitive)
      isOtherBrand = brandName?.toLowerCase() === 'other'
    }

    if (style?.seller) {
      sellerId = typeof style.seller === 'string' ? style.seller : style.seller.id
    }

    // Check if item is marked as original (requires authenticity proof)
    isOriginal = style?.authenticity === 'original'

    if (isOriginal) {
      payload.logger.info(`[ImageValidation] Item marked as ORIGINAL - brand: ${brandName || 'Not set'}, isOtherBrand: ${isOtherBrand}`)
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

  // Build the prompt with authenticity requirements based on:
  // - Original + specific brand: verify brand label matches the selected brand
  // - Original + "Other" brand: no brand tag check (user doesn't have a specific brand)
  // - Replica: no tag verification
  let authenticityRequirement = ''

  if (isOriginal) {
    if (isOtherBrand) {
      // Original + "Other" brand: no brand tag verification needed
      authenticityRequirement = `

⚠️ CRITICAL: This item is marked as ORIGINAL/AUTHENTIC. You MUST verify basic authenticity markers:
6. At least one image MUST show the care label with washing instructions
7. At least one image SHOULD show size tags or internal labels
8. Labels must appear genuine

If authenticity markers (care label) are missing or unclear, the item MUST BE REJECTED with specific details about what's missing.`
    } else if (!brandName) {
      // Original but no brand selected: check for any brand tag
      authenticityRequirement = `

⚠️ CRITICAL: This item is marked as ORIGINAL/AUTHENTIC. You MUST verify authenticity markers:
6. At least one image MUST show a brand logo/label clearly (any brand is acceptable)
7. At least one image MUST show the care label with washing instructions
8. At least one image SHOULD show size tags or internal labels
9. Labels must appear genuine

If authenticity markers (brand tag, care label) are missing or unclear, the item MUST BE REJECTED with specific details about what's missing.`
    } else {
      // Original + specific brand: verify brand label matches the selected brand
      authenticityRequirement = `

⚠️ CRITICAL: This item is marked as ORIGINAL/AUTHENTIC "${brandName}". You MUST verify authenticity markers:
6. At least one image MUST show the "${brandName}" brand logo/label clearly
7. The brand tag visible in images MUST match "${brandName}" - if a different brand is shown, REJECT the item
8. At least one image MUST show the care label with washing instructions
9. At least one image SHOULD show size tags or internal labels
10. Labels must appear genuine and match the expected quality for "${brandName}"

If the brand tag doesn't match "${brandName}", or if authenticity markers are missing or unclear, the item MUST BE REJECTED with specific details about what's wrong.`
    }
  }

  // Add the prompt
  imageContents.push({
    type: 'text',
    text: `You are a product image validator for a fashion marketplace called DRES.

Analyze these ${imageContents.length - 1} product image(s) and determine if they meet our quality guidelines.

Expected Product Category: "${categoryName}"
${brandName ? `Selected Brand: "${brandName}"${isOtherBrand ? ' (generic/other brand)' : ''}` : ''}
Item Authenticity Claim: ${isOriginal ? '⚠️ ORIGINAL/AUTHENTIC (requires proof)' : 'Replica (no authenticity proof needed)'}

Guidelines:
1. Images must be real product photos (not screenshots, memes, AI-generated, or unrelated images)
2. Images should show actual clothing/fashion items matching the category "${categoryName}"
3. All images should appear to be of the same or similar product
4. Image quality should be acceptable (not extremely blurry or dark)
5. No explicit, offensive, or inappropriate content${authenticityRequirement}

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

      // Create appropriate message based on authenticity and brand
      let notificationMessage: string
      if (isOriginal) {
        if (isOtherBrand) {
          // Other brand: no brand tag requirement
          notificationMessage = `Your product images were rejected: ${issuesSummary}. For authentic items, you must include photos showing care tags and other authenticity markers.`
        } else if (!brandName) {
          // No brand selected: require brand tag
          notificationMessage = `Your product images were rejected: ${issuesSummary}. For authentic items, you must include photos showing brand labels, care tags, and other authenticity markers.`
        } else {
          // Specific brand: require matching brand tag
          notificationMessage = `Your product images were rejected: ${issuesSummary}. For authentic "${brandName}" items, you must include photos showing the "${brandName}" brand label, care tags, and other authenticity markers. The brand tag must match the selected brand.`
        }
      } else {
        notificationMessage = `Your product images were rejected: ${issuesSummary}. Please upload new images.`
      }

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
          message: notificationMessage,
          image: firstImageId,
          path: `/sell/style/${styleId}/variation/${doc.id}`,
          metadata: {
            variationId: doc.id,
            styleId: styleId,
            validationStatus: status,
            validationScore: result.score,
            issues: result.issues,
            isOriginal: isOriginal,
            brandName: brandName,
            isOtherBrand: isOtherBrand,
          },
        },
        context: {
          skipHooks: false, // Allow push notification to be sent
        },
      })

      payload.logger.info(
        `[ImageValidation] Notification sent to seller ${sellerId} for variation ${doc.id}${isOriginal ? ' (authenticity check failed)' : ''}`
      )
    }
  } catch (error) {
    payload.logger.error(`[ImageValidation] OpenAI API error: ${error}`)
  }
}
