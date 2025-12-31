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
  variation: string
  seller: string
  variationTitle: string
  variationImage: string
  sku: string | null
  skuTitle: string | null
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

interface ShippingAddressContext {
  fullName: string
  phone: string
  address: string
  city: string
  cityId?: string
  region: string
  regionId?: string
  country: string
  countryId?: string
  postalCode: string
  deliveryNotes: string
}

export const createOrderFromCart: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
  context,
}) => {
  // Only trigger when status changes to 'converted'
  if (doc.status !== 'converted') return doc
  if (operation === 'update' && previousDoc?.status === 'converted') return doc

  const payload = req.payload

  // Get shipping address from context (passed by placeOrder endpoint)
  const shippingAddress = context?.shippingAddress as ShippingAddressContext | undefined

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
      const variationId = typeof item.variation === 'object' ? item.variation.id : item.variation

      // Fetch variation with style and seller
      const variation = await payload.findByID({
        collection: 'variations',
        id: variationId,
        depth: 2,
      })

      if (!variation) continue

      // Get style for seller info
      const style = typeof variation.style === 'object' ? variation.style : null

      // Check if seller is on vacation
      const seller = style?.seller
      if (seller && typeof seller === 'object' && seller.vacationMode === true) {
        // Skip variations from sellers on vacation
        payload.logger.info(`Skipping variation ${variation.slug} - seller on vacation`)
        continue
      }

      // Get SKU ID and title if exists
      let skuId: string | null = null
      let skuTitle: string | null = null
      
      // item.sku is now a relationship to skus collection
      const skuRef = item.sku
      if (skuRef) {
        skuId = typeof skuRef === 'object' ? skuRef.id : skuRef
      }

      // Get seller info
      const sellerId = typeof seller === 'object' ? seller.id : seller
      const sellerName =
        typeof seller === 'object'
          ? seller.shopName || `${seller.firstName || ''} ${seller.lastName || ''}`.trim() || 'Unknown Seller'
          : 'Unknown Seller'

      // Get variation image URL (first image)
      let variationImage = ''
      if (variation.images && Array.isArray(variation.images) && variation.images.length > 0) {
        const firstImage = variation.images[0]
        // Handle both populated media object and raw ID
        if (typeof firstImage === 'object' && firstImage !== null) {
          variationImage = firstImage.url || ''
        } else if (typeof firstImage === 'string') {
          // If it's just an ID, we need to fetch the media
          try {
            const media = await payload.findByID({
              collection: 'media',
              id: firstImage,
            })
            variationImage = media?.url || ''
          } catch {
            // Ignore errors
          }
        }
      }
      payload.logger.info(`Variation ${variation.slug} image: ${variationImage}`)

      // Get price, original price, and SKU title from SKU
      let itemPrice = item.price || 0
      let originalPrice = item.price || 0
      
      if (skuId) {
        // Fetch SKU to get price, original price and title
        const skuData = await payload.findByID({
          collection: 'skus',
          id: skuId,
          depth: 0,
        })
        if (skuData?.sellingPrice) {
          itemPrice = skuData.sellingPrice
        } else if (skuData?.price) {
          itemPrice = Math.round(skuData.price * 1.1 * 100) / 100 // Add 10% platform fee
        }
        if (skuData?.price) {
          originalPrice = skuData.price
        }
        if (skuData?.title) {
          skuTitle = skuData.title
        }
      } else {
        // No SKU selected - try to get price from first available SKU of this variation
        try {
          const skus = await payload.find({
            collection: 'skus',
            where: {
              variation: { equals: variationId },
              isActive: { equals: true },
            },
            limit: 1,
            sort: 'price',
          })
          if (skus.docs.length > 0) {
            const firstSku = skus.docs[0]
            skuId = firstSku.id
            if (firstSku?.sellingPrice) {
              itemPrice = firstSku.sellingPrice
            } else if (firstSku?.price) {
              itemPrice = Math.round(firstSku.price * 1.1 * 100) / 100
            }
            if (firstSku?.price) {
              originalPrice = firstSku.price
            }
            if (firstSku?.title) {
              skuTitle = firstSku.title
            }
          }
        } catch {
          // Ignore errors
        }
      }

      // Get department ID from style
      const departmentId = style?.department
        ? typeof style.department === 'object'
          ? style.department.id
          : style.department
        : ''

      // Get category ID from style
      const category = style?.category
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

      // Get brand ID from style
      const brandId = style?.brand
        ? typeof style.brand === 'object'
          ? style.brand.id
          : style.brand
        : ''

      orderItems.push({
        variation: variationId,
        seller: sellerId || '',
        variationTitle: variation.slug || 'Unknown Variation',
        variationImage,
        sku: skuId,
        skuTitle,
        sellerName,
        price: itemPrice,
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

    // Get discount info from cart
    const discountCodeId = doc.discountCode
      ? typeof doc.discountCode === 'object'
        ? doc.discountCode.id
        : doc.discountCode
      : null
    const discountAmount = doc.discountAmount || 0
    
    // Get discount code string if applied
    let discountCodeUsed: string | undefined
    if (discountCodeId) {
      try {
        const discountCodeDoc = await payload.findByID({
          collection: 'discount-codes',
          id: discountCodeId,
          depth: 0,
        })
        discountCodeUsed = discountCodeDoc?.code || undefined
      } catch {
        // Ignore error, code string is optional
      }
    }

    // Group items by seller for shipping calculation (one shipping fee per seller)
    const itemsBySeller = new Map<string, typeof orderItems>()
    for (const item of orderItems) {
      const sellerId = item.seller || 'unknown'
      if (!itemsBySeller.has(sellerId)) {
        itemsBySeller.set(sellerId, [])
      }
      itemsBySeller.get(sellerId)!.push(item)
    }

    // Calculate totals
    const totalItems = orderItems.reduce((sum, item) => sum + item.quantity, 0)
    const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    
    // Total shipping = ONE shipping fee per seller (from first item of each seller)
    let totalShipping = 0
    let totalBuyerProtection = 0
    for (const [, sellerItems] of itemsBySeller) {
      // One shipping fee per seller
      totalShipping += sellerItems[0]?.shippingFee || 0
      // Sum all buyer protection fees
      for (const item of sellerItems) {
        totalBuyerProtection += item.buyerProtectionFee || 0
      }
    }
    
    const pointsDiscount = doc.pointsDiscount || 0
    const grandTotal = Math.max(0, subtotal + totalShipping + totalBuyerProtection - discountAmount - pointsDiscount)

    // Create the order
    const order = await payload.create({
      collection: 'orders',
      data: {
        orderId: generateOrderId(),
        cart: doc.id,
        customer: typeof doc.customer === 'object' ? doc.customer.id : doc.customer,
        sellers: uniqueSellerIds,
        status: 'new',
        items: orderItems,
        totalItems,
        subtotal,
        grandTotal,
        discountCode: discountCodeId || undefined,
        discountCodeUsed,
        discountAmount,
        pointsRedeemed: doc.pointsToRedeem || 0,
        pointsDiscount: doc.pointsDiscount || 0,
        currency: currencyId || undefined,
        shippingDetails: {
          fullName: shippingAddress?.fullName || `${cartCustomer?.firstName || ''} ${cartCustomer?.lastName || ''}`.trim() || '',
          phone: shippingAddress?.phone || '',
          address: shippingAddress?.address || '',
          city: shippingAddress?.city || '',
          region: shippingAddress?.region || '',
          postalCode: shippingAddress?.postalCode || '',
          country: shippingAddress?.countryId || countryId || undefined,
          deliveryNotes: shippingAddress?.deliveryNotes || '',
        },
        billingDetails: {
          accountName: `${cartCustomer?.firstName || ''} ${cartCustomer?.lastName || ''}`.trim() || '',
          accountNumber: '',
          bank: '',
        },
        placedAt: new Date().toISOString(),
      },
    })

    // Deduct redeemed points from user balance
    if (doc.pointsToRedeem && doc.pointsToRedeem > 0) {
      try {
        const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
        const userPoints = await payload.find({
          collection: 'user-points',
          where: {
            user: { equals: customerId },
          },
          limit: 1,
        })

        if (userPoints.docs.length > 0) {
          const existingPoints = userPoints.docs[0]
          const currentHistory = (existingPoints.history || []) as Array<{
            type: 'earned' | 'redeemed' | 'expired' | 'adjusted'
            points: number
            description?: string
            order?: string
            createdAt?: string
          }>

          await payload.update({
            collection: 'user-points',
            id: existingPoints.id,
            data: {
              balance: Math.max(0, (existingPoints.balance || 0) - doc.pointsToRedeem),
              totalRedeemed: (existingPoints.totalRedeemed || 0) + doc.pointsToRedeem,
              history: [
                ...currentHistory,
                {
                  type: 'redeemed' as const,
                  points: -doc.pointsToRedeem,
                  description: `Redeemed for order ${order.orderId}`,
                  order: order.id,
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          })

          payload.logger.info(
            `Deducted ${doc.pointsToRedeem} points from user ${customerId} for order ${order.orderId}`,
          )
        }
      } catch (error) {
        payload.logger.error(`Error deducting points: ${error}`)
      }
    }

    // Update discount code usage if one was applied
    if (discountCodeId) {
      try {
        const discountCode = await payload.findByID({
          collection: 'discount-codes',
          id: discountCodeId,
          depth: 0,
        })

        if (discountCode) {
          const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
          const usedBy = (discountCode.usedBy || []) as Array<{
            user: string
            usedAt: string
            order?: string
          }>

          await payload.update({
            collection: 'discount-codes',
            id: discountCodeId,
            data: {
              usageCount: (discountCode.usageCount || 0) + 1,
              usedBy: [
                ...usedBy,
                {
                  user: customerId,
                  usedAt: new Date().toISOString(),
                  order: order.id,
                },
              ],
            },
          })
        }
      } catch (error) {
        payload.logger.error(`Error updating discount code usage: ${error}`)
      }
    }

    payload.logger.info(`Order created from cart ${doc.id} with ${orderItems.length} items - Grand Total: ${grandTotal} (Discount: ${discountAmount})`)
  } catch (error) {
    payload.logger.error(`Error creating order from cart: ${error}`)
  }

  return doc
}
