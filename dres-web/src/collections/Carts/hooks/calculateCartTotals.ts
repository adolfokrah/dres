import type { CollectionBeforeChangeHook } from 'payload'

interface CartItem {
  variation?: string | { id: string }
  sku?: string | { id: string }
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
            } else if (variationId) {
              // Fallback to variation price if SKU has no price
              const variation = await req.payload.findByID({
                collection: 'variations',
                id: variationId,
                depth: 0,
              })
              item.price = variation?.sellingPrice || (variation?.price ? Math.round(variation.price * 1.1 * 100) / 100 : 0)
            }
          } catch {
            // Ignore errors
          }
        } else if (variationId && !item.price) {
          // No SKU, use variation price
          try {
            const variation = await req.payload.findByID({
              collection: 'variations',
              id: variationId,
              depth: 0,
            })
            item.price = variation?.sellingPrice || (variation?.price ? Math.round(variation.price * 1.1 * 100) / 100 : 0)
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

  // Auto-populate price from SKU or variation for all items
  for (const item of data.items as CartItem[]) {
    // Get variation ID
    const variationId = item.variation 
      ? (typeof item.variation === 'object' ? item.variation.id : item.variation)
      : null

    // If SKU is selected, always use SKU price (or variation fallback)
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
        } else if (variationId) {
          // Fallback to variation price if SKU has no price
          const variation = await req.payload.findByID({
            collection: 'variations',
            id: variationId,
            depth: 0,
          })
          item.price = variation?.sellingPrice || (variation?.price ? Math.round(variation.price * 1.1 * 100) / 100 : 0)
        }
      } catch {
        // Ignore errors
      }
    } else if (variationId && !item.price) {
      // No SKU, use variation price
      try {
        const variation = await req.payload.findByID({
          collection: 'variations',
          id: variationId,
          depth: 0,
        })
        item.price = variation?.sellingPrice || (variation?.price ? Math.round(variation.price * 1.1 * 100) / 100 : 0)
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
