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
      const productId = typeof item.product === 'object' ? item.product.id : item.product
      if (!productId) continue

      const variationId = item.variationId

      // If item has a variation ID, reduce variation stock
      if (variationId) {
        // Fetch the variation from product-variations collection
        const variation = await payload.findByID({
          collection: 'product-variations',
          id: variationId,
          depth: 0,
        })

        if (!variation) {
          payload.logger.warn(`Variation ${variationId} not found for stock reduction`)
          continue
        }

        const currentStock = variation.stock

        // Skip if stock is null/undefined (unlimited stock)
        if (currentStock === null || currentStock === undefined) {
          payload.logger.info(
            `Skipping stock reduction for variation ${variationId} - unlimited stock`,
          )
          continue
        }

        const newStock = Math.max(0, currentStock - item.quantity)

        // Update the variation stock directly in product-variations collection
        await payload.update({
          collection: 'product-variations',
          id: variationId,
          data: {
            stock: newStock,
          },
        })

        payload.logger.info(
          `Reduced stock for variation ${variationId}: ${currentStock} -> ${newStock}`,
        )
      } else {
        // No variation - reduce product-level stock
        const product = await payload.findByID({
          collection: 'products',
          id: productId,
          depth: 0,
        })

        if (!product) continue

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
