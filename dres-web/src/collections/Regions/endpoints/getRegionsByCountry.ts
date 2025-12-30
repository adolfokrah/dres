import type { PayloadHandler } from 'payload'

interface CityData {
  id: string
  name: string
}

interface RegionWithCities {
  id: string
  name: string
  cities: CityData[]
}

/**
 * GET /api/regions/by-country
 * Fetch regions with their cities for the logged-in user's country
 * Returns regions grouped with their cities for easy selection
 */
export const getRegionsByCountry: PayloadHandler = async (req) => {
  const { payload, user } = req

  // Check if user is authenticated
  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // Get user's country
    const userCountryId = typeof user.country === 'object' 
      ? user.country?.id 
      : user.country

    if (!userCountryId) {
      return Response.json(
        { error: 'User country not set. Please update your profile.' },
        { status: 400 }
      )
    }

    // Fetch all regions for the user's country
    const regionsResult = await payload.find({
      collection: 'regions',
      where: {
        country: {
          equals: userCountryId,
        },
      },
      limit: 100,
      sort: 'name',
      depth: 0,
    })

    // Fetch all cities for the user's country
    const citiesResult = await payload.find({
      collection: 'cities',
      where: {
        country: {
          equals: userCountryId,
        },
      },
      limit: 500,
      sort: 'name',
      depth: 0,
    })

    // Group cities by region
    const citiesByRegion = new Map<string, CityData[]>()
    const citiesWithoutRegion: CityData[] = []

    for (const city of citiesResult.docs) {
      const regionId = typeof city.region === 'object' 
        ? city.region?.id 
        : city.region

      const cityData: CityData = {
        id: city.id,
        name: city.name,
      }

      if (regionId) {
        const existing = citiesByRegion.get(regionId) || []
        existing.push(cityData)
        citiesByRegion.set(regionId, existing)
      } else {
        citiesWithoutRegion.push(cityData)
      }
    }

    // Build response with regions and their cities
    const regionsWithCities: RegionWithCities[] = regionsResult.docs.map((region) => ({
      id: region.id,
      name: region.name,
      cities: citiesByRegion.get(region.id) || [],
    }))

    // Sort cities within each region alphabetically
    regionsWithCities.forEach((region) => {
      region.cities.sort((a, b) => a.name.localeCompare(b.name))
    })

    return Response.json({
      countryId: userCountryId,
      regions: regionsWithCities,
      citiesWithoutRegion: citiesWithoutRegion.sort((a, b) => a.name.localeCompare(b.name)),
      totalRegions: regionsWithCities.length,
      totalCities: citiesResult.totalDocs,
    })
  } catch (error: any) {
    payload.logger.error(`Error fetching regions by country: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch regions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
