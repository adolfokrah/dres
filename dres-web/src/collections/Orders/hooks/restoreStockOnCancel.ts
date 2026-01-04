import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  variation: string | { id: string }
  seller: string | { id: string }
  productTitle: string
  sku: string | { id: string } | null
  quantity: number
  shippingStatus?: string
}

/**
 * Restore stock when an order is cancelled and update all items to cancelled status
 * This hook runs after an order update and checks if status changed to 'cancelled'
 */
export const restoreStockOnCancel: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only trigger on update operations
  if (operation !== 'update') return doc

  // Only trigger when status changes TO 'cancelled'
  const previousStatus = previousDoc?.status
  const newStatus = doc.status

  if (newStatus !== 'cancelled' || previousStatus === 'cancelled') {
    return doc
  }

  const payload = req.payload

  payload.logger.info(`🔄 Order ${doc.orderId} cancelled - restoring stock and updating item statuses`)

  try {
    const items = (doc.items || []) as OrderItem[]

    // Update all items to cancelled status
    const updatedItems = items.map((item) => ({
      ...item,
      shippingStatus: 'cancelled' as const,
    }))

    // Update the order with cancelled item statuses
    await payload.update({
      collection: 'orders',
      id: doc.id,
      data: {
        items: updatedItems as any, // Type will be correct after regeneration
        status: 'cancelled', // Ensure status stays cancelled
      },
      // Bypass hooks to prevent infinite loop
      context: {
        skipHooks: true,
      },
    })

    // Restore stock for each item
    for (const item of items) {
      const variationId = typeof item.variation === 'object' ? item.variation.id : item.variation
      if (!variationId) continue

      // Get SKU ID from the sku field (can be string or object)
      const skuId = typeof item.sku === 'object' ? item.sku?.id : item.sku

      // If item has a SKU ID, restore SKU stock
      if (skuId) {
        // Fetch the SKU from skus collection
        const sku = await payload.findByID({
          collection: 'skus',
          id: skuId,
          depth: 0,
        })

        if (!sku) {
          payload.logger.warn(`🔄 SKU ${skuId} not found for stock restoration`)
          continue
        }

        const currentStock = sku.stock

        // Skip if stock is null/undefined (unlimited stock)
        if (currentStock === null || currentStock === undefined) {
          payload.logger.info(
            `🔄 Skipping stock restoration for SKU ${skuId} - unlimited stock`,
          )
          continue
        }

        const newStock = currentStock + item.quantity

        // Update the SKU stock directly in skus collection
        await payload.update({
          collection: 'skus',
          id: skuId,
          data: {
            stock: newStock,
          },
        })

        payload.logger.info(
          `🔄 Restored stock for SKU ${skuId}: ${currentStock} -> ${newStock} (+${item.quantity})`,
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
            `🔄 No SKUs found for variation ${variationId} - cannot restore stock`,
          )
          continue
        }

        const firstSku = skus.docs[0]
        const currentStock = firstSku.stock

        // Skip if stock is null/undefined (unlimited stock)
        if (currentStock === null || currentStock === undefined) {
          payload.logger.info(
            `🔄 Skipping stock restoration for SKU ${firstSku.id} - unlimited stock`,
          )
          continue
        }

        const newStock = currentStock + item.quantity

        await payload.update({
          collection: 'skus',
          id: firstSku.id,
          data: {
            stock: newStock,
          },
        })

        payload.logger.info(
          `🔄 Restored stock for SKU ${firstSku.id} (via variation): ${currentStock} -> ${newStock} (+${item.quantity})`,
        )
      }
    }

    payload.logger.info(`🔄 Stock restoration complete for order ${doc.orderId}`)
  } catch (error) {
    payload.logger.error(`🔄 Error restoring stock for order ${doc.orderId}: ${error}`)
  }

  return doc
}
