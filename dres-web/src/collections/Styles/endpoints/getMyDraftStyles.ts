import type { PayloadHandler } from 'payload'

/**
 * GET /api/styles/my-drafts
 * Fetch the current user's incomplete/draft styles
 * 
 * A style is considered a draft if:
 * 1. It has no variations
 * 2. Its variations have no SKUs
 * 3. Missing required fields (variations without images, SKUs without price/stock)
 * 
 * Returns styles with a "stepsLeft" count indicating what's missing
 */
export const getMyDraftStyles: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // Fetch all draft styles for the current user
    // Include styles where status is 'draft' OR status is not set (for backwards compatibility)
    const stylesResult = await payload.find({
      collection: 'styles',
      where: {
        seller: { equals: user.id },
        or: [
          { status: { equals: 'draft' } },
          { status: { exists: false } },
        ]
      },
      depth: 3,
      limit: 100,
      sort: '-updatedAt',
    })


    // Process each style to determine draft status and steps left
    const drafts: DraftStyle[] = []

    for (const style of stylesResult.docs) {
      const stepsAnalysis = analyzeStyleCompletion(style)
      
      // Only include styles that are incomplete (have steps left)
        // Get the first variation's image as thumbnail
        let thumbnail: string | null = null
        
        if (style.variations?.docs && style.variations.docs.length > 0) {
          const firstVariation = style.variations.docs[0]
          if (typeof firstVariation === 'object' && firstVariation?.images && firstVariation.images.length > 0) {
            const firstImage = firstVariation.images[0]
            if (typeof firstImage === 'object' && 'url' in firstImage) {
              thumbnail = firstImage.url || null
            } else if (typeof firstImage === 'string') {
              // Image is just an ID, fetch the actual image
              try {
                const imageDoc = await payload.findByID({
                  collection: 'media',
                  id: firstImage,
                })
                if (imageDoc && imageDoc.url) {
                  thumbnail = imageDoc.url
                }
              } catch {
                // Ignore error, thumbnail will be null
              }
            }
          }
        }


        // Get brand name
        let brandName: string | null = null
        if (style.brand && typeof style.brand === 'object') {
          brandName = style.brand.name || null
        }

        drafts.push({
          id: style.id,
          title: style.title || '',
          brandName,
          thumbnail,
          stepsLeft: stepsAnalysis.stepsLeft,
          missingSteps: stepsAnalysis.missingSteps,
          updatedAt: style.updatedAt,
          createdAt: style.createdAt,
        })
      }

      console.log(drafts)

    return Response.json({
      drafts,
      totalDrafts: drafts.length,
    })
  } catch (error) {
    payload.logger.error(`Error fetching draft styles: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch draft styles',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

interface DraftStyle {
  id: string
  title: string
  brandName: string | null
  thumbnail: string | null
  stepsLeft: number
  missingSteps: string[]
  updatedAt: string
  createdAt: string
}

interface StyleCompletionAnalysis {
  stepsLeft: number
  missingSteps: string[]
}

/**
 * Analyzes a style to determine what steps are remaining
 */
function analyzeStyleCompletion(style: any): StyleCompletionAnalysis {
  const missingSteps: string[] = []

  // Check for basic style details (Step 1)
  if (!style.title || style.title.trim() === '') {
    missingSteps.push('title')
  }
  if (!style.brand) {
    missingSteps.push('brand')
  }
  if (!style.category) {
    missingSteps.push('category')
  }
  if (!style.description) {
    missingSteps.push('description')
  }

  // Check if style has variations (Step 2)
  const variations = style.variations?.docs || []
  if (variations.length === 0) {
    missingSteps.push('variations')
    // If no variations, also missing SKUs
    missingSteps.push('skus')
    return { stepsLeft: missingSteps.length, missingSteps }
  }

  // Check variations for completeness
  let hasVariationWithImages = false
  let hasVariationWithSKUs = false

  for (const variation of variations) {
    if (typeof variation === 'string') continue

    // Check if variation has images
    if (variation.images && variation.images.length > 0) {
      hasVariationWithImages = true
    }

    // Check if variation has SKUs
    const skus = variation.skus?.docs || []
    if (skus.length > 0) {
      hasVariationWithSKUs = true
      
      // Check SKU completeness
      for (const sku of skus) {
        if (typeof sku === 'string') continue
        
        // Check if SKU has required fields
        if (!sku.price || sku.price <= 0) {
          if (!missingSteps.includes('sku_pricing')) {
            missingSteps.push('sku_pricing')
          }
        }
        if (sku.stock === undefined || sku.stock === null) {
          if (!missingSteps.includes('sku_stock')) {
            missingSteps.push('sku_stock')
          }
        }
      }
    }
  }

  if (!hasVariationWithImages) {
    missingSteps.push('variation_images')
  }

  if (!hasVariationWithSKUs) {
    missingSteps.push('skus')
  }

  return {
    stepsLeft: missingSteps.length,
    missingSteps,
  }
}
