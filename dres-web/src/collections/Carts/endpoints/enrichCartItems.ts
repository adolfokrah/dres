import type { Payload } from 'payload'

interface SellerInfo {
  id: string
  displayName?: string
  shopName?: string
  firstName?: string
  lastName?: string
  name?: string
  photo?: { url?: string } | string
  vacationMode?: boolean
  isTrusted?: boolean
  country?: string | { id: string }
}

interface CartItem {
  variation?: {
    id: string
    title?: string
    status?: string
    images?: Array<{ image?: { url?: string } }>
    brand?: string | { name?: string }
    style?: {
      id: string
      seller?: string | SellerInfo
    }
  } | string
  sku?: {
    id: string
    stock?: number | null
    isActive?: boolean
    status?: string
    price?: number
    discountedPrice?: number
    options?: Array<{ option?: string; value?: string }>
  } | string
  quantity?: number
}

interface EnrichedCartItem extends Record<string, unknown> {
  isSellerOnVacation: boolean
  isOutOfStock: boolean
  isNotInYourCountry: boolean
  isArchived: boolean
  isShippingUnavailable: boolean
  stockQuantity: number | null
  availableStock: number | null
  // Per-item validation
  valid: boolean
  reason: string | null
}

interface EnrichCartItemsParams {
  payload: Payload
  items: CartItem[]
  userCountryId?: string | null
  sellersWithoutShipping?: string[]
}

interface EnrichCartItemsResult {
  enrichedItems: EnrichedCartItem[]
  validation: {
    valid: boolean
    reasons: string[]
  }
}

/**
 * Enriches cart items with availability flags and per-item validation
 * This is shared between getCart and updateShipping endpoints
 */
