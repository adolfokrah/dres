import { PayloadHandler } from 'payload'

interface ShippingRate {
  id: string
  user: string | { id: string }
  cities: Array<string | { id: string }>
  deliveryCost: number
  freeShippingThreshold?: number | null
  estimatedDays?: {
    min?: number | null
    max?: number | null
  }
  isActive: boolean
}

interface CartItem {
  id?: string
  variation: string | {
    id: string
    style?: {
      seller?: string | { id: string }
    }
  }
  sku?: string | { id: string }
  price?: number
  quantity: number
  shippingFee: number
  buyerProtection: boolean
  buyerProtectionFee: number
}

/**
 * POST /api/carts/update-shipping
 * Update shipping fees for all cart items based on selected city
 * 
 * Body: { cityId: string }
 */
export const updateShipping: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // Parse request body
    const body = await req.json?.() as { cityId?: string } | undefined

    if (!body?.cityId) {
      return Response.json(
        { error: 'City ID is required' },
        { status: 400 }
      )
    }

    const { cityId } = body

    // Get user's active cart
    const carts = await payload.find({
      collection: 'carts',
      where: {
        customer: { equals: user.id },
        status: { equals: 'active' },
      },
      depth: 2, // Get variation -> style -> seller
    })

    if (carts.docs.length === 0) {
      return Response.json(
        { error: 'No active cart found' },
        { status: 404 }
      )
    }

    const cart = carts.docs[0]
    const items = (cart.items || []) as CartItem[]

    if (items.length === 0) {
      return Response.json({
        success: true,
        message: 'Cart is empty',
        cart,
      })
    }

    // Get unique seller IDs from cart items
    const sellerIds = new Set<string>()
    for (const item of items) {
      const variation = item.variation
      if (typeof variation === 'object' && variation.style) {
        const seller = variation.style.seller
        const sellerId = typeof seller === 'object' ? seller?.id : seller
        if (sellerId) {
          sellerIds.add(sellerId)
        }
      }
    }

    // Fetch shipping rates for all sellers for the selected city
    const shippingRatesResult = await payload.find({
      collection: 'shippingRates',
      where: {
        and: [
          {
            user: { in: Array.from(sellerIds) },
          },
          {
            cities: { contains: cityId },
          },
          {
            isActive: { equals: true },
          },
        ],
      },
      depth: 0,
      limit: 100,
    })

    // Create a map of seller ID -> shipping rate
    const sellerShippingRates = new Map<string, ShippingRate>()
    for (const rate of shippingRatesResult.docs as ShippingRate[]) {
      const sellerId = typeof rate.user === 'object' ? rate.user.id : rate.user
      sellerShippingRates.set(sellerId, rate)
    }

    // Calculate total item value per seller (for free shipping threshold)
    const sellerTotals = new Map<string, number>()
    for (const item of items) {
      const variation = item.variation
      if (typeof variation === 'object' && variation.style) {
        const seller = variation.style.seller
        const sellerId = typeof seller === 'object' ? seller?.id : seller
        if (sellerId) {
          const itemTotal = (item.price || 0) * item.quantity
          sellerTotals.set(sellerId, (sellerTotals.get(sellerId) || 0) + itemTotal)
        }
      }
    }

    // Calculate shipping fee per seller (not per item)
    // Shipping is charged once per seller, applied to the first item of each seller
    const sellerShippingFees = new Map<string, number>()
    for (const sellerId of sellerIds) {
      const rate = sellerShippingRates.get(sellerId)
      
      if (rate) {
        // Check if order total for this seller meets free shipping threshold
        const sellerTotal = sellerTotals.get(sellerId) || 0
        const threshold = rate.freeShippingThreshold

        if (threshold && threshold > 0 && sellerTotal >= threshold) {
          // Free shipping!
          sellerShippingFees.set(sellerId, 0)
        } else {
          // Apply delivery cost once for this seller
          sellerShippingFees.set(sellerId, rate.deliveryCost || 0)
        }
      } else {
        // No rate found - seller doesn't deliver to this city
        sellerShippingFees.set(sellerId, 0)
      }
    }

    // Track which sellers have had shipping applied (to apply only to first item)
    const sellersWithShippingApplied = new Set<string>()

    // Update items - shipping fee only on first item per seller
    const updatedItems = items.map((item) => {
      const variation = item.variation
      let sellerId: string | undefined

      if (typeof variation === 'object' && variation.style) {
        const seller = variation.style.seller
        sellerId = typeof seller === 'object' ? seller?.id : seller
      }

      let shippingFee = 0

      // Apply shipping fee only to the first item of each seller
      if (sellerId && !sellersWithShippingApplied.has(sellerId)) {
        shippingFee = sellerShippingFees.get(sellerId) || 0
        sellersWithShippingApplied.add(sellerId)
      }

      // Calculate buyer protection fee (80% of shipping fee if enabled)
      const buyerProtectionFee = item.buyerProtection ? shippingFee * 0.8 : 0

      return {
        ...item,
        // Store only the ID for relationships
        variation: typeof item.variation === 'object' ? item.variation.id : item.variation,
        sku: item.sku ? (typeof item.sku === 'object' ? item.sku.id : item.sku) : undefined,
        shippingFee,
        buyerProtectionFee,
      }
    })

    // Update the cart (without depth - just save the data)
    await payload.update({
      collection: 'carts',
      id: cart.id,
      data: {
        items: updatedItems,
      },
      depth: 0,
    })

    // Fetch the updated cart with full depth to get populated relationships
    const updatedCart = await payload.findByID({
      collection: 'carts',
      id: cart.id,
      depth: 5, // Match getCart depth for full population
    })

    // Calculate summary
    const totalShipping = updatedItems.reduce((sum, item) => sum + item.shippingFee, 0)
    const totalBuyerProtection = updatedItems.reduce((sum, item) => sum + item.buyerProtectionFee, 0)
    const sellersWithRates = sellerShippingRates.size
    const sellersWithoutRates = sellerIds.size - sellersWithRates

    // Build validation (reusing items data - validation based on original fetch)
    const validationIssues: string[] = []
    let hasUnavailableItems = false
    let hasExceedsStock = false

    for (const item of items) {
      const variation = item.variation
      if (typeof variation === 'object' && variation.style) {
        const seller = variation.style.seller
        if (typeof seller === 'object') {
          const sellerData = seller as unknown as Record<string, unknown>
          if (sellerData.vacationMode === true) {
            hasUnavailableItems = true
          }
          // Check seller country vs user country
          const sellerCountry = sellerData.country
          const sellerCountryId = typeof sellerCountry === 'object' && sellerCountry !== null 
            ? (sellerCountry as { id: string }).id 
            : sellerCountry as string | undefined
          const userCountry = user.country
          const userCountryId = typeof userCountry === 'object' && userCountry !== null 
            ? (userCountry as { id: string }).id 
            : userCountry as string | undefined
          if (userCountryId && sellerCountryId && sellerCountryId !== userCountryId) {
            hasUnavailableItems = true
          }
        }
      }
    }

    if (hasUnavailableItems) {
      validationIssues.push('Some items are unavailable. Please update your cart to continue.')
    }
    if (hasExceedsStock) {
      validationIssues.push('Some items exceed available stock. Please update quantities in your cart.')
    }

    const isValid = !hasUnavailableItems && !hasExceedsStock

    return Response.json({
      success: true,
      message: `Shipping updated for ${items.length} items`,
      cart: updatedCart,
      shippingSummary: {
        cityId,
        totalShipping,
        totalBuyerProtection,
        sellersWithRates,
        sellersWithoutRates,
        // Include estimated delivery info from first rate (could improve this)
        estimatedDays: shippingRatesResult.docs[0]?.estimatedDays || null,
      },
      validation: {
        valid: isValid,
        reasons: validationIssues,
      },
    })
  } catch (error: unknown) {
    payload.logger.error(`Error updating shipping: ${error}`)
    return Response.json(
      {
        error: 'Failed to update shipping',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
