import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  product: string | { id: string }
  seller: string | { id: string }
  productTitle: string
  variationOptions: Record<string, string> | null
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

        // Fetch the product
        const product = await payload.findByID({
          collection: 'products',
          id: productId,
          depth: 0,
        })

        if (!product) continue

        // Check if this item has variation options
        if (currentItem.variationOptions && Object.keys(currentItem.variationOptions).length > 0) {
          // Find the matching variation and restore its stock
          const variations = product.variations as Array<{
            options: Record<string, string>
            stock?: number
          }> | undefined

          if (variations && variations.length > 0) {
            let variationIndex = -1
            
            // Find the variation that matches the order item's options
            for (let j = 0; j < variations.length; j++) {
              const variation = variations[j]
              if (!variation.options) continue
              
              // Check if all option values match
              const itemOptions = currentItem.variationOptions
              let matches = true
              
              for (const [key, value] of Object.entries(itemOptions)) {
                if (variation.options[key] !== value) {
                  matches = false
                  break
                }
              }
              
              if (matches) {
                variationIndex = j
                break
              }
            }

            if (variationIndex >= 0) {
              const currentStock = variations[variationIndex].stock
              
              // Skip if stock is null/undefined (unlimited stock)
              if (currentStock === null || currentStock === undefined) {
                payload.logger.info(
                  `Skipping stock restore for product ${productId} variation ${variationIndex} - unlimited stock`,
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
                `Restored stock for product ${productId} variation ${variationIndex} on return: ${currentStock} -> ${newStock}`,
              )
            }
          }
        } else {
          // No variation - restore product-level stock
          const currentStock = product.stock
          
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
