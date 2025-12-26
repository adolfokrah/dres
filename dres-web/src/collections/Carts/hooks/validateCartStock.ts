import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

interface CartItem {
  variation: string | { id: string }
  sku?: string | { id: string } | null
  quantity?: number
}

interface SKU {
  id: string
  sku?: string
  title?: string
  stock?: number | null
  isActive?: boolean
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
    const variationId = typeof item.variation === 'object' ? item.variation.id : item.variation
    if (!variationId) continue

    const quantity = item.quantity || 1

    try {
      // Fetch the variation
      const variation = await payload.findByID({
        collection: 'variations',
        id: variationId,
        depth: 1,
      })

      if (!variation) {
        errors.push('Variation not found')
        continue
      }

      const variationTitle = variation.slug || 'This variation'

      // Check if variation has SKUs (via join)
      const skus = variation.skus?.docs as SKU[] | undefined
      const hasSkus = skus && skus.length > 0

      if (hasSkus) {
        // Variation has SKUs - need to select one
        const skuId = item.sku
          ? typeof item.sku === 'object'
            ? item.sku.id
            : item.sku
          : null

        if (!skuId) {
          errors.push(`"${variationTitle}" requires a SKU to be selected`)
          continue
        }

        // Fetch the specific SKU
        const sku = await payload.findByID({
          collection: 'skus',
          id: skuId,
          depth: 1,
        }) as SKU | null

        if (!sku) {
          errors.push(`Invalid SKU selected for "${variationTitle}"`)
          continue
        }

        if (!sku.isActive) {
          errors.push(`Selected SKU for "${variationTitle}" is no longer available`)
          continue
        }

        const skuStock = sku.stock

        // Check if SKU is sold out (stock = 0, not null/undefined which means unlimited)
        if (skuStock !== null && skuStock !== undefined) {
          // Use SKU title (e.g., "Red / M / GHS 99") instead of SKU code
          const skuLabel = sku.title || sku.sku || 'SKU'

          if (skuStock === 0) {
            errors.push(`"${skuLabel}" is sold out`)
          } else if (skuStock < quantity) {
            errors.push(`"${skuLabel}" only has ${skuStock} in stock`)
          }
        }
      } else {
        // No SKU selected - check if variation has any available SKUs
        const availableSkus = await payload.find({
          collection: 'skus',
          where: {
            variation: { equals: variationId },
            isActive: { equals: true },
            stock: { greater_than: 0 },
          },
          limit: 1,
        })

        if (availableSkus.docs.length === 0) {
          errors.push(`"${variationTitle}" is sold out - no SKUs available`)
        }
      }
    } catch (error) {
      payload.logger.error(`Error validating cart stock for variation ${variationId}: ${error}`)
    }
  }

  if (errors.length > 0) {
    throw new APIError(errors.join('\n'), 400)
  }

  return data
}
