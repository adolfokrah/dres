import type { PayloadHandler } from 'payload'
import { getUserCountryInfo } from '../../../utilities/countryUtils'
import { enrichCartItems } from './enrichCartItems'

interface CartItem {
  variation?: {
    id: string
    title?: string
    status?: string
    images?: Array<{ image?: { url?: string } }>
    brand?: string | { name?: string }
    style?: {
      id: string
      seller?: string | { id: string }
    }
  } | string
  sku?: {
    id: string
    stock?: number | null
    isActive?: boolean
    status?: string
    price?: number
    discountedPrice?: number
    options?: Array<{ option?: string; value?: string }>
  } | string
  quantity?: number
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
      depth: 5, // Deep populate to get seller info
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

    // Get user's country for comparison
    const userCountry = await getUserCountryInfo(req)

    // Enrich items with availability flags and seller info using shared utility
    const { enrichedItems, validation } = await enrichCartItems({
      payload,
      items: items || [],
      userCountryId: userCountry.countryId,
    })

    // Return cart with enriched items and validation
    const enrichedCart = {
      ...cart,
      items: enrichedItems,
    }

    return Response.json({
      cart: enrichedCart,
      message: 'Cart retrieved successfully',
      validation,
    })
  } catch (error) {
    console.error('Get cart error:', error)
    return Response.json(
      { error: 'Failed to get cart', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
