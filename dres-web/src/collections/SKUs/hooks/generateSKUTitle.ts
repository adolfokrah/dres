import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Generates SKU title from variation options + sku options
 * Also auto-populates the currency field from seller's country
 * Example: "Red / Leather / M"
 */
export const generateSKUTitle: CollectionBeforeChangeHook = async ({ data, req }) => {
  const titleParts: string[] = []
  let currencySymbol = '' // No default - will fetch from seller's country
  let currencyId: string | null = null

  // Get variation options and currency from seller's country
  const variationId = data?.variation
  if (variationId) {
    const varId = typeof variationId === 'object' ? variationId.id : variationId
    try {
      const variation = await req.payload.findByID({
        collection: 'variations',
        id: varId,
        depth: 4, // variation -> style -> seller -> country -> currency
      })
      
      // Get variant option values
      if (variation?.variants && Array.isArray(variation.variants)) {
        for (const v of variation.variants) {
          const valueName = typeof v.value === 'object' ? v.value?.name : null
          if (valueName) titleParts.push(valueName)
        }
      }
      
      // Get currency from seller's country
      const style = variation?.style
      if (style && typeof style === 'object') {
        const seller = style.seller
        if (seller && typeof seller === 'object') {
          const country = seller.country
          if (country && typeof country === 'object') {
            const currency = country.currency
            if (currency && typeof currency === 'object') {
              if (currency.symbol) {
                currencySymbol = currency.symbol
              }
              if (currency.id) {
                currencyId = currency.id
              }
            }
          }
        }
      }
    } catch {
      // Variation not found
    }
  }

  // Set the currency field
  if (currencyId) {
    data.currency = currencyId
  }

  // Get SKU options
  if (data?.skuOptions && Array.isArray(data.skuOptions)) {
    for (const opt of data.skuOptions) {
      const valueId = typeof opt.value === 'object' ? opt.value?.id : opt.value
      if (valueId) {
        try {
          const option = await req.payload.findByID({
            collection: 'attributeOptions',
            id: valueId,
            depth: 0,
          })
          if (option?.name) titleParts.push(option.name)
        } catch {
          // Option not found
        }
      }
    }
  }

  data.title = titleParts.length > 0 ? titleParts.join(' / ') : data.sku || 'SKU'
  return data
}
