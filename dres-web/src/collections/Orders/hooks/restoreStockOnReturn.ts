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
        const productId = typeof currentItem.product === 'object' 
          ? currentItem.product.id 
          : currentItem.product
        
        if (!productId) continue

        const variationId = currentItem.variationId

        // If item has a variation ID, restore variation stock
        if (variationId) {
          // Fetch the variation from product-variations collection
          const variation = await payload.findByID({
            collection: 'product-variations',
            id: variationId,
            depth: 0,
          })

          if (!variation) {
            payload.logger.warn(`Variation ${variationId} not found for stock restore`)
            continue
          }

          const currentStock = variation.stock

          // Skip if stock is null/undefined (unlimited stock)
          if (currentStock === null || currentStock === undefined) {
            payload.logger.info(
              `Skipping stock restore for variation ${variationId} - unlimited stock`,
            )
            continue
          }

          const newStock = currentStock + currentItem.quantity

          // Update the variation stock directly in product-variations collection
          await payload.update({
            collection: 'product-variations',
            id: variationId,
            data: {
              stock: newStock,
            },
          })

          payload.logger.info(
            `Restored stock for variation ${variationId} on return: ${currentStock} -> ${newStock}`,
          )
        } else {
          // No variation - restore product-level stock
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
              `Skipping stock restore for product ${productId} - unlimited stock`,
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
