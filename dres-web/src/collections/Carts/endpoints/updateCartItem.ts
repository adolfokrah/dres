import type { PayloadHandler } from 'payload'

interface CartItem {
  variation: string | { id: string }
  sku?: string | { id: string } | null
  quantity: number
  buyerProtection?: boolean
  addedAt?: string
}

interface Cart {
  id: string
  customer: string | { id: string }
  status: 'active' | 'converted' | 'abandoned'
  items: CartItem[]
}

interface SKU {
  id: string
  stock?: number | null
  isActive?: boolean
}

export const updateCartItem: PayloadHandler = async (req) => {
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
    const { variationId, skuId, quantity } = body

    // Validate required fields
    if (!variationId || !skuId) {
      return Response.json(
        { error: 'Variation ID and SKU ID are required' },
        { status: 400 }
      )
    }

    if (quantity === undefined || quantity < 1) {
      return Response.json(
        { error: 'Quantity must be at least 1' },
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

    // Check stock availability for the new quantity
    const sku = await payload.findByID({
      collection: 'skus',
      id: skuId,
      depth: 0,
    }) as SKU | null

    if (!sku) {
      return Response.json(
        { error: 'SKU not found' },
        { status: 404 }
      )
    }

    if (sku.isActive === false) {
      return Response.json(
        { error: 'This product variant is no longer available' },
        { status: 400 }
      )
    }

    if (sku.stock !== null && sku.stock !== undefined) {
      if (sku.stock <= 0) {
        return Response.json(
          { error: 'This product is out of stock' },
          { status: 400 }
        )
      }
      if (quantity > sku.stock) {
        return Response.json(
          { error: `Only ${sku.stock} items available in stock` },
          { status: 400 }
        )
      }
    }

    // Update the item quantity
    const updatedItems = [...cart.items]
    updatedItems[itemIndex] = {
      ...cart.items[itemIndex],
      quantity,
    }

    await payload.update({
      collection: 'carts',
      id: cart.id,
      data: {
        items: updatedItems,
      },
      depth: 0,
    })

    // Fetch with full depth for populated data
    const updatedCart = await payload.findByID({
      collection: 'carts',
      id: cart.id,
      depth: 5,
    })

    return Response.json({
      message: 'Cart item updated',
      cart: updatedCart,
    })
  } catch (error) {
    console.error('Update cart item error:', error)
    return Response.json(
      { error: 'Failed to update cart item', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
