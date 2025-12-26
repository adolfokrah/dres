import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  product: string | { id: string }
  seller: string | { id: string }
  productTitle: string
  variationOptions: Record<string, string> | null
  variationId: string | null
  quantity: number
}

export const reduceStockOnOrder: CollectionAfterChangeHook = async ({
  doc,
  // previousDoc - not used but kept for hook signature
  req,
  operation,
}) => {
  // Only trigger when order is created (cart converted to order)
  if (operation !== 'create') return doc

  const payload = req.payload

  try {
    const items = (doc.items || []) as OrderItem[]

    for (const item of items) {
      const variationId = typeof item.variation === 'object' ? item.variation.id : item.variation
      if (!variationId) continue

      const skuId = item.skuId

      // If item has a SKU ID, reduce SKU stock
      if (skuId) {
        // Fetch the SKU from skus collection
        const sku = await payload.findByID({
          collection: 'skus',
          id: skuId,
          depth: 0,
        })

        if (!sku) {
          payload.logger.warn(`SKU ${skuId} not found for stock reduction`)
          continue
        }

        const currentStock = sku.stock

        // Skip if stock is null/undefined (unlimited stock)
        if (currentStock === null || currentStock === undefined) {
          payload.logger.info(
            `Skipping stock reduction for SKU ${skuId} - unlimited stock`,
          )
          continue
        }

        const newStock = Math.max(0, currentStock - item.quantity)

        // Update the SKU stock directly in skus collection
        await payload.update({
          collection: 'skus',
          id: skuId,
          data: {
            stock: newStock,
          },
        })

        payload.logger.info(
          `Reduced stock for SKU ${skuId}: ${currentStock} -> ${newStock}`,
        )
      } else {
        // No SKU - try variation-level
        const variation = await payload.findByID({
          collection: 'variations',
          id: variationId,
          depth: 0,
        })

        if (!variation) continue

        const currentStock = product.stock as number | null | undefined

        // Skip if stock is null/undefined (unlimited stock)
        if (currentStock === null || currentStock === undefined) {
          payload.logger.info(
            `Skipping stock reduction for product ${productId} - unlimited stock`,
          )
          continue
        }

        const newStock = Math.max(0, currentStock - item.quantity)

        await payload.update({
          collection: 'products',
          id: productId,
          data: {
            stock: newStock,
          },
        })

        payload.logger.info(
          `Reduced stock for product ${productId}: ${currentStock} -> ${newStock}`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error reducing stock: ${error}`)
  }

  return doc
}
