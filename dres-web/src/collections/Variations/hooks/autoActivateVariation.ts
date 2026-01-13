import type { CollectionAfterChangeHook } from 'payload'

interface VariantItem {
  variant?: string | { id: string }
  value?: string | { id: string }
}

interface VariationDoc {
  id: string
  status?: 'active' | 'draft' | 'archived'
  style?: string | { id: string }
  images?: (string | { id: string })[]
  variants?: VariantItem[]
}

/**
 * Auto-activates a variation when all requirements are met:
 * - At least 3 images
 * - At least 1 variant attribute
 * - At least 1 SKU with valid price
 * 
 * Only applies to 'draft' variations - won't change 'archived' status
 */
export const autoActivateVariation: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  const variation = doc as VariationDoc
  
  // Only auto-activate draft variations
  if (variation.status !== 'draft') {
    return doc
  }
  
  // Check images (need at least 3)
  const images = variation.images || []
  if (images.length < 3) {
    return doc
  }
  
  // Check variants (need at least 1 complete variant)
  const variants = variation.variants || []
  const completeVariants = variants.filter(v => v.variant && v.value)
  if (completeVariants.length < 1) {
    return doc
  }
  
  // Check SKUs (need at least 1 with valid price)
  const skus = await req.payload.find({
    collection: 'skus',
    where: {
      variation: { equals: variation.id },
      isActive: { not_equals: false },
    },
    limit: 10,
    depth: 0,
  })
  
  const validSkus = skus.docs.filter((sku) => {
    const hasPrice = (sku.price && sku.price > 0) || (sku.sellingPrice && sku.sellingPrice > 0)
    const hasStock = sku.stock === null || sku.stock === undefined || sku.stock > 0
    return hasPrice && hasStock
  })
  
  if (validSkus.length < 1) {
    return doc
  }
  
  // All conditions met - auto-activate!
  req.payload.logger.info(`Auto-activating variation ${variation.id} - all requirements met`)
  
  await req.payload.update({
    collection: 'variations',
    id: variation.id,
    data: {
      status: 'active',
    },
    depth: 0,
  })
  
  return {
    ...doc,
    status: 'active',
  }
}
