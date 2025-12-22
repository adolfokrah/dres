import type { Payload } from 'payload'

// African Countries with their currency codes
const countriesData = [
  // West Africa
  { name: 'Ghana', code: 'GH', currencyCode: 'GHS' },
  { name: 'Nigeria', code: 'NG', currencyCode: 'NGN' },
  { name: 'Senegal', code: 'SN', currencyCode: 'XOF' },
  { name: 'Ivory Coast', code: 'CI', currencyCode: 'XOF' },
  { name: 'Burkina Faso', code: 'BF', currencyCode: 'XOF' },
  { name: 'Mali', code: 'ML', currencyCode: 'XOF' },
  { name: 'Niger', code: 'NE', currencyCode: 'XOF' },
  { name: 'Benin', code: 'BJ', currencyCode: 'XOF' },
  { name: 'Togo', code: 'TG', currencyCode: 'XOF' },
  { name: 'Liberia', code: 'LR', currencyCode: 'LRD' },
  { name: 'Sierra Leone', code: 'SL', currencyCode: 'SLL' },
  { name: 'Guinea', code: 'GN', currencyCode: 'GNF' },
  
  // East Africa
  { name: 'Kenya', code: 'KE', currencyCode: 'KES' },
  { name: 'Tanzania', code: 'TZ', currencyCode: 'TZS' },
  { name: 'Uganda', code: 'UG', currencyCode: 'UGX' },
  { name: 'Rwanda', code: 'RW', currencyCode: 'RWF' },
  { name: 'Ethiopia', code: 'ET', currencyCode: 'ETB' },
  
  // Southern Africa
  { name: 'South Africa', code: 'ZA', currencyCode: 'ZAR' },
  { name: 'Botswana', code: 'BW', currencyCode: 'BWP' },
  { name: 'Zambia', code: 'ZM', currencyCode: 'ZMW' },
  { name: 'Zimbabwe', code: 'ZW', currencyCode: 'ZWL' },
  { name: 'Namibia', code: 'NA', currencyCode: 'NAD' },
  { name: 'Mozambique', code: 'MZ', currencyCode: 'MZN' },
  { name: 'Angola', code: 'AO', currencyCode: 'AOA' },
  
  // Central Africa
  { name: 'Cameroon', code: 'CM', currencyCode: 'XAF' },
  { name: 'Democratic Republic of Congo', code: 'CD', currencyCode: 'CDF' },
  { name: 'Gabon', code: 'GA', currencyCode: 'XAF' },
  { name: 'Congo', code: 'CG', currencyCode: 'XAF' },
  
  // North Africa
  { name: 'Egypt', code: 'EG', currencyCode: 'EGP' },
  { name: 'Morocco', code: 'MA', currencyCode: 'MAD' },
  { name: 'Tunisia', code: 'TN', currencyCode: 'TND' },
  { name: 'Algeria', code: 'DZ', currencyCode: 'DZD' },
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
