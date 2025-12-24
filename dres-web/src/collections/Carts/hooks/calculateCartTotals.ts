import type { CollectionBeforeChangeHook } from 'payload'

interface CartItem {
  product?: string | { id: string }
  variation?: string | { id: string }
  buyerProtection?: boolean
  shippingFee?: number
  buyerProtectionFee?: number
  quantity?: number
  price?: number
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
      // Auto-populate price from variation or product
      for (const item of data.items as CartItem[]) {
        // Get product ID
        const productId = item.product 
          ? (typeof item.product === 'object' ? item.product.id : item.product)
          : null

        // If variation is selected, use variation price
        if (item.variation) {
          const variationId = typeof item.variation === 'object' ? item.variation.id : item.variation
          try {
            const variation = await req.payload.findByID({
              collection: 'product-variations',
              id: variationId,
              depth: 0,
            })
            if (variation?.sellingPrice) {
              item.price = variation.sellingPrice
            } else if (variation?.price) {
              item.price = Math.round(variation.price * 1.1 * 100) / 100 // Add 10% platform fee
            } else if (productId) {
              // Fallback to product price if variation has no price
              const product = await req.payload.findByID({
                collection: 'products',
                id: productId,
                depth: 0,
              })
              item.price = product?.sellingPrice || (product?.price ? Math.round(product.price * 1.1 * 100) / 100 : 0)
            }
          } catch {
            // Ignore errors
          }
        } else if (productId && !item.price) {
          // No variation, use product price
          try {
            const product = await req.payload.findByID({
              collection: 'products',
              id: productId,
              depth: 0,
            })
            item.price = product?.sellingPrice || (product?.price ? Math.round(product.price * 1.1 * 100) / 100 : 0)
          } catch {
            // Ignore errors
          }
        }
      }

      // Calculate buyer protection fees
      for (const item of data.items as CartItem[]) {
        if (item.buyerProtection && item.shippingFee) {
          item.buyerProtectionFee = Math.round(item.shippingFee * 0.8 * 100) / 100
        } else {
          item.buyerProtectionFee = 0
        }
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

      const totalBeforeDiscount = data.items.reduce((total: number, item: CartItem) => {
        return total + (item.quantity || 0) * (item.price || 0) + (item.shippingFee || 0) + (item.buyerProtectionFee || 0)
      }, 0)

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

  // Auto-populate price from variation or product for all items
  for (const item of data.items as CartItem[]) {
    // Get product ID
    const productId = item.product 
      ? (typeof item.product === 'object' ? item.product.id : item.product)
      : null

    // If variation is selected, always use variation price (or product fallback)
    if (item.variation) {
      const variationId = typeof item.variation === 'object' ? item.variation.id : item.variation
      try {
        const variation = await req.payload.findByID({
          collection: 'product-variations',
          id: variationId,
          depth: 0,
        })
        if (variation?.sellingPrice) {
          item.price = variation.sellingPrice
        } else if (variation?.price) {
          item.price = Math.round(variation.price * 1.1 * 100) / 100 // Add 10% platform fee
        } else if (productId) {
          // Fallback to product price if variation has no price
          const product = await req.payload.findByID({
            collection: 'products',
            id: productId,
            depth: 0,
          })
          item.price = product?.sellingPrice || (product?.price ? Math.round(product.price * 1.1 * 100) / 100 : 0)
        }
      } catch {
        // Ignore errors
      }
    } else if (productId && !item.price) {
      // No variation, use product price
      try {
        const product = await req.payload.findByID({
          collection: 'products',
          id: productId,
          depth: 0,
        })
        item.price = product?.sellingPrice || (product?.price ? Math.round(product.price * 1.1 * 100) / 100 : 0)
      } catch {
        // Ignore errors
      }
    }
  }

  const originalItems = (originalDoc?.items || []) as OriginalCartItem[]

  // Calculate buyer protection fees - only update if different
  for (let i = 0; i < data.items.length; i++) {
    const item = data.items[i] as CartItem
    const originalItem = originalItems[i]

    const expectedFee = item.buyerProtection && item.shippingFee
      ? Math.round(item.shippingFee * 0.8 * 100) / 100
      : 0

    const currentFee = originalItem?.buyerProtectionFee ?? 0

    if (Math.abs(expectedFee - currentFee) > 0.001) {
      item.buyerProtectionFee = expectedFee
    }
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

  const totalBeforeDiscount = data.items.reduce((total: number, item: CartItem) => {
    const buyerProtectionFee = item.buyerProtectionFee ?? (originalItems[data.items.indexOf(item)]?.buyerProtectionFee || 0)
    return total + (item.quantity || 0) * (item.price || 0) + (item.shippingFee || 0) + buyerProtectionFee
  }, 0)

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
