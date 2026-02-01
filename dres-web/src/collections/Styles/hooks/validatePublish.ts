import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

interface ValidationError {
  field: string
  message: string
}

/**
 * Validates that a style can be published.
 * Requirements:
 * 1. Style has all required fields filled (title, department, collection, category, brand)
 * 2. Style has at least one complete variation (with images and at least one attribute)
 * 3. No variation has rejected images (must be approved or pending)
 * 4. Each variation has at least one complete SKU (with price and at least one SKU option)
 */
export const validatePublish: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  // Only validate when status is changing to 'published'
  const isPublishing = data?.status === 'published' && originalDoc?.status !== 'published'

  if (!isPublishing) {
    return data
  }

  const errors: ValidationError[] = []
  const styleId = originalDoc?.id

  // 1. Validate style required fields
  const requiredFields = [
    { field: 'title', label: 'Title' },
    { field: 'department', label: 'Department' },
    { field: 'collection', label: 'Collection' },
    { field: 'category', label: 'Category' },
    { field: 'brand', label: 'Brand' },
  ]

  for (const { field, label } of requiredFields) {
    const value = data?.[field] ?? originalDoc?.[field]
    if (!value) {
      errors.push({
        field,
        message: `${label} is required`,
      })
    }
  }

  // If basic fields are missing, return early
  if (errors.length > 0) {
    throw new APIError(
      `Cannot publish: ${errors.map((e) => e.message).join(', ')}`,
      400
    )
  }

  // 2. Fetch variations for this style
  const variations = await req.payload.find({
    collection: 'variations',
    where: {
      style: { equals: styleId },
      status: { equals: 'active' },
    },
    depth: 1,
    limit: 100,
  })

  if (variations.docs.length === 0) {
    throw new APIError(
      'Cannot publish: Style must have at least one active variation',
      400
    )
  }

  // 3. Check if any variation has rejected images
  const variationsWithRejectedImages = variations.docs.filter(
    (v) => v.imageValidationStatus === 'rejected'
  )
  if (variationsWithRejectedImages.length > 0) {
    throw new APIError(
      'Cannot publish: Some variations have rejected images. Please upload new images for those variations.',
      400
    )
  }

  // 4. Validate each variation has required fields and at least one complete SKU
  let hasCompleteVariation = false

  for (const variation of variations.docs) {
    const variationErrors: string[] = []

    // Check variation has images
    const images = variation.images as unknown[]
    if (!images || images.length === 0) {
      variationErrors.push('missing images')
    }

    // Check image validation status (should be approved or pending, not rejected)
    const imageValidationStatus = variation.imageValidationStatus as string | undefined
    if (imageValidationStatus === 'rejected') {
      variationErrors.push('images were rejected')
    }

    // Check variation has at least one attribute (variant)
    const variants = variation.variants as unknown[]
    if (!variants || variants.length === 0) {
      variationErrors.push('missing variation attributes')
    }

    // Fetch SKUs for this variation
    const skus = await req.payload.find({
      collection: 'skus',
      where: {
        variation: { equals: variation.id },
        status: { equals: 'active' },
      },
      depth: 1,
      limit: 100,
    })

    if (skus.docs.length === 0) {
      variationErrors.push('no active SKUs')
    } else {
      // Check if at least one SKU is complete
      let hasCompleteSku = false

      for (const sku of skus.docs) {
        const skuOptions = sku.skuOptions as unknown[]
        const hasOptions = skuOptions && skuOptions.length > 0
        const hasPrice = typeof sku.price === 'number' && sku.price > 0

        if (hasOptions && hasPrice) {
          hasCompleteSku = true
          break
        }
      }

      if (!hasCompleteSku) {
        variationErrors.push('no complete SKU (needs at least one option and price)')
      }
    }

    // If this variation is complete, we're good
    if (variationErrors.length === 0) {
      hasCompleteVariation = true
      break
    }
  }

  if (!hasCompleteVariation) {
    throw new APIError(
      'Cannot publish: Style must have at least one complete variation with images, at least one attribute, and a SKU with at least one option and price',
      400
    )
  }

  return data
}
