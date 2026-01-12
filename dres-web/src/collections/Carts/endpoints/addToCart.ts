import type { PayloadHandler } from 'payload'
import type { Cart, Skus } from '../../../payload-types'

type CartItem = Cart['items'][number]

type StockValidationResult =
  | { valid: true }
  | { valid: false; error: string; inCart?: number }

/**
 * Validates stock availability for a given quantity
 */
const validateStock = (
  sku: Skus,
  requestedQuantity: number,
  existingQuantityInCart: number = 0,
): StockValidationResult => {
  const stock = sku.stock
  if (stock === null || stock === undefined) {
    return { valid: true } // Unlimited stock
  }

  const totalQuantity = existingQuantityInCart + requestedQuantity

  if (stock <= 0) {
    return { valid: false, error: 'This product is out of stock' }
  }

  if (totalQuantity > stock) {
    if (existingQuantityInCart > 0) {
      return {
        valid: false,
        error: `Cannot add more items. Only ${stock} available (${existingQuantityInCart} in cart)`,
        inCart: existingQuantityInCart,
      }
    }
    return { valid: false, error: `Only ${stock} items available in stock` }
  }

  return { valid: true }
}

/**
 * Extracts ID from a string or object with id property
 */
const extractId = (value: string | { id: string } | null | undefined): string | null => {
  if (!value) return null
  return typeof value === 'object' ? value.id : value
}

/**
 * Creates a new cart item object
 */
const createCartItem = (
  variationId: string,
  skuId: string,
  quantity: number,
  buyerProtection: boolean,
): CartItem => ({
  variation: variationId,
  sku: skuId,
  quantity,
  buyerProtection,
  addedAt: new Date().toISOString(),
})

export const addToCart: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  const body = req.json ? await req.json() : {}
  const { variationId, skuId, quantity = 1, buyerProtection = false } = body

  // Validate required fields
  if (!variationId || !skuId) {
    return Response.json(
      { error: 'Variation ID and SKU ID are required' },
      { status: 400 },
    )
  }

  if (quantity < 1 || !Number.isInteger(quantity)) {
    return Response.json(
      { error: 'Quantity must be a positive integer' },
      { status: 400 },
    )
  }

  try {
    // Fetch SKU and cart in parallel (independent queries)
    const [sku, existingCarts] = await Promise.all([
      payload.findByID({
        collection: 'skus',
        id: skuId,
        depth: 0,
        req,
      }) as Promise<Skus | null>,
      payload.find({
        collection: 'carts',
        where: {
          customer: { equals: user.id },
          status: { equals: 'active' },
        },
        limit: 1,
        depth: 0,
        req,
      }),
    ])

    // Validate SKU exists
    if (!sku) {
      return Response.json({ error: 'SKU not found' }, { status: 404 })
    }

    // Validate SKU is active
    if (sku.isActive === false) {
      return Response.json(
        { error: 'This product variant is no longer available' },
        { status: 400 },
      )
    }

    // Verify SKU belongs to variation
    if (extractId(sku.variation) !== variationId) {
      return Response.json(
        { error: 'SKU does not belong to this variation' },
        { status: 400 },
      )
    }

    const cart = existingCarts.docs[0] as Cart | undefined
    let cartId: string
    let finalQuantity: number
    let action: 'created' | 'added' | 'updated'

    if (cart) {
      // Find existing item in cart
      const existingItemIndex = cart.items.findIndex(
        (item) => extractId(item.variation) === variationId && extractId(item.sku) === skuId,
      )

      const existingQuantity = existingItemIndex !== -1 ? cart.items[existingItemIndex].quantity : 0

      // Validate stock
      const stockCheck = validateStock(sku, quantity, existingQuantity)
      if (!stockCheck.valid) {
        return Response.json({ error: stockCheck.error }, { status: 400 })
      }

      if (existingItemIndex !== -1) {
        // Update existing item
        finalQuantity = existingQuantity + quantity
        const updatedItems = [...cart.items]
        updatedItems[existingItemIndex] = {
          ...cart.items[existingItemIndex],
          quantity: finalQuantity,
          buyerProtection: buyerProtection || cart.items[existingItemIndex].buyerProtection,
        }

        await payload.update({
          collection: 'carts',
          id: cart.id,
          data: { items: updatedItems },
          depth: 0,
          req,
        })

        cartId = cart.id
        action = 'updated'
      } else {
        // Add new item to existing cart
        finalQuantity = quantity
        await payload.update({
          collection: 'carts',
          id: cart.id,
          data: {
            items: [...cart.items, createCartItem(variationId, skuId, quantity, buyerProtection)],
          },
          depth: 0,
          req,
        })

        cartId = cart.id
        action = 'added'
      }
    } else {
      // Validate stock for new cart
      const stockCheck = validateStock(sku, quantity)
      if (!stockCheck.valid) {
        return Response.json({ error: stockCheck.error }, { status: 400 })
      }

      // Create new cart
      const createdCart = await payload.create({
        collection: 'carts',
        data: {
          customer: user.id,
          status: 'active',
          items: [createCartItem(variationId, skuId, quantity, buyerProtection)],
        },
        depth: 0,
        req,
      })

      cartId = createdCart.id
      finalQuantity = quantity
      action = 'created'
    }

    const messages: Record<typeof action, string> = {
      created: 'Cart created and item added',
      added: 'Item added to cart',
      updated: 'Cart updated successfully',
    }

    return Response.json({
      success: true,
      message: messages[action],
      cartId,
      action,
      item: {
        variationId,
        skuId,
        quantity: finalQuantity,
        buyerProtection,
      },
    })
  } catch (error) {
    console.error('Add to cart error:', error)
    return Response.json(
      { error: 'Failed to add item to cart', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
