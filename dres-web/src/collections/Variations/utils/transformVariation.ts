import type { Variation } from '@/payload-types'

interface TransformedSKU {
  value: string
  sellingPrice: number
}

interface TransformedVariation {
  id: string
  thumbnail: string | null
  title: string
  slug: string
  skus: TransformedSKU[]
  category: string | null
  brand: string | null
  sellingPrice: number
  compareAtPrice?: number
  flashSaleEndDate?: string | null
  currency: {
    code: string
    symbol: string
  } | null
  variants: string
  isBoosted?: boolean
  showWeLoveBadge?: boolean
  defaultSku?: string
  styleId?: string | null
  sellerId?: string | null
  totalStock?: number
  relatedVariations?: Omit<TransformedVariation, 'relatedVariations'>[]
}

// Helper to construct media URL from filename (more reliable than stored url field)
function getMediaUrlFromFilename(media: any, size?: 'thumbnail' | 'card' | 'tablet'): string | null {
  if (!media || typeof media !== 'object') return null

  let filename = null

  if (size && media.sizes?.[size]?.filename) {
    filename = media.sizes[size].filename
  } else if (media.filename) {
    filename = media.filename
  }

  if (!filename) return null
  return `/api/media/file/${filename}`
}

export function transformVariation(variation: any, includeRelated: boolean = false): TransformedVariation | null {
  if (!variation || typeof variation === 'string') {
    return null
  }

  // Get first image thumbnail
  const firstImage = Array.isArray(variation.images) && variation.images.length > 0 
    ? variation.images[0] 
    : null
  
  // Construct URL from filename (more reliable than stored url field which can be stale)
  const thumbnail = getMediaUrlFromFilename(firstImage, 'thumbnail') || getMediaUrlFromFilename(firstImage)

  // Get style data
  const style = typeof variation.style === 'object' ? variation.style : null

  // Get category name - category object has a 'category' field containing the name
  const categoryObj = style?.category && typeof style.category === 'object' ? style.category : null
  const category = categoryObj?.category || categoryObj?.title || categoryObj?.name || null

  // Get brand name
  const brand = style?.brand && typeof style.brand === 'object'
    ? style.brand.name || style.brand.title || null
    : null

  // Build variants string (e.g., "Color - Material - Size")
  let variants = ''
  if (Array.isArray(variation.variants)) {
    const variantNames = variation.variants
      .map((variantItem: any) => {
        if (variantItem?.variant && typeof variantItem.variant === 'object') {
          return variantItem.variant.name || ''
        }
        return ''
      })
      .filter(Boolean)
    variants = variantNames.join(' - ')
  }

  // Transform SKUs
  const skus: TransformedSKU[] = []
  if (Array.isArray(variation.skus?.docs)) {
    variation.skus.docs.forEach((sku: any) => {
      if (sku && typeof sku === 'object') {
        // Extract size/value from skuOptions array
        let value = ''
        if (Array.isArray(sku.skuOptions) && sku.skuOptions.length > 0) {
          // Find the size option
          const sizeOption = sku.skuOptions.find((opt: any) => 
            opt.option?.name?.toLowerCase() === 'size' ||
            opt.option?.name?.toLowerCase() === 'waist size'
          )
          if (sizeOption?.value && typeof sizeOption.value === 'object') {
            value = sizeOption.value.name || sizeOption.value.value || ''
          }
        }
        
        // Fallback to title if no size found
        if (!value && sku.title) {
          value = sku.title.split(' / ')[0] || sku.title
        }
        
        skus.push({
          value: value || 'Standard',
          sellingPrice: typeof sku.sellingPrice === 'number' ? sku.sellingPrice : 0,
        })
      }
    })
  }

  // Get price and currency - prioritize SKU with compareAtPrice for on-sale items
  let selectedSku = variation.skus?.docs?.[0]
  
  // If any SKU has compareAtPrice, use that one
  if (Array.isArray(variation.skus?.docs)) {
    const skuWithDiscount = variation.skus.docs.find((sku: any) => 
      sku && typeof sku === 'object' && 
      typeof sku.compareAtPrice === 'number' && 
      sku.compareAtPrice > 0
    )
    if (skuWithDiscount) {
      selectedSku = skuWithDiscount
    }
  }
  
  const sellingPrice = selectedSku && typeof selectedSku === 'object' && typeof selectedSku.sellingPrice === 'number' 
    ? selectedSku.sellingPrice 
    : 0
  
  const compareAtPrice = selectedSku && typeof selectedSku === 'object' && typeof selectedSku.compareAtPrice === 'number'
    ? selectedSku.compareAtPrice
    : undefined

  // Flash sale: only include if enabled and end date is in the future
  const flashSaleEndDate = selectedSku?.flashSaleEnabled && selectedSku?.flashSaleEndDate && new Date(selectedSku.flashSaleEndDate) > new Date()
    ? selectedSku.flashSaleEndDate
    : null

  // Get stock from the selected/default SKU
  const totalStock = selectedSku && typeof selectedSku === 'object' && typeof selectedSku.stock === 'number'
    ? selectedSku.stock
    : 0
  
  const currency = selectedSku?.currency && typeof selectedSku.currency === 'object'
    ? {
        code: selectedSku.currency.code || '',
        symbol: selectedSku.currency.symbol || ''
      }
    : null

  // Get related variations (variations from the same style)
  let relatedVariations: Omit<TransformedVariation, 'relatedVariations'>[] | undefined = undefined
  if (includeRelated && variation.relatedVariations?.docs) {
    relatedVariations = variation.relatedVariations.docs
      .map((relatedVar: any) => transformVariation(relatedVar, false)) // Don't recursively include related
      .filter((v: TransformedVariation | null): v is Omit<TransformedVariation, 'relatedVariations'> => v !== null)
  }

  // Check if style has an active boost
  const hasActiveBoost = () => {
    // Handle boost as either array or Payload relationship object
    let boostItems: any[] = []

    // Debug logging
    console.log(`[transformVariation] Style ID: ${style?.id}, boost field type: ${typeof style?.boost}, boost value:`,
      style?.boost ? JSON.stringify({
        hasDocs: 'docs' in (style.boost || {}),
        isArray: Array.isArray(style.boost),
        docsLength: (style.boost as any)?.docs?.length,
      }) : 'undefined'
    )

    if (!style?.boost) {
      return { isBoosted: false, showWeLoveBadge: false }
    }

    // Check if boost is a Payload relationship object with docs
    if (typeof style.boost === 'object' && 'docs' in style.boost) {
      boostItems = Array.isArray(style.boost.docs) ? style.boost.docs : []
    } else if (Array.isArray(style.boost)) {
      boostItems = style.boost
    }

    console.log(`[transformVariation] Boost items count: ${boostItems.length}`)

    if (boostItems.length === 0) {
      return { isBoosted: false, showWeLoveBadge: false }
    }

    const now = new Date()
    for (const boostItem of boostItems) {
      if (!boostItem || typeof boostItem !== 'object') {
        continue
      }

      // Skip cancelled boosts (only cancelled is definitively inactive)
      if (boostItem.status === 'cancelled') {
        continue
      }

      const startDate = boostItem.startDate ? new Date(boostItem.startDate) : null
      const endDate = boostItem.endDate ? new Date(boostItem.endDate) : null

      // Check if current date is within the boost period (dates take precedence over status)
      const isAfterStart = !startDate || now >= startDate
      const isBeforeEnd = !endDate || now <= endDate

      const isActive = isAfterStart && isBeforeEnd

      if (isActive) {
        // Check if tier has showWeLoveBadge enabled
        const tier = boostItem.tier
        console.log(`[transformVariation] Active boost found! Tier type: ${typeof tier}, tier value:`,
          tier ? JSON.stringify({ id: tier.id, showWeLoveBadge: tier.showWeLoveBadge }) : 'undefined/null'
        )
        const showWeLoveBadge = tier && typeof tier === 'object' ? (tier.showWeLoveBadge ?? false) : false
        console.log(`[transformVariation] Final result: isBoosted=true, showWeLoveBadge=${showWeLoveBadge}`)
        return { isBoosted: true, showWeLoveBadge }
      }
    }

    return { isBoosted: false, showWeLoveBadge: false }
  }

  const boostInfo = hasActiveBoost()

  // Get style ID
  const styleId = typeof variation.style === 'object' ? variation.style.id : variation.style

  // Get seller ID from style - handle various formats
  let sellerId: string | null = null
  if (style?.seller) {
    if (typeof style.seller === 'object' && style.seller !== null) {
      // Populated seller object
      sellerId = style.seller.id || style.seller._id?.toString() || null
    } else if (typeof style.seller === 'string') {
      // String ID
      sellerId = style.seller
    } else if (style.seller.toString) {
      // ObjectId or similar
      sellerId = style.seller.toString()
    }
  }

  return {
    id: variation.id,
    thumbnail,
    title: variation.title || '',
    slug: variation.slug || '',
    skus,
    category,
    brand,
    sellingPrice,
    compareAtPrice,
    flashSaleEndDate,
    currency,
    variants,
    isBoosted: boostInfo.isBoosted,
    showWeLoveBadge: boostInfo.showWeLoveBadge,
    defaultSku: selectedSku?.id || undefined,
    styleId: styleId || null,
    sellerId: sellerId || null,
    totalStock,
    ...(includeRelated && { relatedVariations }),
  }
}

/**
 * Transforms an array of variations
 * @param variations - Array of variation data
 * @param includeRelated - Whether to include related variations (default: false)
 * @returns Array of transformed variations
 */
export function transformVariations(variations: any[], includeRelated: boolean = false): TransformedVariation[] {
  return variations
    .map(variation => transformVariation(variation, includeRelated))
    .filter((v): v is TransformedVariation => v !== null)
}
