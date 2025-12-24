import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

interface CartItem {
  product: string | { id: string }
  variation?: string | { id: string } | null
  quantity?: number
}

interface ProductVariation {
  id: string
  sku?: string
  options?: Array<string | { id: string; name?: string }>
  stock?: number | null
  isActive?: boolean
}

/**
 * Get variation label from its options
 */
async function getVariationLabel(
  payload: any,
  variation: ProductVariation,
): Promise<string> {
  if (!variation.options || variation.options.length === 0) {
    return variation.sku || 'Variation'
  }

  const optionNames: string[] = []

  for (const opt of variation.options) {
    if (typeof opt === 'object' && opt.name) {
      optionNames.push(opt.name)
    } else {
      // Fetch option name if only ID
      const optionId = typeof opt === 'object' ? opt.id : opt
      try {
        const option = await payload.findByID({
          collection: 'attributeOptions',
          id: optionId,
          depth: 0,
        })
        if (option?.name) {
          optionNames.push(option.name)
        }
      } catch {
        // Skip if can't fetch
      }
    }
  }

  return optionNames.length > 0 ? optionNames.join(' / ') : (variation.sku || 'Variation')
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
        depth: 1, // Get variations join
      })

      if (!product) {
        errors.push('Product not found')
        continue
      }

      const productTitle = product.title || 'This product'

      // Check if product has variations (via join)
      const variations = product.variations?.docs as ProductVariation[] | undefined
      const hasVariations = variations && variations.length > 0

      if (hasVariations) {
        // Product has variations - need to select one
        const variationId = item.variation
          ? typeof item.variation === 'object'
            ? item.variation.id
            : item.variation
          : null

        if (!variationId) {
          errors.push(`"${productTitle}" requires a variation to be selected`)
          continue
        }

        // Fetch the specific variation
        const variation = await payload.findByID({
          collection: 'product-variations',
          id: variationId,
          depth: 1, // Get options
        }) as ProductVariation | null

        if (!variation) {
          errors.push(`Invalid variation selected for "${productTitle}"`)
          continue
        }

        if (!variation.isActive) {
          errors.push(`Selected variation for "${productTitle}" is no longer available`)
          continue
        }

        const variationStock = variation.stock

        // Check if variation is sold out (stock = 0, not null/undefined which means unlimited)
        if (variationStock !== null && variationStock !== undefined) {
          const variationLabel = await getVariationLabel(payload, variation)

          if (variationStock === 0) {
            errors.push(`"${productTitle}" (${variationLabel}) is sold out`)
          } else if (variationStock < quantity) {
            errors.push(`"${productTitle}" (${variationLabel}) only has ${variationStock} in stock`)
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
            errors.push(`"${productTitle}" only has ${productStock} in stock`)
          }
        }
      }
    } catch (error) {
      payload.logger.error(`Error validating cart stock for product ${productId}: ${error}`)
    }
  }

  if (errors.length > 0) {
    throw new APIError(errors.join('\n'), 400)
  }

  return data
}
