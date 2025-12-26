import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  variation: string | { id: string }
  seller: string | { id: string }
  productTitle: string
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

        // variationId field in Orders stores the SKU ID
        const skuId = currentItem.variationId

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
              `No SKUs found for variation ${variationId} - cannot restore stock`,
            )
            continue
          }

          const firstSku = skus.docs[0]
          const currentStock = firstSku.stock

          // Skip if stock is null/undefined (unlimited stock)
          if (currentStock === null || currentStock === undefined) {
            payload.logger.info(
              `Skipping stock restore for variation ${variationId} - unlimited stock`,
            )
            continue
          }

          const newStock = currentStock + currentItem.quantity

          await payload.update({
            collection: 'skus',
            id: firstSku.id,
            data: {
              stock: newStock,
            },
          })

          payload.logger.info(
            `Restored stock for SKU ${firstSku.id} (variation ${variationId}) on return: ${currentStock} -> ${newStock}`,
          )
        }
      }
    }
  } catch (error) {
    payload.logger.error(`Error restoring stock on return: ${error}`)
  }

  return doc
}
