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

interface Variation {
  id?: string
  options: Record<string, string>
  stock?: number | null
}

export const reduceStockOnOrder: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
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
      const variationId = item.variationId

      // If product has variations and item has a variation ID, reduce variation stock
      if (hasVariations && variationId) {
        // Find the variation by ID
        const variationIndex = variations.findIndex((v) => v.id === variationId)
        
        if (variationIndex >= 0) {
          const currentStock = variations[variationIndex].stock
          
          // Skip if stock is null/undefined (unlimited stock)
          if (currentStock === null || currentStock === undefined) {
            payload.logger.info(
              `Skipping stock reduction for product ${productId} variation ${variationId} - unlimited stock`,
            )
            continue
          }
          
          const newStock = Math.max(0, currentStock - item.quantity)
          
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
            `Reduced stock for product ${productId} variation ${variationId}: ${currentStock} -> ${newStock}`,
          )
        }
      } else if (!hasVariations) {
        // No variations - reduce product-level stock
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
