import type { CollectionAfterChangeHook } from 'payload'
import OpenAI from 'openai'

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
  // 2. There is at least 1 image (changed from 3 to allow single image variations)
  // 3. Status is 'pending' or not set (don't re-validate approved/rejected)
  const validationStatus = doc.imageValidationStatus as string | undefined
  const shouldValidate =
    imagesChanged &&
    currentImageIds.length >= 1 &&
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
  // Use public URL for OpenAI to access images (ngrok in dev, production URL in prod)
  const serverUrl = process.env.OPENAI_PUBLIC_URL || process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

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

  // Build simple brand note for original items
  let brandNote = ''
  if (isOriginal && brandName && !isOtherBrand) {
    brandNote = `\n6. For this "${brandName}" item, check if brand identification is visible (tag, logo, or name on product)`
  } else if (isOriginal && !isOtherBrand && !brandName) {
    brandNote = `\n6. For this authentic item, check if any brand identification is visible (tag, logo, or name on product)`
  }

  // Add the prompt - simple scoring, no strict rejection rules
  imageContents.push({
    type: 'text',
    text: `You are a product image validator for a fashion marketplace called DRES.

Analyze these ${imageContents.length - 1} product image(s) and score them based on quality.

Expected Product Category: "${categoryName}"
${brandName ? `Selected Brand: "${brandName}"${isOtherBrand ? ' (generic/other brand)' : ''}` : ''}

Scoring Guidelines (give higher scores for better quality):
1. Images must be real product photos (not screenshots, memes, AI-generated, or unrelated images)
2. Images should show actual clothing/fashion items matching the category "${categoryName}"
3. **CRITICAL: All images MUST show the EXACT SAME product design**
   - ✓ GOOD: Same product from different angles (front, side, back) - DIFFERENT ANGLES = OK
   - ✓ GOOD: Same product in different lighting or backgrounds - LIGHTING VARIATIONS = OK
   - ✓ GOOD: Same product worn vs laid flat - DIFFERENT PRESENTATION = OK
   - ✗ BAD: Two completely different product designs (DIFFERENT PRODUCTS = REJECT)
   - **BRAND CHECK**: Only check brands IF they are visible in the images
     - If brand logos/tags are visible: Must be the SAME brand
     - If NO brand is visible: Skip brand check, just verify same product design
     - Example: Nike logo + Adidas logo = REJECT (different brands visible)
     - Example: Generic item from different angles = OK (no brand visible)
   - **IMPORTANT**: Do NOT reject just because of different angles, lighting, or backgrounds
   - **IMPORTANT**: Only reject if clearly different product designs or (if brands visible) different brands
4. Image quality should be acceptable (clear, well-lit)
5. No explicit, offensive, or inappropriate content
6. **CRITICAL: All images MUST show items of the SAME COLOR**. If images show different colored items (e.g., one image shows a red shirt and another shows a blue shirt), this is a CRITICAL FAILURE and the score MUST be below 50${brandNote}

Score Guide:
- 80-100: Excellent quality, clear images, meets all guidelines, same color across all images
- 60-79: Good quality, minor issues but acceptable, consistent color
- 51-59: Acceptable quality, product is identifiable, consistent color
- 0-50: REJECTED - Major issues including different colors across images, not suitable for marketplace

Respond ONLY with valid JSON (no markdown, no explanation):
{
  "approved": true/false,
  "score": 0-100,
  "issues": ["list of specific issues found, empty if none"],
  "detectedType": "what type of item you see in the images"
}`,
  })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_completion_tokens: 500,
      messages: [
        {
          role: 'user',
          content: imageContents,
        },
      ],
    })

    const content = response.choices[0]?.message?.content || '{}'

    payload.logger.info(`[ImageValidation] Raw OpenAI response: ${content}`)

    // Parse the JSON response
    let result: ImageValidationResult
    try {
      // Remove any markdown formatting if present
      const jsonStr = content.replace(/```json\n?|\n?```/g, '').trim()
      const parsed = JSON.parse(jsonStr)

      // Ensure all required fields exist with defaults
      result = {
        approved: parsed.approved ?? true,
        score: typeof parsed.score === 'number' ? parsed.score : 50,
        issues: Array.isArray(parsed.issues) ? parsed.issues : [],
        detectedType: parsed.detectedType || 'Unknown',
      }
    } catch (error) {
      payload.logger.error(`[ImageValidation] Failed to parse response: ${content}. Error: ${error}`)
      result = {
        approved: true, // Default to approved if parsing fails
        score: 50,
        issues: ['Could not parse validation response'],
        detectedType: 'Unknown',
      }
    }

    // Use score-based approval: score >= 49 = approved
    const isApproved = result.score >= 49

    payload.logger.info(
      `[ImageValidation] Result for ${doc.id}: score=${result.score}, isApproved=${isApproved} (threshold: >=49), detected=${result.detectedType}`
    )

    // Determine validation status based on score (only 3 states: pending, approved, rejected)
    const status: 'pending' | 'approved' | 'rejected' = isApproved ? 'approved' : 'rejected'

    // Build validation notes based on status and issues
    let validationNotes: string
    if (status === 'approved') {
      validationNotes = result.issues.length > 0
        ? `Detected: ${result.detectedType}. Minor issues: ${result.issues.join(', ')}. Images approved.`
        : `Detected: ${result.detectedType}. Images approved.`
    } else {
      validationNotes = result.issues.length > 0
        ? `Detected: ${result.detectedType}. Issues: ${result.issues.join(', ')}`
        : `Detected: ${result.detectedType}. Images rejected - quality score too low (${result.score}/100).`
    }

    // Build update data
    const updateData: Record<string, unknown> = {
      imageValidationStatus: status,
      imageValidationScore: result.score,
      imageValidationNotes: validationNotes,
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

    // If approved, check for auto-activation
    if (status === 'approved' && images.length > 0) {
      // Check if variation can be auto-activated now that images are approved
      // Only if status is still draft and we have at least 1 image (changed from 3)
      if (updatedVariation.status === 'draft' && images.length >= 1) {
        await tryAutoActivateVariation(payload, doc.id, images, doc.variants)
      }
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
          notificationMessage = `Your product images were rejected: ${issuesSummary}. Please upload new images.`
        } else if (!brandName) {
          // No brand selected: require brand tag
          notificationMessage = `Your product images were rejected: ${issuesSummary}. For authentic items, please include a photo showing the brand label.`
        } else {
          // Specific brand: require matching brand tag
          notificationMessage = `Your product images were rejected: ${issuesSummary}. For authentic "${brandName}" items, please include a photo showing the "${brandName}" brand label.`
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

/**
 * Try to auto-activate a variation after images are approved
 * Checks all requirements: variants and SKUs
 */
async function tryAutoActivateVariation(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any,
  variationId: string,
  images: (string | MediaDoc)[],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variants: any[] | undefined
) {
  try {
    // Check variants (need at least 1 complete variant)
    const completeVariants = (variants || []).filter(
      (v: { variant?: unknown; value?: unknown }) => v.variant && v.value
    )
    if (completeVariants.length < 1) {
      payload.logger.info(`[ImageValidation] Cannot auto-activate ${variationId}: no complete variants`)
      return
    }

    // Check SKUs (need at least 1 active with valid price)
    const skus = await payload.find({
      collection: 'skus',
      where: {
        variation: { equals: variationId },
        isActive: { not_equals: false },
        status: { not_equals: 'archived' },
      },
      limit: 10,
      depth: 0,
    })

    const validSkus = skus.docs.filter((sku: { price?: number; sellingPrice?: number; stock?: number | null; status?: string; isActive?: boolean }) => {
      const hasPrice = (sku.price && sku.price > 0) || (sku.sellingPrice && sku.sellingPrice > 0)
      // Allow stock to be null, undefined, or >= 0 (only reject negative stock)
      const hasStock = sku.stock === null || sku.stock === undefined || sku.stock >= 0
      const isActive = sku.isActive !== false && sku.status !== 'archived'
      return hasPrice && hasStock && isActive
    })

    if (validSkus.length < 1) {
      payload.logger.info(`[ImageValidation] Cannot auto-activate ${variationId}: no valid SKUs`)
      return
    }

    // All conditions met - activate!
    payload.logger.info(`[ImageValidation] Auto-activating variation ${variationId} - all requirements met after image approval`)

    await payload.update({
      collection: 'variations',
      id: variationId,
      data: { status: 'active' },
      context: {
        skipHooks: true,
        skipImageValidation: true,
      },
    })

    payload.logger.info(`[ImageValidation] Variation ${variationId} activated successfully`)
  } catch (error) {
    payload.logger.error(`[ImageValidation] Auto-activation failed for ${variationId}: ${error}`)
  }
}
