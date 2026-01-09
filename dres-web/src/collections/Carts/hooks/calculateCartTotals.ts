import type { CollectionBeforeChangeHook } from 'payload'

interface CartItem {
  variation?: string | { id: string }
  sku?: string | { id: string }
  buyerProtection?: boolean
  shippingFee?: number
  buyerProtectionFee?: number
  quantity?: number
  price?: number
  _sellerId?: string // Internal field for grouping
}

interface OriginalCartItem {
  buyerProtectionFee?: number
}

/**
 * Calculate cart totals: itemCount, subtotal, grandTotal
 * Also calculates buyer protection fees for each item
 */
export const calculateCartTotals: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  // Skip on create - let defaults handle it
  if (operation === 'create') {
    if (data?.items && Array.isArray(data.items)) {
      // Auto-populate price from SKU or variation
      for (const item of data.items as CartItem[]) {
        // Get variation ID
        const variationId = item.variation 
          ? (typeof item.variation === 'object' ? item.variation.id : item.variation)
          : null

        // If SKU is selected, use SKU price
        if (item.sku) {
          const skuId = typeof item.sku === 'object' ? item.sku.id : item.sku
          try {
            const sku = await req.payload.findByID({
              collection: 'skus',
              id: skuId,
              depth: 0,
            })
            if (sku?.sellingPrice) {
              item.price = sku.sellingPrice
            } else if (sku?.price) {
              item.price = Math.round(sku.price * 1.1 * 100) / 100 // Add 10% platform fee
            }
          } catch {
            // Ignore errors
          }
        } else if (variationId && !item.price) {
          // No SKU selected - try to get price from first SKU of variation
          try {
            const skus = await req.payload.find({
              collection: 'skus',
              where: {
                variation: { equals: variationId },
              },
              limit: 1,
              depth: 0,
            })
            if (skus.docs.length > 0) {
              const sku = skus.docs[0]
              item.price = sku.sellingPrice || (sku.price ? Math.round(sku.price * 1.1 * 100) / 100 : 0)
            }
          } catch {
            // Ignore errors
          }
        }
      }

      // Fetch seller IDs for each item (for shipping grouping)
      for (const item of data.items as CartItem[]) {
        const variationId = item.variation 
          ? (typeof item.variation === 'object' ? item.variation.id : item.variation)
          : null
        
        if (variationId) {
          try {
            const variation = await req.payload.findByID({
              collection: 'variations',
              id: variationId,
              depth: 2,
            })
            const style = variation?.style
            if (style && typeof style === 'object') {
              const seller = style.seller
              item._sellerId = seller 
                ? (typeof seller === 'object' ? seller.id : seller)
                : 'unknown'
            }
          } catch {
            item._sellerId = 'unknown'
          }
        }
      }

      // Calculate buyer protection fees: 10% of item total (price × quantity)
      for (const item of data.items as CartItem[]) {
        if (item.buyerProtection) {
          const itemTotal = (item.price || 0) * (item.quantity || 1)
          item.buyerProtectionFee = Math.round(itemTotal * 0.10 * 100) / 100
        } else {
          item.buyerProtectionFee = 0
        }
      }

      // Group items by seller for shipping calculation
      const itemsBySeller = new Map<string, CartItem[]>()
      for (const item of data.items as CartItem[]) {
        const sellerId = item._sellerId || 'unknown'
        if (!itemsBySeller.has(sellerId)) {
          itemsBySeller.set(sellerId, [])
        }
        itemsBySeller.get(sellerId)!.push(item)
      }

      // Calculate totals
      data.itemCount = data.items.reduce(
        (total: number, item: CartItem) => total + (item.quantity || 0),
        0,
      )

      data.subtotal = Math.round(
        data.items.reduce((total: number, item: CartItem) => {
          return total + (item.quantity || 0) * (item.price || 0)
        }, 0) * 100,
      ) / 100

      // Calculate shipping (one per seller) and buyer protection
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

      const totalBeforeDiscount = data.subtotal + totalShipping + totalBuyerProtection

      data.grandTotal = Math.max(0, Math.round((totalBeforeDiscount - (data.discountAmount || 0) - (data.pointsDiscount || 0)) * 100) / 100)
    }

    // Auto-set currency
    if (data?.customer && !data?.currency) {
      const customerId = typeof data.customer === 'object' ? data.customer.id : data.customer
      try {
        const customer = await req.payload.findByID({
          collection: 'users',
          id: customerId,
          depth: 1,
        })
        if (customer?.country && typeof customer.country === 'object' && customer.country.currency) {
          data.currency = typeof customer.country.currency === 'object' ? customer.country.currency.id : customer.country.currency
        }
      } catch (e) {
        // Ignore errors
      }
    }

    return data
  }

  // For updates, only modify what's necessary
  if (!data?.items || !Array.isArray(data.items)) {
    return data
  }

  // Auto-populate price from SKU for all items
  for (const item of data.items as CartItem[]) {
    // Get variation ID
    const variationId = item.variation 
      ? (typeof item.variation === 'object' ? item.variation.id : item.variation)
      : null

    // If SKU is selected, use SKU price
    if (item.sku) {
      const skuId = typeof item.sku === 'object' ? item.sku.id : item.sku
      try {
        const sku = await req.payload.findByID({
          collection: 'skus',
          id: skuId,
          depth: 0,
        })
        if (sku?.sellingPrice) {
          item.price = sku.sellingPrice
        } else if (sku?.price) {
          item.price = Math.round(sku.price * 1.1 * 100) / 100 // Add 10% platform fee
        }
      } catch {
        // Ignore errors
      }
    } else if (variationId && !item.price) {
      // No SKU selected, try to get price from first available SKU of this variation
      try {
        const skus = await req.payload.find({
          collection: 'skus',
          where: {
            variation: { equals: variationId },
            isActive: { equals: true },
          },
          limit: 1,
          sort: 'price',
        })
        if (skus.docs.length > 0) {
          const sku = skus.docs[0]
          if (sku?.sellingPrice) {
            item.price = sku.sellingPrice
          } else if (sku?.price) {
            item.price = Math.round(sku.price * 1.1 * 100) / 100
          }
        }
      } catch {
        // Ignore errors
      }
    }
  }

  const originalItems = (originalDoc?.items || []) as OriginalCartItem[]

  // Fetch seller IDs for each item (for shipping grouping)
  for (const item of data.items as CartItem[]) {
    const variationId = item.variation 
      ? (typeof item.variation === 'object' ? item.variation.id : item.variation)
      : null
    
    if (variationId) {
      try {
        const variation = await req.payload.findByID({
          collection: 'variations',
          id: variationId,
          depth: 2,
        })
        const style = variation?.style
        if (style && typeof style === 'object') {
          const seller = style.seller
          item._sellerId = seller 
            ? (typeof seller === 'object' ? seller.id : seller)
            : 'unknown'
        }
      } catch {
        item._sellerId = 'unknown'
      }
    }
  }

  // Calculate buyer protection fees - only update if different
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i] as CartItem
    const originalItem = originalItems[i]

    // Buyer protection = 10% of item total (price × quantity)
    const itemTotal = (item.price || 0) * (item.quantity || 1)
    const expectedFee = item.buyerProtection
      ? Math.round(itemTotal * 0.10 * 100) / 100
      : 0

    const currentFee = originalItem?.buyerProtectionFee ?? 0

    if (Math.abs(expectedFee - currentFee) > 0.001) {
      item.buyerProtectionFee = expectedFee
    }
  }

  // Group items by seller for shipping calculation
  const itemsBySeller = new Map<string, CartItem[]>()
  for (const item of data.items as CartItem[]) {
    const sellerId = item._sellerId || 'unknown'
    if (!itemsBySeller.has(sellerId)) {
      itemsBySeller.set(sellerId, [])
    }
    itemsBySeller.get(sellerId)!.push(item)
  }

  // Calculate expected totals
  const expectedItemCount = data.items.reduce(
    (total: number, item: CartItem) => total + (item.quantity || 0),
    0,
  )

  const expectedSubtotal = Math.round(
    data.items.reduce((total: number, item: CartItem) => {
      return total + (item.quantity || 0) * (item.price || 0)
    }, 0) * 100,
  ) / 100

  // Calculate shipping (one per seller) and buyer protection
  let totalShipping = 0
  let totalBuyerProtection = 0
  for (const [, sellerItems] of itemsBySeller) {
    // One shipping fee per seller
    totalShipping += sellerItems[0]?.shippingFee || 0
    // Sum all buyer protection fees
    for (const item of sellerItems) {
      const fee = item.buyerProtectionFee ?? (originalItems[data.items.indexOf(item)]?.buyerProtectionFee || 0)
      totalBuyerProtection += fee
    }
  }

  const totalBeforeDiscount = expectedSubtotal + totalShipping + totalBuyerProtection

  const discountAmount = data.discountAmount ?? originalDoc?.discountAmount ?? 0
  const pointsDiscount = data.pointsDiscount ?? originalDoc?.pointsDiscount ?? 0
  const expectedGrandTotal = Math.max(0, Math.round((totalBeforeDiscount - discountAmount - pointsDiscount) * 100) / 100)

  // Only set values if they differ from original
  if (expectedItemCount !== originalDoc?.itemCount) {
    data.itemCount = expectedItemCount
  }

  if (Math.abs(expectedSubtotal - (originalDoc?.subtotal || 0)) > 0.001) {
    data.subtotal = expectedSubtotal
  }

  if (Math.abs(expectedGrandTotal - (originalDoc?.grandTotal || 0)) > 0.001) {
    data.grandTotal = expectedGrandTotal
  }

  // Auto-set currency only if not set
  if (data?.customer && !originalDoc?.currency && !data?.currency) {
    const customerId = typeof data.customer === 'object' ? data.customer.id : data.customer
    try {
      const customer = await req.payload.findByID({
        collection: 'users',
        id: customerId,
        depth: 1,
      })
      if (customer?.country && typeof customer.country === 'object' && customer.country.currency) {
        data.currency = typeof customer.country.currency === 'object' ? customer.country.currency.id : customer.country.currency
      }
    } catch (e) {
      // Ignore errors
    }
  }

  return data
}
