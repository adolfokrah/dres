import type { CollectionBeforeChangeHook } from 'payload'

interface VariantItem {
  variant?: string | { id: string }
  value?: string | { id: string }
}

interface VariationData {
  status?: 'active' | 'draft' | 'archived'
  style?: string | { id: string }
  images?: (string | { id: string })[]
  variants?: VariantItem[]
  imageValidationStatus?: 'pending' | 'approved' | 'rejected'
}

/**
 * Validates that a variation meets all requirements before being set to active:
 * - Must have at least one image
 * - Must have a linked style
 * - Must have at least one variant attribute
 * - Must have at least one SKU with price and stock
 * 
 * Draft variations can be created/updated without these requirements.
 */
export const validateVariationActive: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  const variationData = data as VariationData

  // Reset imageValidationStatus to 'pending' when images change
  // This ensures validation runs again after image updates
  if (operation === 'update' && variationData.images !== undefined && !req.context?.skipImageValidation) {
    const currentImageIds = (variationData.images || []).map((img) =>
      typeof img === 'string' ? img : img.id
    )
    const previousImageIds = (originalDoc?.images || []).map((img: string | { id: string }) =>
      typeof img === 'string' ? img : img.id
    )

    // Check if images changed
    const imagesChanged =
      currentImageIds.length !== previousImageIds.length ||
      currentImageIds.some((id, i) => id !== previousImageIds[i])

    if (imagesChanged && currentImageIds.length > 0) {
      variationData.imageValidationStatus = 'pending'
      req.payload.logger.info(
        `[ValidateVariationActive] Images changed for variation ${originalDoc?.id} - resetting imageValidationStatus to pending`
      )
    }
  }

  // Only validate when explicitly setting status to 'active'
  // Skip validation for draft/archived status or when status isn't being changed
  const newStatus = variationData.status
  const oldStatus = originalDoc?.status

  // If not setting to active, allow the operation
  if (newStatus !== 'active') {
    return data
  }
  
  // If already active and not explicitly changing status, skip validation
  if (operation === 'update' && oldStatus === 'active' && !('status' in data)) {
    return data
  }
  
  const errors: string[] = []
  
  // Check for images - use new data or fall back to original
  const images = variationData.images ?? originalDoc?.images
  if (!images || !Array.isArray(images) || images.length === 0) {
    errors.push('At least one image is required to activate a variation')
  }

  // Check image validation status - cannot activate if images were rejected
  const imageValidationStatus = variationData.imageValidationStatus ?? originalDoc?.imageValidationStatus
  if (imageValidationStatus === 'rejected') {
    errors.push('Cannot activate variation: images were rejected. Please upload new images.')
  }
  
  // Check for style - use new data or fall back to original
  const style = variationData.style ?? originalDoc?.style
  if (!style) {
    errors.push('A style must be linked to activate a variation')
  }
  
  // Check for variants (attributes) - use new data or fall back to original
  const variants = variationData.variants ?? originalDoc?.variants
  if (!variants || !Array.isArray(variants) || variants.length === 0) {
    errors.push('At least one variant attribute is required (e.g., Color)')
  } else {
    // Validate each variant has both attribute and value
    const incompleteVariants = variants.filter(
      (v) => !v.variant || !v.value
    )
    if (incompleteVariants.length > 0) {
      errors.push('All variant attributes must have both an attribute and value selected')
    }
  }
  
  // Check for SKUs with valid price and stock
  // Need to fetch SKUs since they're in a separate collection
  const variationId = originalDoc?.id
  if (variationId) {
    const skus = await req.payload.find({
      collection: 'skus',
      where: {
        variation: { equals: variationId },
        status: { not_equals: 'archived' }, // Only consider non-archived SKUs
      },
      limit: 100,
      depth: 0,
    })
    
    if (skus.docs.length === 0) {
      errors.push('At least one SKU with pricing is required to activate a variation')
    } else {
      // Check if at least one SKU has valid price and is active
      const validSkus = skus.docs.filter((sku) => {
        const hasPrice = (sku.price && sku.price > 0) || (sku.sellingPrice && sku.sellingPrice > 0)
        const isActive = sku.isActive !== false && sku.status !== 'archived'
        return hasPrice && isActive
      })
      
      if (validSkus.length === 0) {
        errors.push('At least one SKU must have a valid price and be active')
      }
      
      // Check if any active SKU has stock info
      const activeSkusWithStock = skus.docs.filter((sku) => {
        const isActive = sku.isActive !== false && sku.status !== 'archived'
        return isActive && (sku.stock === null || sku.stock === undefined || sku.stock > 0)
      })
      
      if (activeSkusWithStock.length === 0) {
        errors.push('At least one SKU must be active and in stock')
      }
    }
  } else if (operation === 'create') {
    // On create with active status, SKUs don't exist yet - this is an error
    errors.push('Cannot create a variation as active - create as draft first, add SKUs, then activate')
  }
  
  // If there are errors, throw a validation error
  if (errors.length > 0) {
    throw new Error(`Cannot activate variation: ${errors.join('; ')}`)
  }
  
  return data
}
