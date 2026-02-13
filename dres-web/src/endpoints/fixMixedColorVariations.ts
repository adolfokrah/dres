import type { PayloadHandler } from 'payload'
import OpenAI from 'openai'
import { getServerSideURL } from '../utilities/getURL'

interface ImageColorAnalysis {
  imageId: string
  imageUrl: string
  detectedColor: string
  confidence: string
}

interface ColorGroup {
  color: string
  imageIds: string[]
  images: Array<{ id: string; url: string }>
}

/**
 * Endpoint to fix existing variations that have mixed colors
 * Scans approved variations, detects color mismatches, and splits them into separate variations
 *
 * Usage: POST /api/fix-mixed-color-variations
 * Body: {
 *   variationId?: string,  // Test with specific variation
 *   limit?: number,        // Number of variations to scan (if variationId not provided)
 *   dryRun?: boolean       // Test mode without making changes
 * }
 */
export const fixMixedColorVariations: PayloadHandler = async (req) => {
  const { payload, user } = req

  // Check authentication and admin role
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admins can run this
  const userDoc = await payload.findByID({
    collection: 'users',
    id: typeof user === 'string' ? user : user.id,
  })

  if (userDoc.role !== 'admin') {
    return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }

  const body = await req.json?.()
  const { variationId, limit = 10, dryRun = false } = body || {}

  if (variationId) {
    payload.logger.info(`[FixMixedColors] Testing with specific variation: ${variationId} (dryRun: ${dryRun})`)
  } else {
    payload.logger.info(`[FixMixedColors] Starting scan (limit: ${limit}, dryRun: ${dryRun})`)
  }

  try {
    let variations: any

    // If variationId provided, fetch that specific variation
    if (variationId) {
      const variation = await payload.findByID({
        collection: 'variations',
        id: variationId,
        depth: 2,
      })
      variations = { docs: [variation] }
    } else {
      // Find approved variations with multiple images
      variations = await payload.find({
        collection: 'variations',
        where: {
          imageValidationStatus: { equals: 'approved' },
          status: { not_equals: 'archived' },
        },
        limit,
        depth: 2,
      })
    }

    payload.logger.info(`[FixMixedColors] Found ${variations.docs.length} approved variations to check`)

    const results = {
      scanned: 0,
      mixedColorsDetected: 0,
      variationsSplit: 0,
      newVariationsCreated: 0,
      errors: [] as string[],
      details: [] as any[],
    }

    for (const variation of variations.docs) {
      try {
        const images = variation.images as any[]

        if (!images || images.length < 2) {
          continue // Skip if less than 2 images
        }

        results.scanned++

        payload.logger.info(`[FixMixedColors] Checking variation ${variation.id} with ${images.length} images`)

        // Analyze colors in all images
        const colorAnalysis = await analyzeImageColors(payload, images)

        // Group images by color
        const colorGroups = groupImagesByColor(colorAnalysis)

        payload.logger.info(
          `[FixMixedColors] Variation ${variation.id}: Found ${colorGroups.length} color groups - ${colorGroups.map(g => `${g.color} (${g.imageIds.length})`).join(', ')}`
        )

        // If multiple colors detected, split the variation
        if (colorGroups.length > 1) {
          results.mixedColorsDetected++

          if (!dryRun) {
            const newVariations = await splitVariationByColor(
              payload,
              variation,
              colorGroups
            )
            results.variationsSplit++
            results.newVariationsCreated += newVariations.length // All variations are new

            results.details.push({
              originalVariationId: variation.id,
              originalVariationName: variation.title,
              originalVariationStatus: 'archived',
              colorGroups: colorGroups.map(g => ({
                color: g.color,
                imageCount: g.imageIds.length,
              })),
              newVariations: newVariations.map(v => ({
                id: v.id,
                title: v.title,
                color: v.color,
              })),
            })
          } else {
            // Dry run: simulate the full structure
            const preview = await simulateSplitByColor(
              payload,
              variation,
              colorGroups
            )
            results.details.push(preview)
          }
        }
      } catch (error) {
        const errorMsg = `Error processing variation ${variation.id}: ${error}`
        payload.logger.error(`[FixMixedColors] ${errorMsg}`)
        results.errors.push(errorMsg)
      }
    }

    payload.logger.info(
      `[FixMixedColors] Completed: ${results.scanned} scanned, ${results.mixedColorsDetected} with mixed colors, ${results.variationsSplit} split`
    )

    return Response.json({
      success: true,
      dryRun,
      results,
    })
  } catch (error) {
    payload.logger.error(`[FixMixedColors] Fatal error: ${error}`)
    return Response.json({
      success: false,
      error: String(error),
    }, { status: 500 })
  }
}

