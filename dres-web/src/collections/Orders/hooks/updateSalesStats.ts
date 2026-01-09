import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  variation: string | { id: string }
  sku?: string | { id: string } | null
  seller: string | { id: string }
  variationTitle?: string
  price: number
  quantity: number
  shippingStatus: string
}

export const updateSalesStats: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Skip if context indicates we should skip hooks
  if (req.context?.skipHooks) return doc
  
  // Only process on update
  if (operation !== 'update') return doc

  const payload = req.payload
  const currentItems = (doc.items || []) as OrderItem[]
  const previousItems = (previousDoc?.items || []) as OrderItem[]

  payload.logger.info(`Processing ${currentItems.length} items for stats update`)

  // Create a map of previous items by their ID for accurate comparison
  const previousItemsMap = new Map<string, OrderItem>()
  for (const item of previousItems) {
    if (item.id) {
      previousItemsMap.set(item.id, item)
    }
  }

  // Find items that just changed to 'delivered'
  for (let i = 0; i < currentItems.length; i++) {
    const currentItem = currentItems[i]
    
    // Find matching previous item by ID, or fallback to index
    const previousItem = currentItem.id 
      ? previousItemsMap.get(currentItem.id) 
      : previousItems[i]

    payload.logger.info(`Item ${i}: ID=${currentItem.id}, Status=${currentItem.shippingStatus}, PrevStatus=${previousItem?.shippingStatus || 'none'}`)

    // Get SKU ID - this is required for stats
    let skuId: string | null = null
    if (currentItem.sku) {
      if (typeof currentItem.sku === 'object' && currentItem.sku !== null) {
        skuId = (currentItem.sku as { id: string }).id
      } else if (typeof currentItem.sku === 'string') {
        skuId = currentItem.sku
      }
    }

    payload.logger.info(`Item ${i}: SKU=${skuId || 'none'}`)

    // Get variation ID
    const variationId =
      typeof currentItem.variation === 'object' ? currentItem.variation.id : currentItem.variation

    // Skip if no SKU - stats are tracked at SKU level
    if (!skuId) {
      payload.logger.info(`Skipping stats update - no SKU for variation: ${variationId}`)
      continue
    }

    // Check if this item just changed to 'delivered'
    const justDelivered = currentItem.shippingStatus === 'delivered' && previousItem?.shippingStatus !== 'delivered'
    payload.logger.info(`Item ${i}: justDelivered=${justDelivered}`)

    if (!justDelivered) {
      continue
    }

    // Process this item - wrap in try-catch so one failure doesn't stop others
    try {
      const saleAmount = currentItem.price * currentItem.quantity
      const itemsSold = currentItem.quantity
      const now = new Date().toISOString()

      // Get seller ID
      const sellerId =
        typeof currentItem.seller === 'object' ? currentItem.seller.id : currentItem.seller

      // Fetch SKU to get variation info
      const sku = await payload.findByID({
        collection: 'skus',
        id: skuId,
        depth: 3,
      })

      // Get variation ID from SKU - ensure it's a string ID
      let skuVariationId: string = variationId
      const skuVariation = sku?.variation
      if (skuVariation) {
        if (typeof skuVariation === 'object' && skuVariation !== null && 'id' in skuVariation) {
          skuVariationId = (skuVariation as { id: string }).id
        } else if (typeof skuVariation === 'string') {
          skuVariationId = skuVariation
        }
      }

      payload.logger.info(`Item ${i}: Using variationId=${skuVariationId} for stats`)

      // Get style data from variation
      let departmentId: string | null = null
      let categoryId: string | null = null
      let brandId: string | null = null
      let collectionId: string | null = null

      if (skuVariation && typeof skuVariation === 'object') {
        const variationObj = skuVariation as unknown as Record<string, unknown>
        const style = variationObj.style
        
        if (style && typeof style === 'object') {
          const styleData = style as Record<string, unknown>
          
          // Extract department ID
          const dept = styleData.department
          if (dept) {
            if (typeof dept === 'object' && dept !== null && 'id' in dept) {
              departmentId = (dept as { id: string }).id
            } else if (typeof dept === 'string') {
              departmentId = dept
            }
          }
          
          // Extract category ID
          const cat = styleData.category
          if (cat) {
            if (typeof cat === 'object' && cat !== null && 'id' in cat) {
              categoryId = (cat as { id: string }).id
            } else if (typeof cat === 'string') {
              categoryId = cat
            }
          }
          
          // Extract brand ID
          const brand = styleData.brand
          if (brand) {
            if (typeof brand === 'object' && brand !== null && 'id' in brand) {
              brandId = (brand as { id: string }).id
            } else if (typeof brand === 'string') {
              brandId = brand
            }
          }

          // Get collection from category
          if (cat && typeof cat === 'object' && cat !== null && 'collections' in cat) {
            const catObj = cat as { collections?: unknown[] }
            if (Array.isArray(catObj.collections) && catObj.collections.length > 0) {
              const firstCollection = catObj.collections[0]
              if (firstCollection) {
                if (typeof firstCollection === 'object' && firstCollection !== null && 'id' in firstCollection) {
                  collectionId = (firstCollection as { id: string }).id
                } else if (typeof firstCollection === 'string') {
                  collectionId = firstCollection
                }
              }
            }
          }
        }
      }

      // Find existing stats record by SKU + Variation
      const existingStats = await payload.find({
        collection: 'variation-stats',
        where: {
         sku: { equals: skuId } 
        },
        limit: 1,
      })

      if (existingStats.docs.length > 0) {
        // Update existing stats
        const stats = existingStats.docs[0]
        await payload.update({
          collection: 'variation-stats',
          id: stats.id,
          data: {
            totalSales: (stats.totalSales || 0) + saleAmount,
            totalOrders: (stats.totalOrders || 0) + 1,
            totalItemsSold: (stats.totalItemsSold || 0) + itemsSold,
            lastSaleAt: now,
          },
        })
        payload.logger.info(`Updated existing stats for SKU: ${skuId}`)
      } else {
        // Create new stats record for this SKU
        await payload.create({
          collection: 'variation-stats',
          data: {
            variation: skuVariationId,
            sku: skuId,
            seller: sellerId || null,
            department: departmentId,
            collection: collectionId,
            category: categoryId,
            brand: brandId,
            totalSales: saleAmount,
            totalOrders: 1,
            totalItemsSold: itemsSold,
            lastSaleAt: now,
          },
        })
        payload.logger.info(`Created NEW stats record for SKU: ${skuId}`)
      }

      payload.logger.info(`Stats updated - SKU: ${skuId}, Sales: ${saleAmount}, Items: ${itemsSold}`)
    } catch (error) {
      payload.logger.error(`Error updating stats for item ${i} (SKU: ${skuId}): ${error}`)
      // Continue to next item
    }
  }

  return doc
}
