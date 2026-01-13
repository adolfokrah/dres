import type { CollectionAfterChangeHook } from 'payload'

interface SkuDoc {
  id: string
  variation?: string | { id: string }
  price?: number
  sellingPrice?: number
  stock?: number | null
  isActive?: boolean
}

/**
 * After a SKU is created/updated, check if the parent variation
 * should be auto-activated (all requirements met)
 */
export const checkVariationActivation: CollectionAfterChangeHook = async ({
  doc,
  req,
}) => {
  const sku = doc as SkuDoc
  
  // Get variation ID
  const variationId = typeof sku.variation === 'object' 
    ? sku.variation?.id 
    : sku.variation
  
  if (!variationId) {
    return doc
  }
  
  // Fetch the variation
  const variation = await req.payload.findByID({
    collection: 'variations',
    id: variationId,
    depth: 1,
  })
  
  // Only process draft variations
  const status = variation.status as string | null | undefined
  if (status !== 'draft') {
    return doc
  }
  
  // Check images (need at least 3)
  const images = variation.images || []
  if (images.length < 3) {
    return doc
  }
  
  // Check variants (need at least 1 complete variant)
  const variants = (variation.variants || []) as Array<{ variant?: unknown; value?: unknown }>
  const completeVariants = variants.filter(v => v.variant && v.value)
  if (completeVariants.length < 1) {
    return doc
  }
  
  // Check SKUs (need at least 1 with valid price)
  const skus = await req.payload.find({
    collection: 'skus',
    where: {
      variation: { equals: variationId },
      isActive: { not_equals: false },
    },
    limit: 10,
    depth: 0,
  })
  
  const validSkus = skus.docs.filter((s) => {
    const hasPrice = (s.price && s.price > 0) || (s.sellingPrice && s.sellingPrice > 0)
    const hasStock = s.stock === null || s.stock === undefined || s.stock > 0
    return hasPrice && hasStock
  })
  
  if (validSkus.length < 1) {
    return doc
  }
  
  // All conditions met - auto-activate the variation!
  req.payload.logger.info(`Auto-activating variation ${variationId} after SKU update - all requirements met`)
  
  await req.payload.update({
    collection: 'variations',
    id: variationId,
    data: {
      status: 'active',
    },
    depth: 0,
  })
  
  return doc
}
