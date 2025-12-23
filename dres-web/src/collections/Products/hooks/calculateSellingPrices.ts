import type { CollectionBeforeChangeHook } from 'payload'

interface Variation {
  price?: number
  sellingPrice?: number
}

// Calculate markup based on whether it's a resell product
// Regular products: 10% markup
// Resell products: 2% markup
const calculateMarkup = (price: number, isResell: boolean): number => {
  const markup = isResell ? 1.02 : 1.1
  return Math.round(price * markup * 100) / 100
}

export const calculateSellingPrices: CollectionBeforeChangeHook = async ({ data }) => {
  const isResell = data?.isResell === true

  // Auto-calculate selling price for product level
  if (data?.price !== undefined && data?.price !== null) {
    data.sellingPrice = calculateMarkup(data.price, isResell)
  }

  // Auto-calculate selling price for each variation
  if (data?.variations && Array.isArray(data.variations)) {
    data.variations = data.variations.map((variation: Variation) => {
      if (variation.price !== undefined && variation.price !== null) {
        variation.sellingPrice = calculateMarkup(variation.price, isResell)
      }
      return variation
    })
  }

  return data
}