/**
 * Analyze and group images by visual similarity using OpenAI Vision
 * Returns color groups based on complete visual similarity (pattern, color, material, etc.)
 */
async function analyzeImageColors(
  payload: any,
  images: any[]
): Promise<ImageColorAnalysis[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

  const serverUrl = getServerSideURL()

  // Fetch full image documents
  const imageIds = images.map((img) => (typeof img === 'string' ? img : img.id))
  const mediaDocs = await payload.find({
    collection: 'media',
    where: { id: { in: imageIds } },
    limit: imageIds.length,
  })

  // Sort to match original order
  const sortedMediaDocs = imageIds
    .map((id) => mediaDocs.docs.find((doc: any) => doc.id === id))
    .filter((doc): doc is any => doc !== undefined)

  // Build content array with all images
  const imageContents: OpenAI.Chat.Completions.ChatCompletionContentPart[] = []

  for (let i = 0; i < sortedMediaDocs.length; i++) {
    const mediaDoc = sortedMediaDocs[i]
    if (!mediaDoc.url) continue

    const fullUrl = mediaDoc.url.startsWith('http')
      ? mediaDoc.url
      : `${serverUrl}${mediaDoc.url}`

    imageContents.push({
      type: 'image_url',
      image_url: {
        url: fullUrl,
        detail: 'high',
      },
    })
  }

  // Add the comprehensive prompt
  imageContents.push({
    type: 'text',
    text: `You are a fashion product image classifier.

Your task is to group these ${sortedMediaDocs.length} product images into color variations.

These images may include garments, footwear, bags, hats, accessories, or other fashion items.

CRITICAL RULES - Follow these EXACTLY:

1. Only group images together if the products are IDENTICAL in ALL of these:
   - Exact same color theme (white with white, yellow with yellow, etc.)
   - Pattern structure (stripes with stripes, solid with solid)
   - Color layout and placement
   - Material texture
   - Graphic elements or prints
   - Panel construction
   - Stitching or trim details
   - Overall design structure

2. NEVER group images if they differ in ANY of these:
   - Base color (white ≠ yellow ≠ beige ≠ cream)
   - Pattern layout or structure
   - Color placement or order
   - Print graphics
   - Stripe width or spacing
   - Material contrast
   - Panel segmentation
   - Hardware or trim color

3. COLOR MATCHING MUST BE STRICT:
   - White/cream items can only group with white/cream
   - Yellow items can NEVER group with white, beige, or cream
   - Beige/tan items are separate from white
   - Each distinct color gets its own variation

4. When in doubt, CREATE SEPARATE VARIATIONS - it's better to have more variations than incorrectly grouped items.

5. If two images show the exact same item (only lighting, angle, or background differs), group them together.

6. Variation names must:
   - Be short and clean
   - Describe the overall color theme accurately
   - Not use slashes (/)
   - Not use commas
   - Follow natural retail naming style

Examples:
- White Cream Solid → can group white and cream IF they look the same
- Bright Yellow Solid → separate from white/cream
- Beige Tan Solid → separate from white and yellow
- Navy Teal White Stripe → specific stripe pattern
- All Black Matte → all black only

Image indexes are 1-based (first image is index 1, second is index 2, etc.).

IMPORTANT: Double-check your grouping before responding. Make sure NO white items are grouped with yellow items.

Return output in this JSON format:
{
  "variations": [
    {
      "variation_name": "White Cream Solid",
      "image_indexes": [1, 2]
    },
    {
      "variation_name": "Bright Yellow Solid",
      "image_indexes": [3]
    },
    {
      "variation_name": "Beige Tan Patchwork",
      "image_indexes": [4]
    }
  ]
}`,
  })

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 800,
      messages: [
        {
          role: 'user',
          content: imageContents,
        },
      ],
    })

    const content = response.choices[0]?.message?.content || '{}'
    const result = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim())

    payload.logger.info(
      `[FixMixedColors] AI grouped ${sortedMediaDocs.length} images into ${result.variations?.length || 0} variations`
    )

    // Convert variation groups to ImageColorAnalysis format
    const imageAnalysis: ImageColorAnalysis[] = []

    if (result.variations && Array.isArray(result.variations)) {
      for (const variation of result.variations) {
        const variationName = variation.variation_name?.toLowerCase() || 'unknown'
        const indexes = variation.image_indexes || []

        for (const index of indexes) {
          // Convert 1-based index to 0-based
          const mediaDoc = sortedMediaDocs[index - 1]
          if (mediaDoc) {
            imageAnalysis.push({
              imageId: mediaDoc.id,
              imageUrl: mediaDoc.url,
              detectedColor: variationName,
              confidence: 'high',
            })
          }
        }
      }
    }

    payload.logger.info(
      `[FixMixedColors] Processed ${imageAnalysis.length} image assignments`
    )

    return imageAnalysis
  } catch (error) {
    payload.logger.error(`[FixMixedColors] Failed to analyze images: ${error}`)

    // Fallback: treat each image as separate variation
    return sortedMediaDocs.map((doc) => ({
      imageId: doc.id,
      imageUrl: doc.url,
      detectedColor: 'unknown',
      confidence: 'low',
    }))
  }
}


