import { PayloadHandler } from 'payload'

interface DiscountCode {
  id: string
  code: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  description?: string
  minOrderAmount?: number
  maxDiscountAmount?: number
  usageCount: number
  maxUses?: number
  maxUsesPerUser?: number
  startsAt?: string
  expiresAt?: string
  active: boolean
  usedBy?: Array<{
    user: string | { id: string }
    usedAt: string
    order?: string | { id: string }
  }>
}

interface CartItem {
  id?: string
  variation: string | { id: string }
  sku?: string | { id: string }
  price?: number
  quantity: number
  shippingFee: number
}

/**
 * POST /api/carts/apply-promo
 * Apply a promo code to the user's cart
 * 
 * Body: { code: string }
 */
export const applyPromoCode: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // Parse request body
    const body = await req.json?.() as { code?: string } | undefined

    if (!body?.code) {
      return Response.json(
        { error: 'Promo code is required' },
        { status: 400 }
      )
    }

    const code = body.code.toUpperCase().trim()

    // Find the discount code
    const discountCodes = await payload.find({
      collection: 'discount-codes',
      where: {
        code: { equals: code },
      },
      limit: 1,
      depth: 0,
    })

    if (discountCodes.docs.length === 0) {
      return Response.json(
        { error: 'Invalid promo code' },
        { status: 400 }
      )
    }

    const discountCode = discountCodes.docs[0] as unknown as DiscountCode

    // Validate the discount code
    const now = new Date()

    // Check if active
    if (!discountCode.active) {
      return Response.json(
        { error: 'This promo code is no longer active' },
        { status: 400 }
      )
    }

    // Check start date
    if (discountCode.startsAt && new Date(discountCode.startsAt) > now) {
      return Response.json(
        { error: 'This promo code is not yet active' },
        { status: 400 }
      )
    }

    // Check expiry
    if (discountCode.expiresAt && new Date(discountCode.expiresAt) < now) {
      return Response.json(
        { error: 'This promo code has expired' },
        { status: 400 }
      )
    }

    // Check max uses
    if (discountCode.maxUses && discountCode.usageCount >= discountCode.maxUses) {
      return Response.json(
        { error: 'This promo code has reached its maximum usage limit' },
        { status: 400 }
      )
    }

    // Check max uses per user
    if (discountCode.maxUsesPerUser && discountCode.usedBy) {
      const userUsageCount = discountCode.usedBy.filter((usage) => {
        const userId = typeof usage.user === 'object' ? usage.user.id : usage.user
        return userId === user.id
      }).length

      if (userUsageCount >= discountCode.maxUsesPerUser) {
        return Response.json(
          { error: `You have already used this promo code` },
          { status: 400 }
        )
      }
    }

    // Get user's active cart
    const carts = await payload.find({
      collection: 'carts',
      where: {
        customer: { equals: user.id },
        status: { equals: 'active' },
      },
      depth: 0,
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
      return Response.json(
        { error: 'Your cart is empty' },
        { status: 400 }
      )
    }

    // Calculate cart subtotal (items only, no shipping/fees)
    let subtotal = 0
    let totalShipping = 0

    for (const item of items) {
      const price = item.price || 0
      const quantity = item.quantity || 1
      subtotal += price * quantity
      totalShipping += item.shippingFee || 0
    }

    // Check minimum order amount
    if (discountCode.minOrderAmount && subtotal < discountCode.minOrderAmount) {
      return Response.json(
        { 
          error: `Minimum order of ${discountCode.minOrderAmount} required for this promo code`,
          minOrderAmount: discountCode.minOrderAmount,
          currentSubtotal: subtotal,
        },
        { status: 400 }
      )
    }

    // Calculate discount amount
    let discountAmount = 0

    switch (discountCode.type) {
      case 'percentage':
        discountAmount = (subtotal * discountCode.value) / 100
        // Apply max discount cap if set
        if (discountCode.maxDiscountAmount && discountAmount > discountCode.maxDiscountAmount) {
          discountAmount = discountCode.maxDiscountAmount
        }
        break

      case 'fixed':
        discountAmount = discountCode.value
        // Don't allow discount to exceed subtotal
        if (discountAmount > subtotal) {
          discountAmount = subtotal
        }
        break

      case 'free_shipping':
        discountAmount = totalShipping
        break
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100

    // Update the cart with the discount code
    await payload.update({
      collection: 'carts',
      id: cart.id,
      data: {
        discountCode: discountCode.id,
        discountAmount: discountAmount,
      },
      depth: 0,
    })

    // Fetch the updated cart with full depth
    const updatedCart = await payload.findByID({
      collection: 'carts',
      id: cart.id,
      depth: 5,
    })

    // Build response message
    let message = ''
    switch (discountCode.type) {
      case 'percentage':
        message = `${discountCode.value}% off applied!`
        break
      case 'fixed':
        message = `Discount of ${discountAmount} applied!`
        break
      case 'free_shipping':
        message = `Free shipping applied!`
        break
    }

    return Response.json({
      success: true,
      message,
      cart: updatedCart,
      discount: {
        code: discountCode.code,
        type: discountCode.type,
        value: discountCode.value,
        description: discountCode.description,
        discountAmount,
      },
    })
  } catch (error: unknown) {
    payload.logger.error(`Error applying promo code: ${error}`)
    return Response.json(
      {
        error: 'Failed to apply promo code',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/carts/remove-promo
 * Remove the applied promo code from the user's cart
 */
export const removePromoCode: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // Get user's active cart
    const carts = await payload.find({
      collection: 'carts',
      where: {
        customer: { equals: user.id },
        status: { equals: 'active' },
      },
      depth: 0,
    })

    if (carts.docs.length === 0) {
      return Response.json(
        { error: 'No active cart found' },
        { status: 404 }
      )
    }

    const cart = carts.docs[0]

    // Update the cart to remove discount code
    await payload.update({
      collection: 'carts',
      id: cart.id,
      data: {
        discountCode: null,
        discountAmount: 0,
      },
      depth: 0,
    })

    // Fetch the updated cart with full depth
    const updatedCart = await payload.findByID({
      collection: 'carts',
      id: cart.id,
      depth: 5,
    })

    return Response.json({
      success: true,
      message: 'Promo code removed',
      cart: updatedCart,
    })
  } catch (error: unknown) {
    payload.logger.error(`Error removing promo code: ${error}`)
    return Response.json(
      {
        error: 'Failed to remove promo code',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
