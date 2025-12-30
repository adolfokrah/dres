import type { PayloadHandler } from 'payload'

interface CartItem {
  variation: string | { id: string; style?: { seller?: string | { id: string } } }
  sku?: string | { id: string } | null
  quantity: number
  shippingFee?: number
  buyerProtection?: boolean
  buyerProtectionFee?: number
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
    const removedItem = cart.items[itemIndex]
    const updatedItems = cart.items.filter((_, index) => index !== itemIndex)

    // If this was the last item, delete the cart instead of updating
    if (updatedItems.length === 0) {
      await payload.delete({
        collection: 'carts',
        id: cart.id,
      })

      return Response.json({
        message: 'Cart deleted - last item removed',
        cart: null,
      })
    }

    // Check if the removed item had a shipping fee - if so, we need to redistribute it
    const removedItemShippingFee = (removedItem as CartItem).shippingFee || 0
    
    if (removedItemShippingFee > 0) {
      // Find which seller this item belonged to
      const removedVariation = removedItem.variation
      let removedSellerId: string | undefined
      
      if (typeof removedVariation === 'object' && removedVariation.style) {
        const seller = removedVariation.style.seller
        removedSellerId = typeof seller === 'object' ? seller?.id : seller
      }

      if (removedSellerId) {
        // Find the first remaining item from the same seller and give it the shipping fee
        for (const item of updatedItems) {
          const variation = item.variation
          let itemSellerId: string | undefined
          
          if (typeof variation === 'object' && variation.style) {
            const seller = variation.style.seller
            itemSellerId = typeof seller === 'object' ? seller?.id : seller
          }

          if (itemSellerId === removedSellerId) {
            // Transfer the shipping fee to this item
            (item as CartItem).shippingFee = removedItemShippingFee
            // Recalculate buyer protection if enabled
            if ((item as CartItem).buyerProtection) {
              (item as CartItem).buyerProtectionFee = removedItemShippingFee * 0.8
            }
            break
          }
        }
      }
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
