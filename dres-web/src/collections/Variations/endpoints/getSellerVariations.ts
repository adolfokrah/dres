import type { PayloadHandler } from 'payload'
import { transformVariation } from '../utils/transformVariation'

/**
 * GET /api/variations/seller/:sellerId
 * Fetch a seller's published variations (products for sale)
 */
export const getSellerVariations: PayloadHandler = async (req) => {
  const { payload, routeParams, user } = req
  const sellerId = routeParams?.sellerId as string

  if (!sellerId) {
    return Response.json({ error: 'Seller ID is required' }, { status: 400 })
  }

  // Get query params from URL
  const url = new URL(req.url || '', 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || '1')
  const limit = parseInt(url.searchParams.get('limit') || '20')

  try {
    // Get user's country for currency info
    let userCountry: { currencyCode: string; currencySymbol: string } | null = null
    if (user?.country) {
      const countryId = typeof user.country === 'string' ? user.country : user.country.id
      const country = await payload.findByID({
        collection: 'countries',
        id: countryId,
        depth: 1,
      })
      if (country?.currency && typeof country.currency === 'object') {
        userCountry = {
          currencyCode: country.currency.code || 'GHS',
          currencySymbol: country.currency.symbol || '₵',
        }
      }
    }
    // Default currency if not found
    if (!userCountry) {
      userCountry = { currencyCode: 'GHS', currencySymbol: '₵' }
    }

    // First, find all PUBLISHED styles belonging to this seller
    const stylesResult = await payload.find({
      collection: 'styles',
      where: {
        seller: { equals: sellerId },
        status: { equals: 'published' },
      },
      limit: 1000,
      depth: 0,
    })

    const styleIds = stylesResult.docs.map((style: any) => style.id)

    if (styleIds.length === 0) {
      return Response.json({
        docs: [],
        totalDocs: 0,
        totalPages: 1,
        page: 1,
        limit,
        hasNextPage: false,
        hasPrevPage: false,
      })
    }

    // Fetch active variations for these styles with depth for transformVariation
    const variationsResult = await payload.find({
      collection: 'variations',
      where: {
        and: [
          { style: { in: styleIds } },
          { status: { equals: 'active' } },
        ],
      },
      depth: 2,
      limit,
      page,
      sort: '-createdAt',
    })

    // Use shared transformVariation utility for consistent output
    const products = variationsResult.docs
      .map((variation: any) => transformVariation(variation, false))
      .filter((v: any) => v !== null)

    return Response.json({
      docs: products,
      totalDocs: variationsResult.totalDocs,
      totalPages: variationsResult.totalPages,
      page: variationsResult.page,
      limit: variationsResult.limit,
      hasNextPage: variationsResult.hasNextPage,
      hasPrevPage: variationsResult.hasPrevPage,
      currency: {
        code: userCountry.currencyCode,
        symbol: userCountry.currencySymbol,
      },
    })
  } catch (error) {
    payload.logger.error(`Error fetching seller variations: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch seller variations',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