/**
 * Group images by detected color
 */
function groupImagesByColor(analysis: ImageColorAnalysis[]): ColorGroup[] {
  const colorMap = new Map<string, ColorGroup>()

  for (const item of analysis) {
    // Use exact color name from AI detection
    const color = item.detectedColor.toLowerCase().trim()

    if (!colorMap.has(color)) {
      colorMap.set(color, {
        color,
        imageIds: [],
        images: [],
      })
    }

    const group = colorMap.get(color)!
    group.imageIds.push(item.imageId)
    group.images.push({
      id: item.imageId,
      url: item.imageUrl,
    })
  }

  // Sort by number of images (largest first)
  return Array.from(colorMap.values()).sort((a, b) => b.imageIds.length - a.imageIds.length)
}

/**
 * Simulate splitting a variation by color (for dry run mode)
 * Returns full structure of what would be created
 */
async function simulateSplitByColor(
  payload: any,
  originalVariation: any,
  colorGroups: ColorGroup[]
): Promise<any> {
  // Fetch original SKUs to show what would be duplicated
  const originalSkus = await payload.find({
    collection: 'skus',
    where: {
      variation: { equals: originalVariation.id },
    },
    limit: 100,
    depth: 2,
  })

  const newVariations = []

  for (let i = 0; i < colorGroups.length; i++) {
    const colorGroup = colorGroups[i]
    const newColor = colorGroup.color

    // Simulate the variation that would be created
    const simulatedVariation = {
      title: `${originalVariation.title?.replace(/\s*\([^)]*\)$/, '').replace(/\s*-\s*[^-]*$/, '') || 'Variation'} - ${newColor.charAt(0).toUpperCase() + newColor.slice(1)}`,
      color: newColor,
      imageCount: colorGroup.imageIds.length,
      imageIds: colorGroup.imageIds,
      status: 'draft (will be activated after SKUs created)',
      skus: originalSkus.docs.map((sku: any) => ({
        price: sku.price,
        sellingPrice: sku.sellingPrice,
        stock: sku.stock,
        isActive: sku.isActive,
        status: sku.status,
        skuOptions: sku.skuOptions?.map((opt: any) => ({
          option: typeof opt.option === 'object' ? opt.option.name : opt.option,
          value: typeof opt.value === 'object' ? opt.value.name : opt.value,
        })) || [],
        barcode: sku.barcode,
        weight: sku.weight,
        compareAtPrice: sku.compareAtPrice,
        flashSaleEnabled: sku.flashSaleEnabled,
        flashSaleEndDate: sku.flashSaleEndDate,
      })),
    }

    newVariations.push(simulatedVariation)
  }

  return {
    originalVariationId: originalVariation.id,
    originalVariationName: originalVariation.title,
    originalVariationStatus: 'would be archived',
    colorGroups: colorGroups.map(g => ({
      color: g.color,
      imageCount: g.imageIds.length,
    })),
    newVariations,
    action: 'DRY RUN - No changes made',
  }
}

/**
 * Find or create a color AttributeOption
 */
