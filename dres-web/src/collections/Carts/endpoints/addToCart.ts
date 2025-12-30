import type { PayloadHandler } from 'payload'

interface SKU {
  id: string
  stock?: number | null
  isActive?: boolean
  price?: number
  variation?: string | { id: string }
}

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

export const addToCart: PayloadHandler = async (req) => {
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
    const { variationId, skuId, quantity = 1, buyerProtection = false } = body

    // Validate required fields
    if (!variationId) {
      return Response.json(
        { error: 'Variation ID is required' },
        { status: 400 }
      )
    }

    if (!skuId) {
      return Response.json(
        { error: 'SKU ID is required' },
        { status: 400 }
      )
    }

    if (quantity < 1) {
      return Response.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      )
    }

    // Fetch the SKU to validate stock
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

    // Check if SKU is active
    if (sku.isActive === false) {
      return Response.json(
        { error: 'This product variant is no longer available' },
        { status: 400 }
      )
    }

    // Check stock availability
    if (sku.stock !== null && sku.stock !== undefined && sku.stock <= 0) {
      return Response.json(
        { error: 'This product is out of stock' },
        { status: 400 }
      )
    }

    // Check if requested quantity is available
    if (sku.stock !== null && sku.stock !== undefined && quantity > sku.stock) {
      return Response.json(
        { error: `Only ${sku.stock} items available in stock` },
        { status: 400 }
      )
    }

    // Verify the SKU belongs to the variation
    const skuVariationId = typeof sku.variation === 'object' ? sku.variation?.id : sku.variation
    if (skuVariationId !== variationId) {
      return Response.json(
        { error: 'SKU does not belong to this variation' },
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

    const cart: Cart | null = existingCarts.docs[0] as Cart | null

    if (cart) {
      // User has an active cart - check if item already exists
      const existingItemIndex = cart.items.findIndex((item) => {
        const itemVariationId = typeof item.variation === 'object' ? item.variation.id : item.variation
        const itemSkuId = item.sku ? (typeof item.sku === 'object' ? item.sku.id : item.sku) : null
        return itemVariationId === variationId && itemSkuId === skuId
      })

      if (existingItemIndex !== -1) {
        // Item exists - update quantity
        const existingItem = cart.items[existingItemIndex]
        const newQuantity = existingItem.quantity + quantity

        // Check if new quantity exceeds stock
        if (sku.stock !== null && sku.stock !== undefined && newQuantity > sku.stock) {
          return Response.json(
            { error: `Cannot add more items. Only ${sku.stock} available in stock (you have ${existingItem.quantity} in cart)` },
            { status: 400 }
          )
        }

        // Update the item quantity and buyer protection
        const updatedItems = [...cart.items]
        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
          buyerProtection: buyerProtection || existingItem.buyerProtection,
        }

        const updatedCart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            items: updatedItems,
          },
          depth: 2,
        })

        return Response.json({
          message: 'Cart updated successfully',
          cart: updatedCart,
          action: 'updated',
        })
      } else {
        // Item doesn't exist - add new item
        const newItem: CartItem = {
          variation: variationId,
          sku: skuId,
          quantity,
          buyerProtection,
          addedAt: new Date().toISOString(),
        }

        const updatedCart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            items: [...cart.items, newItem],
          },
          depth: 2,
        })

        return Response.json({
          message: 'Item added to cart',
          cart: updatedCart,
          action: 'added',
        })
      }
    } else {
      // No active cart - create a new one
      const newCart = await payload.create({
        collection: 'carts',
        data: {
          customer: user.id,
          status: 'active',
          items: [
            {
              variation: variationId,
              sku: skuId,
              quantity,
              buyerProtection,
              addedAt: new Date().toISOString(),
            },
          ],
        },
        depth: 2,
      })

      return Response.json({
        message: 'Cart created and item added',
        cart: newCart,
        action: 'created',
      })
    }
  } catch (error) {
    console.error('Add to cart error:', error)
    return Response.json(
      { error: 'Failed to add item to cart', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
