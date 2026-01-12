import type { PayloadHandler } from 'payload'

/**
 * GET /api/boost-tiers/active
 * Fetch all active boost tiers sorted by sortOrder
 * Prices are stored in GHS and converted to the logged-in user's currency
 */
export const getActiveBoostTiers: PayloadHandler = async (req) => {
  const { payload, user } = req

  try {
    // Get user's currency for conversion
    let currencySymbol = '₵'
    let currencyCode = 'GHS'
    let exchangeRateToGHS = 1 // Default to GHS (no conversion needed)

    if (user?.country) {
      // Fetch user with populated country and currency
      const fullUser = await payload.findByID({
        collection: 'users',
        id: user.id,
        depth: 2, // Populate country -> currency
      })

      const userCountry = fullUser?.country
      if (userCountry && typeof userCountry === 'object') {
        const currency = userCountry.currency
        if (currency && typeof currency === 'object') {
          currencySymbol = currency.symbol || '₵'
          currencyCode = currency.code || 'GHS'
          exchangeRateToGHS = currency.exchangeRateToGHS || 1
        }
      }
    }

    // Helper to convert GHS amount to user's currency
    // exchangeRateToGHS = how many GHS per 1 unit of user's currency
    // e.g., if 1 USD = 15 GHS, then exchangeRateToGHS = 15
    // To convert 100 GHS to USD: 100 / 15 = 6.67 USD
    const convertGHSToUserCurrency = (amountInGHS: number): number => {
      if (exchangeRateToGHS === 1) return amountInGHS
      return amountInGHS / exchangeRateToGHS
    }

    const tiers = await payload.find({
      collection: 'boost-tiers',
      where: {
        isActive: { equals: true },
      },
      sort: 'sortOrder',
      limit: 100,
    })

    // Transform to cleaner format with converted prices
    const transformedTiers = tiers.docs.map((tier) => ({
      id: tier.id,
      name: tier.name,
      slug: tier.slug,
      duration: tier.duration,
      price: Math.round(convertGHSToUserCurrency(tier.price as number) * 100) / 100,
      priceInGHS: tier.price,
      benefits: tier.benefits
        ? (tier.benefits as string)
            .split('\n')
            .map((b) => b.trim())
            .filter((b) => b.length > 0)
        : [],
      isPopular: tier.isPopular || false,
      hasAnalytics: tier.hasAnalytics || false,
      showWeLoveBadge: tier.showWeLoveBadge || false,
    }))

    return Response.json({
      tiers: transformedTiers,
      total: tiers.totalDocs,
      currency: {
        symbol: currencySymbol,
        code: currencyCode,
      },
    })
  } catch (error) {
    payload.logger.error(`Error fetching boost tiers: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch boost tiers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
