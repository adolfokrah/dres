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

interface Variation {
  id?: string
  options: Record<string, string>
  stock?: number | null
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

        // Fetch the product
        const product = await payload.findByID({
          collection: 'products',
          id: productId,
          depth: 0,
        })

        if (!product) continue

        // Check if product has variations
        const variations = product.variations as Variation[] | undefined
        const hasVariations = variations && variations.length > 0
        const variationId = currentItem.variationId

        // If product has variations and item has a variation ID, restore variation stock
        if (hasVariations && variationId) {
          // Find the variation by ID
          const variationIndex = variations.findIndex((v) => v.id === variationId)
          
          if (variationIndex >= 0) {
            const currentStock = variations[variationIndex].stock
            
            // Skip if stock is null/undefined (unlimited stock)
            if (currentStock === null || currentStock === undefined) {
              payload.logger.info(
                `Skipping stock restore for product ${productId} variation ${variationId} - unlimited stock`,
              )
              continue
            }
            
            const newStock = currentStock + currentItem.quantity
            
            // Update the variation stock
            variations[variationIndex].stock = newStock
            
            await payload.update({
              collection: 'products',
              id: productId,
              data: {
                variations: variations,
              },
            })
            
            payload.logger.info(
              `Restored stock for product ${productId} variation ${variationId} on return: ${currentStock} -> ${newStock}`,
            )
          }
        } else if (!hasVariations) {
          // No variations - restore product-level stock
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
