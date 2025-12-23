import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id: string
  productId: string
  productTitle: string
  productImage: string
  variationOptions: Record<string, string> | null
  sellerId: string
  sellerName: string
  departmentId: string
  collectionId: string
  categoryId: string
  brandId: string
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

      // Check if this item just changed to 'delivered'
      if (
        currentItem.shippingStatus === 'delivered' &&
        previousItem?.shippingStatus !== 'delivered' &&
        currentItem.productId
      ) {
        const saleAmount = currentItem.price * currentItem.quantity
        const itemsSold = currentItem.quantity
        const now = new Date().toISOString()

        // Find existing stats record for this product
        const existingStats = await payload.find({
          collection: 'product-stats',
          where: {
            product: { equals: currentItem.productId },
          },
          limit: 1,
        })

        if (existingStats.docs.length > 0) {
          // Update existing stats
          const stats = existingStats.docs[0]
          await payload.update({
            collection: 'product-stats',
            id: stats.id,
            data: {
              totalSales: (stats.totalSales || 0) + saleAmount,
              totalOrders: (stats.totalOrders || 0) + 1,
              totalItemsSold: (stats.totalItemsSold || 0) + itemsSold,
              lastSaleAt: now,
            },
          })
        } else {
          // Create new stats record with seller, department, collection, category, brand from order item
          await payload.create({
            collection: 'product-stats',
            data: {
              product: currentItem.productId,
              seller: currentItem.sellerId || null,
              department: currentItem.departmentId || null,
              collection: currentItem.collectionId || null,
              category: currentItem.categoryId || null,
              brand: currentItem.brandId || null,
              totalSales: saleAmount,
              totalOrders: 1,
              totalItemsSold: itemsSold,
              lastSaleAt: now,
            },
          })
        }

        payload.logger.info(
          `Updated product stats for: ${currentItem.productTitle} - Sales: ${saleAmount}, Items: ${itemsSold}`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error updating sales stats: ${error}`)
  }

  return doc
}
