import type { Variation } from '@/payload-types'

interface TransformedSKU {
  value: string
  price: number
}

interface TransformedVariation {
  id: string
  thumbnail: string | null
  title: string
  slug: string
  skus: TransformedSKU[]
  category: string | null
  brand: string | null
  price: number
  compareAtPrice?: number
  currency: {
    code: string
    symbol: string
  } | null
  variants: string
  isBoosted?: boolean
  relatedVariations?: Omit<TransformedVariation, 'relatedVariations'>[]
}

export function transformVariation(variation: any, includeRelated: boolean = false): TransformedVariation | null {
  if (!variation || typeof variation === 'string') {
    return null
  }

  // Get first image thumbnail
  const firstImage = Array.isArray(variation.images) && variation.images.length > 0 
    ? variation.images[0] 
    : null
  
  const thumbnail = firstImage && typeof firstImage === 'object' && firstImage.sizes?.thumbnail?.url
    ? firstImage.sizes.thumbnail.url
    : (firstImage && typeof firstImage === 'object' && firstImage.url ? firstImage.url : null)

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
          price: typeof sku.price === 'number' ? sku.price : 0,
        })
      }
    })
  }

  // Get price and currency from first SKU
  const firstSku = variation.skus?.docs?.[0]
  const price = firstSku && typeof firstSku === 'object' && typeof firstSku.price === 'number' 
    ? firstSku.price 
    : 0
  
  const compareAtPrice = firstSku && typeof firstSku === 'object' && typeof firstSku.compareAtPrice === 'number'
    ? firstSku.compareAtPrice
    : undefined
  
  const currency = firstSku?.currency && typeof firstSku.currency === 'object'
    ? {
        code: firstSku.currency.code || '',
        symbol: firstSku.currency.symbol || ''
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
    
    if (!style?.boost) {
      console.log('No boost found for style:', style?.id)
      return false
    }
    
    // Check if boost is a Payload relationship object with docs
    if (typeof style.boost === 'object' && 'docs' in style.boost) {
      boostItems = Array.isArray(style.boost.docs) ? style.boost.docs : []
    } else if (Array.isArray(style.boost)) {
      boostItems = style.boost
    }
    
    if (boostItems.length === 0) {
      console.log('No boost items found for style:', style?.id)
      return false
    }
    
    console.log('Checking boost for style:', style.id, 'boost items:', boostItems.length)
    
    const now = new Date()
    return boostItems.some((boostItem: any) => {
      if (!boostItem || typeof boostItem !== 'object') {
        console.log('Invalid boost item:', boostItem)
        return false
      }
      
      const startDate = boostItem.startDate ? new Date(boostItem.startDate) : null
      const endDate = boostItem.endDate ? new Date(boostItem.endDate) : null
      
      console.log('Boost item:', {
        id: boostItem.id,
        startDate: startDate?.toISOString(),
        endDate: endDate?.toISOString(),
        now: now.toISOString()
      })
      
      // Check if current date is within the boost period
      const isAfterStart = !startDate || now >= startDate
      const isBeforeEnd = !endDate || now <= endDate
      
      const isActive = isAfterStart && isBeforeEnd
      console.log('Boost active:', isActive, 'isAfterStart:', isAfterStart, 'isBeforeEnd:', isBeforeEnd)
      
      return isActive
    })
  }

  return {
    id: variation.id,
    thumbnail,
    title: variation.title || '',
    slug: variation.slug || '',
    skus,
    category,
    brand,
    price,
    compareAtPrice,
    currency,
    variants,
    isBoosted: hasActiveBoost(),
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
