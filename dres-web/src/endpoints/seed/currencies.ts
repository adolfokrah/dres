import type { Payload } from 'payload'

const sampleCurrencies = [
  // Ghana and Nigeria currencies only (for now)
  { name: 'Ghana Cedi', code: 'GHS', symbol: '₵', isActive: true, exchangeRateToGHS: 1 },
  { name: 'Nigerian Naira', code: 'NGN', symbol: '₦', isActive: true, exchangeRateToGHS: 0.008 }, // ~1 NGN = 0.008 GHS
]

export const seedCurrencies = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding currencies...')

  for (const currency of sampleCurrencies) {
    // Check if currency already exists
    const existing = await payload.find({
      collection: 'currencies',
      where: {
        code: {
          equals: currency.code,
        },
      },
    })

    if (existing.docs.length === 0) {
      await payload.create({
        collection: 'currencies',
        data: currency,
        draft: false,
      })
      payload.logger.info(`Created currency: ${currency.code}`)
    } else {
      payload.logger.info(`Currency already exists: ${currency.code}`)
    }
  }

  payload.logger.info('Currencies seeding complete!')
}

// Helper to get currency ID by code
export const getCurrencyIdByCode = async (payload: Payload, code: string): Promise<string | null> => {
  const result = await payload.find({
    collection: 'currencies',
    where: {
      code: {
        equals: code,
      },
    },
    limit: 1,
  })

  return result.docs.length > 0 ? result.docs[0].id : null
}
