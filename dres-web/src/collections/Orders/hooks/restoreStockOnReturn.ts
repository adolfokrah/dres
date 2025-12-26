import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  product: string | { id: string }
  seller: string | { id: string }
  productTitle: string
  variationOptions: Record<string, string> | null
  variationId: string | null
  quantity: number
  shippingStatus: string
}

export const restoreStockOnReturn: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only process on update
  if (operation !== 'update') return doc

  const payload = req.payload

  try {
    const currentItems = (doc.items || []) as OrderItem[]
    const previousItems = (previousDoc?.items || []) as OrderItem[]

    // Find items that just changed to 'returned'
    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i]
      const previousItem = previousItems[i]

      // Check if this item just changed to 'returned'
      if (
        currentItem.shippingStatus === 'returned' &&
        previousItem?.shippingStatus !== 'returned'
      ) {
        const variationId = typeof currentItem.variation === 'object' 
          ? currentItem.variation.id 
          : currentItem.variation
        
        if (!variationId) continue

        const skuId = currentItem.skuId

        // If item has a SKU ID, restore SKU stock
        if (skuId) {
          // Fetch the SKU from skus collection
          const sku = await payload.findByID({
            collection: 'skus',
            id: skuId,
            depth: 0,
          })

          if (!sku) {
            payload.logger.warn(`SKU ${skuId} not found for stock restore`)
            continue
          }

          const currentStock = sku.stock

          // Skip if stock is null/undefined (unlimited stock)
          if (currentStock === null || currentStock === undefined) {
            payload.logger.info(
              `Skipping stock restore for SKU ${skuId} - unlimited stock`,
            )
            continue
          }

          const newStock = currentStock + currentItem.quantity

          // Update the SKU stock directly in skus collection
          await payload.update({
            collection: 'skus',
            id: skuId,
            data: {
              stock: newStock,
            },
          })

          payload.logger.info(
            `Restored stock for SKU ${skuId} on return: ${currentStock} -> ${newStock}`,
          )
        } else {
          // No SKU - restore variation-level stock
          const variation = await payload.findByID({
            collection: 'variations',
            id: variationId,
            depth: 0,
          })

          if (!variation) continue

          const currentStock = variation.stock as number | null | undefined

          // Skip if stock is null/undefined (unlimited stock)
          if (currentStock === null || currentStock === undefined) {
            payload.logger.info(
              `Skipping stock restore for variation ${variationId} - unlimited stock`,
            )
            continue
          }

          const newStock = currentStock + currentItem.quantity

          await payload.update({
            collection: 'products',
            id: productId,
            data: {
              stock: newStock,
            },
          })

          payload.logger.info(
            `Restored stock for product ${productId} on return: ${currentStock} -> ${newStock}`,
          )
        }
      }
    }
  } catch (error) {
    payload.logger.error(`Error restoring stock on return: ${error}`)
  }

  return doc
}
