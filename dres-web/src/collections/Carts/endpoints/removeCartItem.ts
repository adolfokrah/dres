import type { PayloadHandler } from 'payload'

interface CartItem {
  variation: string | { id: string }
  sku?: string | { id: string } | null
  quantity: number
}

interface Cart {
  id: string
  customer: string | { id: string }
  status: 'active' | 'converted' | 'abandoned'
  items: CartItem[]
}

export const removeCartItem: PayloadHandler = async (req) => {
  const { payload, user } = req

  try {
    // Check if user is authenticated
    if (!user) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = req.json ? await req.json() : {}
    const { variationId, skuId } = body

    // Validate required fields
    if (!variationId || !skuId) {
      return Response.json(
        { error: 'Variation ID and SKU ID are required' },
        { status: 400 }
      )
    }

    // Find user's active cart
    const existingCarts = await payload.find({
      collection: 'carts',
      where: {
        customer: { equals: user.id },
        status: { equals: 'active' },
      },
      limit: 1,
      depth: 0,
    })

    const cart = existingCarts.docs[0] as Cart | undefined

    if (!cart) {
      return Response.json(
        { error: 'No active cart found' },
        { status: 404 }
      )
    }

    // Find the item in the cart
    const itemIndex = cart.items.findIndex((item) => {
      const itemVariationId = typeof item.variation === 'object' ? item.variation.id : item.variation
      const itemSkuId = item.sku ? (typeof item.sku === 'object' ? item.sku.id : item.sku) : null
      return itemVariationId === variationId && itemSkuId === skuId
    })

    if (itemIndex === -1) {
      return Response.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      )
    }

    // Remove the item from cart
    const updatedItems = cart.items.filter((_, index) => index !== itemIndex)

    const updatedCart = await payload.update({
      collection: 'carts',
      id: cart.id,
      data: {
        items: updatedItems,
      },
      depth: 2,
    })

    return Response.json({
      message: 'Item removed from cart',
      cart: updatedCart,
    })
  } catch (error) {
    console.error('Remove cart item error:', error)
    return Response.json(
      { error: 'Failed to remove cart item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
