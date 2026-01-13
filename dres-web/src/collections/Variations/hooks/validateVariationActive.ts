import type { CollectionBeforeChangeHook } from 'payload'

interface VariantItem {
  variant?: string | { id: string }
  value?: string | { id: string }
}

interface VariationData {
  status?: 'active' | 'archived'
  style?: string | { id: string }
  images?: (string | { id: string })[]
  variants?: VariantItem[]
}

/**
 * Validates that a variation meets all requirements before being set to active:
 * - Must have at least one image
 * - Must have a linked style
 * - Must have at least one variant attribute
 * - Must have at least one SKU with price and stock
 */
export const validateVariationActive: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  const variationData = data as VariationData
  
  // Only validate when setting status to active
  if (variationData.status !== 'active') {
    return data
  }
  
  // If already active and not changing status, skip validation
  if (operation === 'update' && originalDoc?.status === 'active' && !('status' in data)) {
    return data
  }
  
  const errors: string[] = []
  
  // Check for images - use new data or fall back to original
  const images = variationData.images ?? originalDoc?.images
  if (!images || !Array.isArray(images) || images.length === 0) {
    errors.push('At least one image is required to activate a variation')
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
      },
      limit: 100,
      depth: 0,
    })
    
    if (skus.docs.length === 0) {
      errors.push('At least one SKU with pricing is required to activate a variation')
    } else {
      // Check if at least one SKU has valid price
      const validSkus = skus.docs.filter((sku) => {
        const hasPrice = (sku.price && sku.price > 0) || (sku.sellingPrice && sku.sellingPrice > 0)
        return hasPrice
      })
      
      if (validSkus.length === 0) {
        errors.push('At least one SKU must have a valid price set')
      }
      
      // Check if any active SKU has stock info
      const activeSkusWithStock = skus.docs.filter((sku) => {
        return sku.isActive !== false && (sku.stock === null || sku.stock === undefined || sku.stock > 0)
      })
      
      if (activeSkusWithStock.length === 0) {
        errors.push('At least one SKU must be active and in stock')
      }
    }
  } else if (operation === 'create') {
    // On create, SKUs don't exist yet - allow but warn
    req.payload.logger.warn('Creating active variation without SKUs - SKUs should be added after creation')
  }
  
  // If there are errors, throw a validation error
  if (errors.length > 0) {
    throw new Error(`Cannot activate variation: ${errors.join('; ')}`)
  }
  
  return data
}