async function findOrCreateColorOption(
  payload: any,
  colorName: string
): Promise<string | null> {
  try {
    // First, find the Color attribute
    const colorAttributes = await payload.find({
      collection: 'attributes',
      where: {
        name: { equals: 'Color' },
      },
      limit: 1,
    })

    if (colorAttributes.docs.length === 0) {
      payload.logger.warn('[FixMixedColors] Color attribute not found')
      return null
    }

    const colorAttributeId = colorAttributes.docs[0].id

    // Check if color option already exists (case-insensitive search)
    const existingOptions = await payload.find({
      collection: 'attributeOptions',
      where: {
        and: [
          { attribute: { equals: colorAttributeId } },
          { name: { contains: colorName } },
        ],
      },
      limit: 10,
    })

    // Do case-insensitive exact match in case contains returned multiple results
    const existingOption = existingOptions.docs.find(
      (opt: any) => opt.name?.toLowerCase() === colorName.toLowerCase()
    )

    if (existingOption) {
      payload.logger.info(`[FixMixedColors] Found existing color option: ${existingOption.name} (${existingOption.id})`)
      return existingOption.id
    }

    // Create new color option with slug
    payload.logger.info(`[FixMixedColors] Creating new color option: ${colorName}`)

    // Generate proper name (Title Case)
    const properName = colorName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    // Generate slug (lowercase, spaces to hyphens, remove special chars)
    const slug = colorName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen

    const newOption = await payload.create({
      collection: 'attributeOptions',
      data: {
        name: properName,
        slug: slug,
        attribute: colorAttributeId,
      },
    })

    payload.logger.info(`[FixMixedColors] Created color option: ${newOption.name} (slug: ${slug}, id: ${newOption.id})`)
    return newOption.id
  } catch (error) {
    payload.logger.error(`[FixMixedColors] Error finding/creating color option: ${error}`)
    return null
  }
}

/**
 * Update variants array to use new color
 * Ensures Color is always the FIRST attribute in the array
 */
function updateVariantsWithColor(
  variants: any[] | undefined,
  colorAttributeId: string,
  colorOptionId: string
): any[] {
  // Color variant object
  const colorVariant = {
    variant: colorAttributeId,
    value: colorOptionId,
  }

  if (!variants || variants.length === 0) {
    return [colorVariant]
  }

  // Filter out existing color variant (if any) and keep other variants
  const otherVariants = variants.filter((v: any) => {
    const variantId = typeof v.variant === 'string' ? v.variant : v.variant?.id
    return variantId !== colorAttributeId
  })

  // Return with Color FIRST, then other variants
  return [colorVariant, ...otherVariants]
}

/**
 * Split a variation into multiple variations by color
 * Keeps the original variation with the largest color group
 * Creates new variations for other colors
 */
