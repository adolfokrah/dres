import type { CollectionAfterChangeHook } from 'payload'

interface OrderItem {
  id?: string
  product: string | { id: string }
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

      // Get product ID
      const productId =
        typeof currentItem.product === 'object' ? currentItem.product.id : currentItem.product

      // Check if this item just changed to 'delivered'
      if (
        currentItem.shippingStatus === 'delivered' &&
        previousItem?.shippingStatus !== 'delivered' &&
        productId
      ) {
        const saleAmount = currentItem.price * currentItem.quantity
        const itemsSold = currentItem.quantity
        const now = new Date().toISOString()

        // Get seller ID
        const sellerId =
          typeof currentItem.seller === 'object' ? currentItem.seller.id : currentItem.seller

        // Fetch product to get department, category, collection, brand
        const product = await payload.findByID({
          collection: 'products',
          id: productId,
          depth: 2,
        })

        // Get IDs from product
        const departmentId = product?.department
          ? typeof product.department === 'object'
            ? product.department.id
            : product.department
          : null
        const categoryId = product?.category
          ? typeof product.category === 'object'
            ? product.category.id
            : product.category
          : null
        const brandId = product?.brand
          ? typeof product.brand === 'object'
            ? product.brand.id
            : product.brand
          : null

        // Get collection from category
        let collectionId = null
        const category = product?.category
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

        // Find existing stats record for this product
        const existingStats = await payload.find({
          collection: 'product-stats',
          where: {
            product: { equals: productId },
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
          // Create new stats record
          await payload.create({
            collection: 'product-stats',
            data: {
              product: productId,
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
          `Updated product stats for: ${currentItem.productTitle} - Sales: ${saleAmount}, Items: ${itemsSold}`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error updating sales stats: ${error}`)
  }

  return doc
}