export async function enrichCartItems({
  payload,
  items,
  userCountryId,
  sellersWithoutShipping = [],
}: EnrichCartItemsParams): Promise<EnrichCartItemsResult> {
  const enrichedItems: EnrichedCartItem[] = []
  const sellerCache: Map<string, SellerInfo> = new Map()

  if (items && Array.isArray(items)) {
    for (const item of items) {
      const enrichedItem: EnrichedCartItem = {
        ...item,
        isSellerOnVacation: false,
        isOutOfStock: false,
        isNotInYourCountry: false,
        isArchived: false,
        isShippingUnavailable: false,
        stockQuantity: null,
        availableStock: null,
        valid: true,
        reason: null,
      }

      // Check if variation is archived
      if (item.variation && typeof item.variation === 'object') {
        if (item.variation.status === 'archived') {
          enrichedItem.isArchived = true
          enrichedItem.valid = false
          enrichedItem.reason = 'Item no longer available'
        }
      }

      // Check seller vacation status and enrich seller info
      if (item.variation && typeof item.variation === 'object') {
        const style = item.variation.style
        if (style && typeof style === 'object') {
          const seller = style.seller
          let sellerId: string | null = null
          let sellerInfo: SellerInfo | null = null

          if (typeof seller === 'string') {
            sellerId = seller
          } else if (seller && typeof seller === 'object') {
            sellerId = seller.id
            // Transform the populated seller data
            const sellerData = seller as unknown as Record<string, unknown>
            const sellerCountry = sellerData.country
            const sellerCountryId =
              typeof sellerCountry === 'object' && sellerCountry !== null
                ? (sellerCountry as { id: string }).id
                : (sellerCountry as string | undefined)

            sellerInfo = {
              id: seller.id,
              displayName:
                (sellerData.shopName as string | undefined) ||
                `${sellerData.firstName || ''} ${sellerData.lastName || ''}`.trim() ||
                undefined,
              shopName: sellerData.shopName as string | undefined,
              firstName: sellerData.firstName as string | undefined,
              lastName: sellerData.lastName as string | undefined,
              photo: sellerData.photo as { url?: string } | string | undefined,
              vacationMode: sellerData.vacationMode as boolean | undefined,
              isTrusted: sellerData.isTrusted as boolean | undefined,
              country: sellerCountry as string | { id: string } | undefined,
            }
            // Cache it
            sellerCache.set(sellerId, sellerInfo)
            // If seller is populated, check vacation mode directly
            if (sellerInfo.vacationMode === true) {
              enrichedItem.isSellerOnVacation = true
              enrichedItem.valid = false
              enrichedItem.reason = 'Seller is currently on vacation'
            }
            // Check if seller's country matches user's country
            if (userCountryId && sellerCountryId && sellerCountryId !== userCountryId) {
              enrichedItem.isNotInYourCountry = true
              enrichedItem.valid = false
              enrichedItem.reason = 'Item not available in your country'
            }
          }

          // If seller wasn't fully populated, fetch from cache or DB
          if (sellerId && !sellerInfo) {
            if (sellerCache.has(sellerId)) {
              sellerInfo = sellerCache.get(sellerId) || null
              if (sellerInfo?.vacationMode === true) {
                enrichedItem.isSellerOnVacation = true
                enrichedItem.valid = false
                enrichedItem.reason = 'Seller is currently on vacation'
              }
              // Check country from cache
              const cachedCountryId =
                typeof sellerInfo?.country === 'object' && sellerInfo.country !== null
                  ? (sellerInfo.country as { id: string }).id
                  : (sellerInfo?.country as string | undefined)
              if (userCountryId && cachedCountryId && cachedCountryId !== userCountryId) {
                enrichedItem.isNotInYourCountry = true
                enrichedItem.valid = false
                enrichedItem.reason = 'Item not available in your country'
              }
            } else {
              try {
                const sellerDoc = await payload.findByID({
                  collection: 'users',
                  id: sellerId,
                  depth: 1, // Get photo and country
                })
                if (sellerDoc) {
                  const sellerData = sellerDoc as unknown as Record<string, unknown>
                  const sellerCountry = sellerData.country
                  const sellerCountryId =
                    typeof sellerCountry === 'object' && sellerCountry !== null
                      ? (sellerCountry as { id: string }).id
                      : (sellerCountry as string | undefined)

                  sellerInfo = {
                    id: sellerDoc.id,
                    displayName:
                      (sellerData.shopName as string | undefined) ||
                      `${sellerData.firstName || ''} ${sellerData.lastName || ''}`.trim() ||
                      undefined,
                    shopName: sellerData.shopName as string | undefined,
                    firstName: sellerData.firstName as string | undefined,
                    lastName: sellerData.lastName as string | undefined,
                    photo: sellerData.photo as { url?: string } | string | undefined,
                    vacationMode: sellerData.vacationMode as boolean | undefined,
                    isTrusted: sellerData.isTrusted as boolean | undefined,
                    country: sellerCountry as string | { id: string } | undefined,
                  }
                  sellerCache.set(sellerId, sellerInfo)
                  if (sellerInfo.vacationMode === true) {
                    enrichedItem.isSellerOnVacation = true
                    enrichedItem.valid = false
                    enrichedItem.reason = 'Seller is currently on vacation'
                  }
                  // Check if seller's country matches user's country
                  if (userCountryId && sellerCountryId && sellerCountryId !== userCountryId) {
                    enrichedItem.isNotInYourCountry = true
                    enrichedItem.valid = false
                    enrichedItem.reason = 'Item not available in your country'
                  }
                }
              } catch {
                // Seller not found, leave as is
              }
            }
          }

          // Ensure seller info is attached to the variation
          if (sellerInfo && item.variation && typeof item.variation === 'object') {
            const enrichedVariation = enrichedItem.variation as Record<string, unknown>
            if (enrichedVariation && enrichedVariation.style && typeof enrichedVariation.style === 'object') {
              ;(enrichedVariation.style as Record<string, unknown>).seller = sellerInfo
            }
          }

          // Check if seller has shipping for selected location
          if (sellerId && sellersWithoutShipping.includes(sellerId)) {
            enrichedItem.isShippingUnavailable = true
            // Don't set valid=false here - shipping errors shouldn't block checkout navigation
            // The overall validation will handle this at the cart level
          }
        }
      }

      // Check SKU stock status and archived status
      if (item.sku && typeof item.sku === 'object') {
        const stock = item.sku.stock
        const isActive = item.sku.isActive
        const skuStatus = item.sku.status
        const quantity = item.quantity || 1

        enrichedItem.stockQuantity = stock ?? null

        // Check if SKU is archived
        if (skuStatus === 'archived') {
          enrichedItem.isArchived = true
          enrichedItem.availableStock = 0
          enrichedItem.valid = false
          enrichedItem.reason = 'Item no longer available'
        } else if (isActive === false) {
          enrichedItem.isOutOfStock = true
          enrichedItem.availableStock = 0
          enrichedItem.valid = false
          enrichedItem.reason = 'Out of stock'
        } else if (stock !== null && stock !== undefined) {
          enrichedItem.availableStock = stock
          if (stock <= 0) {
            enrichedItem.isOutOfStock = true
            enrichedItem.valid = false
            enrichedItem.reason = 'Out of stock'
          } else if (stock < quantity) {
            // Not completely out of stock, but not enough for requested quantity
            enrichedItem.availableStock = stock
            enrichedItem.valid = false
            enrichedItem.reason = `Only ${stock} available`
          }
        }
      } else if (item.sku && typeof item.sku === 'string') {
        // SKU wasn't populated, fetch it
        try {
          const skuDoc = await payload.findByID({
            collection: 'skus',
            id: item.sku,
            depth: 0,
          })
          if (skuDoc) {
            const stock = skuDoc.stock as number | null | undefined
            const isActive = skuDoc.isActive as boolean | undefined
            const skuStatus = skuDoc.status as string | undefined
            const quantity = item.quantity || 1

            enrichedItem.stockQuantity = stock ?? null

            // Check if SKU is archived
            if (skuStatus === 'archived') {
              enrichedItem.isArchived = true
              enrichedItem.availableStock = 0
              enrichedItem.valid = false
              enrichedItem.reason = 'Item no longer available'
            } else if (isActive === false) {
              enrichedItem.isOutOfStock = true
              enrichedItem.availableStock = 0
              enrichedItem.valid = false
              enrichedItem.reason = 'Out of stock'
            } else if (stock !== null && stock !== undefined) {
              enrichedItem.availableStock = stock
              if (stock <= 0) {
                enrichedItem.isOutOfStock = true
                enrichedItem.valid = false
                enrichedItem.reason = 'Out of stock'
              } else if (stock < quantity) {
                enrichedItem.availableStock = stock
                enrichedItem.valid = false
                enrichedItem.reason = `Only ${stock} available`
              }
            }
          }
        } catch {
          // SKU not found
        }
      }

      enrichedItems.push(enrichedItem)
    }
  }

  // Build validation summary from per-item validation
  const invalidItems = enrichedItems.filter((item) => !item.valid)
  const isValid = invalidItems.length === 0
  const validationIssues: string[] = []

  if (invalidItems.some((item) => item.isArchived)) {
    validationIssues.push('Some items are no longer available')
  }
  if (invalidItems.some((item) => item.isOutOfStock)) {
    validationIssues.push('Some items are out of stock')
  }
  if (invalidItems.some((item) => item.isNotInYourCountry)) {
    validationIssues.push('Some items are not available in your country')
  }
  if (invalidItems.some((item) => item.isSellerOnVacation)) {
    validationIssues.push('Some sellers are on vacation')
  }
  if (
    invalidItems.some((item) => {
      const quantity = (item as Record<string, unknown>).quantity as number || 1
      return item.availableStock !== null && item.availableStock > 0 && quantity > item.availableStock
    })
  ) {
    validationIssues.push('Some items exceed available stock')
  }

  return {
    enrichedItems,
    validation: {
      valid: isValid,
      reasons: validationIssues,
    },
  }
}
