import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

interface CartItem {
  product: string | { id: string }
  variation?: number | null
  quantity?: number
  productTitle?: string
}

export const validateCartStock: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  // Only validate on create and update
  if (operation !== 'create' && operation !== 'update') return data

  const payload = req.payload
  const items = data?.items as CartItem[] | undefined

  if (!items || !Array.isArray(items) || items.length === 0) return data

  const errors: string[] = []

  for (const item of items) {
    const productId = typeof item.product === 'object' ? item.product.id : item.product
    if (!productId) continue

    const quantity = item.quantity || 1

    try {
      // Fetch the product
      const product = await payload.findByID({
        collection: 'products',
        id: productId,
        depth: 0,
      })

      if (!product) {
        errors.push(`Product not found`)
        continue
      }

      const productTitle = product.title || item.productTitle || 'Unknown product'

      // Check if product has variations
      const variations = product.variations as Array<{
        options: Record<string, string>
        stock?: number | null
      }> | undefined

      const hasVariations = variations && variations.length > 0

      if (hasVariations) {
        // Product has variations - check variation stock
        const variationIndex = item.variation

        if (variationIndex === null || variationIndex === undefined) {
          errors.push(`"${productTitle}" requires a variation to be selected`)
          continue
        }

        const variation = variations[variationIndex]
        if (!variation) {
          errors.push(`Invalid variation selected for "${productTitle}"`)
          continue
        }

        const variationStock = variation.stock

        // Check if variation is sold out (stock = 0, not null/undefined which means unlimited)
        if (variationStock !== null && variationStock !== undefined) {
          if (variationStock === 0) {
            // Build variation description from options
            const optionsDesc = variation.options 
              ? Object.entries(variation.options).map(([k, v]) => `${k}: ${v}`).join(', ')
              : `Variation ${variationIndex + 1}`
            errors.push(`"${productTitle}" (${optionsDesc}) is sold out`)
          } else if (variationStock < quantity) {
            const optionsDesc = variation.options 
              ? Object.entries(variation.options).map(([k, v]) => `${k}: ${v}`).join(', ')
              : `Variation ${variationIndex + 1}`
            errors.push(`"${productTitle}" (${optionsDesc}) only has ${variationStock} in stock, but you requested ${quantity}`)
          }
        }
      } else {
        // No variations - check product-level stock
        const productStock = product.stock as number | null | undefined

        // Check if product is sold out (stock = 0, not null/undefined which means unlimited)
        if (productStock !== null && productStock !== undefined) {
          if (productStock === 0) {
            errors.push(`"${productTitle}" is sold out`)
          } else if (productStock < quantity) {
            errors.push(`"${productTitle}" only has ${productStock} in stock, but you requested ${quantity}`)
          }
        }
      }
    } catch (error) {
      payload.logger.error(`Error validating cart stock for product ${productId}: ${error}`)
    }
  }

  if (errors.length > 0) {
    throw new APIError(errors.join('. '), 400)
  }

  return data
}
