import type { PayloadRequest, Where } from 'payload'
import { Types } from 'mongoose'

// Default country code for non-logged-in users
const DEFAULT_COUNTRY_CODE = 'GH' // Ghana

interface CountryInfo {
  countryId: string
  countryCode: string
  currencyId: string
  currencyCode: string
  currencySymbol: string
}

/**
 * Get the user's country information
 * If user is not logged in or has no country, defaults to Ghana
 */
export async function getUserCountryInfo(req: PayloadRequest): Promise<CountryInfo> {
  const { payload, user } = req
  
  let countryId: string | null = null
  
  // Check if user is logged in and has a country
  if (user) {
    const userData = user as unknown as Record<string, unknown>
    const userCountry = userData.country
    if (typeof userCountry === 'string') {
      countryId = userCountry
    } else if (userCountry && typeof userCountry === 'object') {
      countryId = (userCountry as { id: string }).id
    }
  }
  
  // If no country from user, get Ghana's ID
  if (!countryId) {
    try {
      const ghanaCountry = await payload.find({
        collection: 'countries',
        where: { code: { equals: DEFAULT_COUNTRY_CODE } },
        limit: 1,
        depth: 1,
      })
      if (ghanaCountry.docs.length > 0) {
        const country = ghanaCountry.docs[0] as unknown as Record<string, unknown>
        const currency = country.currency as Record<string, unknown> | string
        
        return {
          countryId: country.id as string,
          countryCode: country.code as string,
          currencyId: typeof currency === 'object' ? currency.id as string : currency,
          currencyCode: typeof currency === 'object' ? currency.code as string : 'GHS',
          currencySymbol: typeof currency === 'object' ? currency.symbol as string : '₵',
        }
      }
    } catch (error) {
      payload.logger.error(`Error fetching default country: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    
    // Fallback if Ghana not found in DB
    return {
      countryId: '',
      countryCode: DEFAULT_COUNTRY_CODE,
      currencyId: '',
      currencyCode: 'GHS',
      currencySymbol: '₵',
    }
  }
  
  // Fetch the user's country with currency
  try {
    const country = await payload.findByID({
      collection: 'countries',
      id: countryId,
      depth: 1,
    })
    
    const countryData = country as unknown as Record<string, unknown>
    const currency = countryData.currency as Record<string, unknown> | string
    
    return {
      countryId: countryData.id as string,
      countryCode: countryData.code as string,
      currencyId: typeof currency === 'object' ? currency.id as string : currency,
      currencyCode: typeof currency === 'object' ? currency.code as string : 'GHS',
      currencySymbol: typeof currency === 'object' ? currency.symbol as string : '₵',
    }
  } catch (error) {
    payload.logger.error(`Error fetching user country: ${error instanceof Error ? error.message : 'Unknown error'}`)
    
    // Fallback
    return {
      countryId: '',
      countryCode: DEFAULT_COUNTRY_CODE,
      currencyId: '',
      currencyCode: 'GHS',
      currencySymbol: '₵',
    }
  }
}

/**
 * Build a Payload where clause to filter by seller's country
 */
export function buildSellerCountryFilter(countryId: string): Where {
  return {
    'style.seller.country': {
      equals: countryId,
    },
  }
}

/**
 * Build a MongoDB aggregation match stage to filter by seller's country
 */
export function buildSellerCountryMatchStage(countryId: string): Record<string, unknown> {
  return {
    'sellerData.country': new Types.ObjectId(countryId),
  }
}
