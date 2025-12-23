import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  product: string | { id: string }
  seller: string | { id: string }
  productTitle: string
  variationOptions: Record<string, string> | null
  quantity: number
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
      const variations = product.variations as Array<{
        options: Record<string, string>
        stock?: number
      }> | undefined
      
      const hasVariations = variations && variations.length > 0

      // If product has variations, reduce variation stock; otherwise reduce product stock
      if (hasVariations && item.variationOptions && Object.keys(item.variationOptions).length > 0) {
        // Find the matching variation and reduce its stock
        let variationIndex = -1
        
        // Find the variation that matches the order item's options
        for (let i = 0; i < variations.length; i++) {
          const variation = variations[i]
          if (!variation.options) continue
          
          // Check if all option values match
          const itemOptions = item.variationOptions
          let matches = true
          
          for (const [key, value] of Object.entries(itemOptions)) {
            if (variation.options[key] !== value) {
              matches = false
              break
            }
          }
          
          if (matches) {
            variationIndex = i
            break
          }
        }

        if (variationIndex >= 0) {
          const currentStock = variations[variationIndex].stock
          
          // Skip if stock is null/undefined (unlimited stock)
          if (currentStock === null || currentStock === undefined) {
            payload.logger.info(
              `Skipping stock reduction for product ${productId} variation ${variationIndex} - unlimited stock`,
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
            `Reduced stock for product ${productId} variation ${variationIndex}: ${currentStock} -> ${newStock}`,
          )
        }
      } else if (!hasVariations) {
        // No variations - reduce product-level stock
        const currentStock = product.stock
        
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