async function splitVariationByColor(
  payload: any,
  originalVariation: any,
  colorGroups: ColorGroup[]
): Promise<any[]> {
  const results: any[] = []

  // Get Color attribute ID
  const colorAttributes = await payload.find({
    collection: 'attributes',
    where: {
      name: { equals: 'Color' },
    },
    limit: 1,
  })

  if (colorAttributes.docs.length === 0) {
    payload.logger.error('[FixMixedColors] Color attribute not found - cannot proceed')
    throw new Error('Color attribute not found')
  }

  const colorAttributeId = colorAttributes.docs[0].id

  // Fetch original SKUs with full depth to get all related data
  const originalSkus = await payload.find({
    collection: 'skus',
    where: {
      variation: { equals: originalVariation.id },
    },
    limit: 100,
    depth: 2, // Fetch related data like skuOptions
  })

  payload.logger.info(
    `[FixMixedColors] Found ${originalSkus.docs.length} SKUs to duplicate. First SKU has ${originalSkus.docs[0]?.skuOptions?.length || 0} skuOptions`
  )

  const newVariationIds: string[] = []

  // Get the style ID
  const styleId = typeof originalVariation.style === 'string'
    ? originalVariation.style
    : originalVariation.style?.id

  // Create new variations for ALL color groups (don't modify original)
  for (let i = 0; i < colorGroups.length; i++) {
    const colorGroup = colorGroups[i]
    const newColor = colorGroup.color

    payload.logger.info(
      `[FixMixedColors] Creating new variation ${i + 1}/${colorGroups.length} for color: ${newColor} (${colorGroup.imageIds.length} images)`
    )

    // Find or create color option for this color
    const colorOptionId = await findOrCreateColorOption(payload, newColor)
    if (!colorOptionId) {
      payload.logger.error(`[FixMixedColors] Failed to create color option for: ${newColor}`)
      continue
    }

    // Update variants with new color
    const newVariants = updateVariantsWithColor(
      originalVariation.variants,
      colorAttributeId,
      colorOptionId
    )

    // Create new variation
    const newVariation = await payload.create({
      collection: 'variations',
      data: {
        title: `${originalVariation.title?.replace(/\s*\([^)]*\)$/, '').replace(/\s*-\s*[^-]*$/, '') || 'Variation'} - ${newColor.charAt(0).toUpperCase() + newColor.slice(1)}`,
        style: styleId,
        images: colorGroup.imageIds,
        variants: newVariants,
        status: 'draft', // Will be activated after SKUs are created
        imageValidationStatus: 'approved', // Auto-approve since we split by color
        imageValidationScore: 85,
        imageValidationNotes: `Auto-approved after color split from variation ${originalVariation.id}. All ${colorGroup.imageIds.length} images verified to be ${newColor}.`,
      },
      context: {
        skipHooks: false,
        skipImageValidation: true, // Skip validation hook since we're manually setting status
      },
    })

    results.push(newVariation)
    newVariationIds.push(newVariation.id)

    payload.logger.info(`[FixMixedColors] Created new variation ${newVariation.id} for color ${newColor}`)

    // Duplicate SKUs for this new variation
    if (originalSkus.docs.length > 0) {
      payload.logger.info(
        `[FixMixedColors] Duplicating ${originalSkus.docs.length} SKUs for variation ${newVariation.id}`
      )

      for (const originalSku of originalSkus.docs) {
        try {
          // Create duplicate SKU with new variation reference
          const newSkuData: any = {
            variation: newVariation.id,
            price: originalSku.price,
            sellingPrice: originalSku.sellingPrice,
            stock: originalSku.stock,
            isActive: originalSku.isActive,
            status: originalSku.status,
          }

          // Copy SKU options if they exist (the field is called 'skuOptions', not 'options')
          if (originalSku.skuOptions && Array.isArray(originalSku.skuOptions)) {
            newSkuData.skuOptions = originalSku.skuOptions.map((opt: any) => ({
              option: typeof opt.option === 'string' ? opt.option : opt.option?.id,
              value: typeof opt.value === 'string' ? opt.value : opt.value?.id,
            }))
          }

          // Copy other optional fields
          if (originalSku.barcode) newSkuData.barcode = originalSku.barcode
          if (originalSku.weight) newSkuData.weight = originalSku.weight
          if (originalSku.compareAtPrice) newSkuData.compareAtPrice = originalSku.compareAtPrice
          if (originalSku.flashSaleEnabled) {
            newSkuData.flashSaleEnabled = originalSku.flashSaleEnabled
            if (originalSku.flashSaleEndDate) {
              newSkuData.flashSaleEndDate = originalSku.flashSaleEndDate
            }
          }

          const newSku = await payload.create({
            collection: 'skus',
            data: newSkuData,
          })

          payload.logger.info(
            `[FixMixedColors] Created SKU ${newSku.id} for variation ${newVariation.id} with ${newSku.skuOptions?.length || 0} skuOptions`
          )
        } catch (error) {
          payload.logger.error(
            `[FixMixedColors] Failed to duplicate SKU ${originalSku.id}: ${error}. Original SKU data: ${JSON.stringify({ skuOptions: originalSku.skuOptions, price: originalSku.price, stock: originalSku.stock })}`
          )
        }
      }

      // Activate the variation now that SKUs are created
      await payload.update({
        collection: 'variations',
        id: newVariation.id,
        data: {
          status: 'active',
        },
        context: {
          skipHooks: true,
        },
      })

      payload.logger.info(`[FixMixedColors] Activated variation ${newVariation.id} after SKU creation`)
    }
  }

  // Archive the original variation now that we've created new ones
  payload.logger.info(
    `[FixMixedColors] Archiving original variation ${originalVariation.id} - created ${newVariationIds.length} new variations`
  )

  await payload.update({
    collection: 'variations',
    id: originalVariation.id,
    data: {
      status: 'archived',
      imageValidationNotes: `Split into ${newVariationIds.length} color-specific variations: ${newVariationIds.join(', ')}`,
    },
    context: {
      skipHooks: true,
      skipImageValidation: true,
    },
  })

  return results
}
