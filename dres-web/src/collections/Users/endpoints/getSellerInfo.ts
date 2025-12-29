import type { PayloadHandler } from 'payload'
import { getSellerData } from '../../../collections/Variations/utils/getSellerData'

/**
 * GET /api/users/:id/seller
 * Fetch seller information for a user
 */
export const getSellerInfo: PayloadHandler = async (req) => {
  const { payload } = req
  const { id } = req.routeParams || {}

  if (!id) {
    return Response.json(
      { error: 'User ID is required' },
      { status: 400 }
    )
  }

  try {
    const sellerData = await getSellerData(payload, id as string)

    if (!sellerData) {
      return Response.json(
        { error: 'Seller not found' },
        { status: 404 }
      )
    }

    return Response.json(sellerData)
  } catch (error: any) {
    payload.logger.error(`Error fetching seller info: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch seller information',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
