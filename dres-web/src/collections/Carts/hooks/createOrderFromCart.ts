import type { CollectionAfterChangeHook } from 'payload'

// Generate unique order ID: ORD-YYYYMMDD-XXXXXX-XXXX
const generateOrderId = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomUUID().split('-')[0].toUpperCase()
  return `ORD-${dateStr}-${timestamp}-${random}`
}

interface StatusLog {
  status: string
  timestamp: string
}

type ShippingStatus = 'placed' | 'out_for_delivery' | 'delivered' | 'return_in_progress' | 'returned' | 'not_available'

interface OrderItem {
  product: string
  seller: string
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
  shippingStatus: ShippingStatus
  statusLogs: StatusLog[]
}

export const createOrderFromCart: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only trigger when status changes to 'converted'
  if (doc.status !== 'converted') return doc
  if (operation === 'update' && previousDoc?.status === 'converted') return doc

  const payload = req.payload

  try {
    // Get cart customer details for shipping/billing
    const cartCustomer = await payload.findByID({
      collection: 'users',
      id: typeof doc.customer === 'object' ? doc.customer.id : doc.customer,
      depth: 1,
    })

    // Process cart items - exclude sellers on vacation
    const orderItems: OrderItem[] = []

    for (const item of doc.items || []) {
      const productId = typeof item.product === 'object' ? item.product.id : item.product

      // Fetch product with seller and category (for collections)
      const product = await payload.findByID({
        collection: 'products',
        id: productId,
        depth: 2,
      })

      if (!product) continue

      // Check if seller is on vacation
      const seller = product.seller
      if (seller && typeof seller === 'object' && seller.vacationMode === true) {
        // Skip products from sellers on vacation
        payload.logger.info(`Skipping product ${product.title} - seller on vacation`)
        continue
      }

      // Get variation options if exists and resolve IDs to names
      let variationOptions: Record<string, string> | null = null
      if (item.variation !== null && item.variation !== undefined && product.variations?.[item.variation]) {
        const opts = product.variations[item.variation].options
        if (opts && typeof opts === 'object' && !Array.isArray(opts)) {
          // Resolve option IDs to their names
          const resolvedOptions: Record<string, string> = {}
          for (const [attrName, optionId] of Object.entries(opts)) {
            if (optionId && typeof optionId === 'string') {
              try {
                const option = await payload.findByID({
                  collection: 'attributeOptions',
                  id: optionId,
                  depth: 0,
                })
                resolvedOptions[attrName] = option?.name || optionId
              } catch {
                resolvedOptions[attrName] = String(optionId)
              }
            }
          }
          variationOptions = Object.keys(resolvedOptions).length > 0 ? resolvedOptions : null
        }
      }

      // Get seller info
      const sellerId = typeof seller === 'object' ? seller.id : seller
      const sellerName =
        typeof seller === 'object'
          ? seller.shopName || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Unknown Seller'
          : 'Unknown Seller'

      // Get product image URL (first image)
      let productImage = ''
      if (product.images && Array.isArray(product.images) && product.images.length > 0) {
        const firstImage = product.images[0]
        if (typeof firstImage === 'object' && firstImage.url) {
          productImage = firstImage.url
        }
      }

      // Get original price (base price without platform fees)
      let originalPrice = product.price || 0
      if (item.variation !== null && item.variation !== undefined && product.variations?.[item.variation]) {
        const variation = product.variations[item.variation]
        if (variation.price) {
          originalPrice = variation.price
        }
      }

      // Get department ID from product
      const departmentId = product.department
        ? typeof product.department === 'object'
          ? product.department.id
          : product.department
        : ''

      // Get category ID from product
      const category = product.category
      const categoryId = category
        ? typeof category === 'object'
          ? category.id
          : category
        : ''

      // Get collection ID from category (first collection if multiple)
      let collectionId = ''
      if (
        category &&
        typeof category === 'object' &&
        category.collections &&
        Array.isArray(category.collections) &&
        category.collections.length > 0
      ) {
        const firstCollection = category.collections[0]
        collectionId = typeof firstCollection === 'object' ? firstCollection.id : firstCollection
      }

      // Get brand ID from product
      const brandId = product.brand
        ? typeof product.brand === 'object'
          ? product.brand.id
          : product.brand
        : ''

      orderItems.push({
        product: productId,
        seller: sellerId,
        productTitle: product.title || 'Unknown Product',
        productImage,
        variationOptions,
        sellerName,
        price: item.price || 0,
        originalPrice,
        quantity: item.quantity || 1,
        shippingFee: item.shippingFee || 0,
        buyerProtection: item.buyerProtection || false,
        buyerProtectionFee: item.buyerProtectionFee || 0,
        shippingStatus: 'placed',
        statusLogs: [
          {
            status: 'placed',
            timestamp: new Date().toISOString(),
          },
        ],
      })
    }

    // Only create order if there are items (after excluding vacation sellers)
    if (orderItems.length === 0) {
      payload.logger.warn('No items available for order - all sellers may be on vacation')
      return doc
    }

    // Get unique seller IDs for the sellers field
    const uniqueSellerIds = [...new Set(orderItems.map((item) => item.seller).filter(Boolean))]

    // Get customer's country and currency for shipping
    const customerCountry = cartCustomer?.country
    const countryId = typeof customerCountry === 'object' ? customerCountry?.id : customerCountry
    
    // Get currency from cart or customer's country
    let currencyId = doc.currency
    if (!currencyId && customerCountry && typeof customerCountry === 'object') {
      currencyId = typeof customerCountry.currency === 'object' 
        ? customerCountry.currency.id 
        : customerCountry.currency
    }

    // Calculate totals
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0)
    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalShipping = orderItems.reduce((sum, item) => sum + (item.shippingFee || 0), 0)
    const totalBuyerProtection = orderItems.reduce((sum, item) => sum + (item.buyerProtectionFee || 0), 0)
    const grandTotal = totalAmount + totalShipping + totalBuyerProtection

    // Create the order
    await payload.create({
      collection: 'orders',
      data: {
        orderId: generateOrderId(),
        customer: typeof doc.customer === 'object' ? doc.customer.id : doc.customer,
        sellers: uniqueSellerIds,
        status: 'placed',
        items: orderItems,
        totalItems,
        totalAmount,
        grandTotal,
        currency: currencyId || undefined,
        shippingDetails: {
          fullName: `${cartCustomer?.firstName || ''} ${cartCustomer?.lastName || ''}`.trim() || '',
          phone: '',
          address: '',
          city: '',
          region: '',
          postalCode: '',
          country: countryId || undefined,
          deliveryNotes: '',
        },
        billingDetails: {
          accountName: `${cartCustomer?.firstName || ''} ${cartCustomer?.lastName || ''}`.trim() || '',
          accountNumber: '',
          bank: '',
        },
        placedAt: new Date().toISOString(),
      },
    })

    payload.logger.info(`Order created from cart ${doc.id} with ${orderItems.length} items - Grand Total: ${grandTotal}`)
  } catch (error) {
    payload.logger.error(`Error creating order from cart: ${error}`)
  }

  return doc
}
