import type { Payload } from 'payload'

// Countries - Ghana and Nigeria only (for now)
const countriesData = [
  { name: 'Ghana', code: 'GH', currencyCode: 'GHS' },
  { name: 'Nigeria', code: 'NG', currencyCode: 'NGN' },
]

export const seedCountries = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding countries...')

  // Get all currencies for mapping
  const currenciesResult = await payload.find({
    collection: 'currencies',
    limit: 100,
  })

  const currencyMap = new Map(currenciesResult.docs.map((c) => [c.code, c.id]))

  for (const country of countriesData) {
    // Check if country already exists
    const existing = await payload.find({
      collection: 'countries',
      where: {
        code: {
          equals: country.code,
        },
      },
      limit: 1,
    })

    if (existing.docs.length === 0) {
      const currencyId = currencyMap.get(country.currencyCode)
      
      if (!currencyId) {
        payload.logger.warn(`Currency ${country.currencyCode} not found for ${country.name}, skipping...`)
        continue
      }

      await payload.create({
        collection: 'countries',
        data: {
          name: country.name,
          code: country.code,
          currency: currencyId,
          isActive: true,
        },
      })
      payload.logger.info(`Created country: ${country.name} (${country.currencyCode})`)
    } else {
      payload.logger.info(`Country already exists: ${country.name}`)
    }
  }

  payload.logger.info('Countries seeding complete!')
}

// Helper to get country ID by code
export const getCountryIdByCode = async (payload: Payload, code: string): Promise<string | null> => {
  const result = await payload.find({
    collection: 'countries',
    where: {
      code: {
        equals: code,
      },
    },
    limit: 1,
  })

  return result.docs.length > 0 ? result.docs[0].id : null
}
