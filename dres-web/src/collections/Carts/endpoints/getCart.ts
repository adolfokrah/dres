import type { PayloadHandler } from 'payload'

interface CartItem {
  variation?: {
    id: string
    style?: {
      id: string
      seller?: string | { id: string; vacationMode?: boolean }
    }
  } | string
  sku?: {
    id: string
    stock?: number | null
    isActive?: boolean
  } | string
  quantity?: number
}

interface EnrichedCartItem extends Record<string, unknown> {
  isSellerOnVacation: boolean
  isOutOfStock: boolean
  stockQuantity: number | null
  availableStock: number | null
}

export const getCart: PayloadHandler = async (req) => {
  const { payload, user } = req

  try {
    // Check if user is authenticated
    if (!user) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Find user's active cart with deeply populated items
    const carts = await payload.find({
      collection: 'carts',
      where: {
        customer: { equals: user.id },
        status: { equals: 'active' },
      },
      limit: 1,
      depth: 4, // Deep populate to get seller info
    })

    if (carts.docs.length === 0) {
      // No active cart - return empty cart structure
      return Response.json({
        cart: null,
        message: 'No active cart',
      })
    }

    const cart = carts.docs[0]
    const items = cart.items as CartItem[] | undefined

    // Enrich items with availability flags
    const enrichedItems: EnrichedCartItem[] = []
    const sellerCache: Map<string, boolean> = new Map() // Cache seller vacation status

    if (items && Array.isArray(items)) {
      for (const item of items) {
        const enrichedItem: EnrichedCartItem = {
          ...item,
          isSellerOnVacation: false,
          isOutOfStock: false,
          stockQuantity: null,
          availableStock: null,
        }

        // Check seller vacation status
        if (item.variation && typeof item.variation === 'object') {
          const style = item.variation.style
          if (style && typeof style === 'object') {
            const seller = style.seller
            let sellerId: string | null = null
            
            if (typeof seller === 'string') {
              sellerId = seller
            } else if (seller && typeof seller === 'object') {
              sellerId = seller.id
              // If seller is populated, check vacation mode directly
              if (seller.vacationMode === true) {
                enrichedItem.isSellerOnVacation = true
              }
            }

            // If seller wasn't fully populated, fetch from cache or DB
            if (sellerId && !enrichedItem.isSellerOnVacation) {
              if (sellerCache.has(sellerId)) {
                enrichedItem.isSellerOnVacation = sellerCache.get(sellerId) || false
              } else {
                try {
                  const sellerDoc = await payload.findByID({
                    collection: 'users',
                    id: sellerId,
                    depth: 0,
                  })
                  const isOnVacation = sellerDoc?.vacationMode === true
                  sellerCache.set(sellerId, isOnVacation)
                  enrichedItem.isSellerOnVacation = isOnVacation
                } catch {
                  // Seller not found, leave as false
                }
              }
            }
          }
        }

        // Check SKU stock status
        if (item.sku && typeof item.sku === 'object') {
          const stock = item.sku.stock
          const isActive = item.sku.isActive
          const quantity = item.quantity || 1

          enrichedItem.stockQuantity = stock ?? null
          
          // Check if out of stock
          if (isActive === false) {
            enrichedItem.isOutOfStock = true
            enrichedItem.availableStock = 0
          } else if (stock !== null && stock !== undefined) {
            enrichedItem.availableStock = stock
            if (stock <= 0) {
              enrichedItem.isOutOfStock = true
            } else if (stock < quantity) {
              // Not completely out of stock, but not enough for requested quantity
              enrichedItem.availableStock = stock
            }
          }
        } else if (item.sku && typeof item.sku === 'string') {
          // SKU wasn't populated, fetch it
          try {
            const skuDoc = await payload.findByID({
              collection: 'skus',
              id: item.sku,
              depth: 0,
            })
            if (skuDoc) {
              const stock = skuDoc.stock as number | null | undefined
              const isActive = skuDoc.isActive as boolean | undefined
              const quantity = item.quantity || 1

              enrichedItem.stockQuantity = stock ?? null

              if (isActive === false) {
                enrichedItem.isOutOfStock = true
                enrichedItem.availableStock = 0
              } else if (stock !== null && stock !== undefined) {
                enrichedItem.availableStock = stock
                if (stock <= 0) {
                  enrichedItem.isOutOfStock = true
                } else if (stock < quantity) {
                  enrichedItem.availableStock = stock
                }
              }
            }
          } catch {
            // SKU not found
          }
        }

        enrichedItems.push(enrichedItem)
      }
    }

    // Return cart with enriched items
    const enrichedCart = {
      ...cart,
      items: enrichedItems,
    }

    return Response.json({
      cart: enrichedCart,
      message: 'Cart retrieved successfully',
    })
  } catch (error) {
    console.error('Get cart error:', error)
    return Response.json(
      { error: 'Failed to get cart', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
