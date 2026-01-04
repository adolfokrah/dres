import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  variation: string | { id: string }
  seller: string | { id: string }
  productTitle: string
  sku: string | { id: string } | null
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

      // Get SKU ID from the sku field (can be string or object)
      const skuId = typeof item.sku === 'object' ? item.sku?.id : item.sku

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
        // No SKU ID provided - try to find first available SKU for this variation
        const skus = await payload.find({
          collection: 'skus',
          where: {
            variation: { equals: variationId },
            isActive: { equals: true },
          },
          limit: 1,
          sort: 'price',
        })

        if (skus.docs.length === 0) {
          payload.logger.warn(
            `No SKUs found for variation ${variationId} - cannot reduce stock`,
          )
          continue
        }

        const firstSku = skus.docs[0]
        const currentStock = firstSku.stock

        // Skip if stock is null/undefined (unlimited stock)
        if (currentStock === null || currentStock === undefined) {
          payload.logger.info(
            `Skipping stock reduction for variation ${variationId} - unlimited stock`,
          )
          continue
        }

        const newStock = Math.max(0, currentStock - item.quantity)

        await payload.update({
          collection: 'skus',
          id: firstSku.id,
          data: {
            stock: newStock,
          },
        })

        payload.logger.info(
          `Reduced stock for SKU ${firstSku.id} (variation ${variationId}): ${currentStock} -> ${newStock}`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error reducing stock: ${error}`)
  }

  return doc
}
