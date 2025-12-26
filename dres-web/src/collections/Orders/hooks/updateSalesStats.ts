import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  variation: string | { id: string }
  sku?: string | { id: string } | null
  seller: string | { id: string }
  productTitle: string
  productImage: string
  variationOptions: Record<string, string> | null
  sellerName: string
  price: number
  originalPrice: number
  quantity: number
  shippingFee: number
  buyerProtection: boolean
  buyerProtectionFee: number
  shippingStatus: string
}

export const updateSalesStats: CollectionAfterChangeHook = async ({
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

    // Find items that just changed to 'delivered'
    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i]
      const previousItem = previousItems[i]

      // Get variation ID
      const variationId =
        typeof currentItem.variation === 'object' ? currentItem.variation.id : currentItem.variation

      // Check if this item just changed to 'delivered'
      if (
        currentItem.shippingStatus === 'delivered' &&
        previousItem?.shippingStatus !== 'delivered' &&
        variationId
      ) {
        const saleAmount = currentItem.price * currentItem.quantity
        const itemsSold = currentItem.quantity
        const now = new Date().toISOString()

        // Get seller ID
        const sellerId =
          typeof currentItem.seller === 'object' ? currentItem.seller.id : currentItem.seller

        // Fetch variation to get style -> category, department, brand
        const variation = await payload.findByID({
          collection: 'variations',
          id: variationId,
          depth: 3,
        })

        // Get style data
        const style = variation?.style
        const styleData = style && typeof style === 'object' ? style : null

        // Get IDs from style
        const departmentId = styleData?.department
          ? typeof styleData.department === 'object'
            ? styleData.department.id
            : styleData.department
          : null
        const categoryId = styleData?.category
          ? typeof styleData.category === 'object'
            ? styleData.category.id
            : styleData.category
          : null
        const brandId = styleData?.brand
          ? typeof styleData.brand === 'object'
            ? styleData.brand.id
            : styleData.brand
          : null

        // Get collection from category
        let collectionId = null
        const category = styleData?.category
        if (
          category &&
          typeof category === 'object' &&
          category.collections &&
          Array.isArray(category.collections) &&
          category.collections.length > 0
        ) {
          const firstCollection = category.collections[0]
          collectionId =
            typeof firstCollection === 'object' ? firstCollection.id : firstCollection
        }

        // Find existing stats record for this variation
        const existingStats = await payload.find({
          collection: 'variation-stats',
          where: {
            variation: { equals: variationId },
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
        } else {
          // Create new stats record
          await payload.create({
            collection: 'variation-stats',
            data: {
              variation: variationId,
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
        }

        payload.logger.info(
          `Updated variation stats for: ${currentItem.productTitle} - Sales: ${saleAmount}, Items: ${itemsSold}`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error updating sales stats: ${error}`)
  }

  return doc
}
