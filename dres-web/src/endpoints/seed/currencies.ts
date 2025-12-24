import type { Payload } from 'payload'

const sampleCurrencies = [
  // African Currencies
  { name: 'Ghana Cedi', code: 'GHS', symbol: '₵', isActive: true, exchangeRateToGHS: 1 },
  { name: 'Nigerian Naira', code: 'NGN', symbol: '₦', isActive: true, exchangeRateToGHS: 0.05 },
  { name: 'South African Rand', code: 'ZAR', symbol: 'R', isActive: true, exchangeRateToGHS: 0.85 },
  { name: 'Kenyan Shilling', code: 'KES', symbol: 'KSh', isActive: true, exchangeRateToGHS: 0.1 },
  { name: 'Egyptian Pound', code: 'EGP', symbol: 'E£', isActive: true, exchangeRateToGHS: 0.32 },
  { name: 'Moroccan Dirham', code: 'MAD', symbol: 'MAD', isActive: true, exchangeRateToGHS: 1.5 },
  { name: 'Tanzanian Shilling', code: 'TZS', symbol: 'TSh', isActive: true, exchangeRateToGHS: 0.006 },
  { name: 'Ugandan Shilling', code: 'UGX', symbol: 'USh', isActive: true, exchangeRateToGHS: 0.004 },
  { name: 'Rwandan Franc', code: 'RWF', symbol: 'FRw', isActive: true, exchangeRateToGHS: 0.012 },
  { name: 'Ethiopian Birr', code: 'ETB', symbol: 'Br', isActive: true, exchangeRateToGHS: 0.26 },
  { name: 'CFA Franc BCEAO', code: 'XOF', symbol: 'CFA', isActive: true, exchangeRateToGHS: 0.024 },
  { name: 'CFA Franc BEAC', code: 'XAF', symbol: 'FCFA', isActive: true, exchangeRateToGHS: 0.024 },
  { name: 'Botswana Pula', code: 'BWP', symbol: 'P', isActive: true, exchangeRateToGHS: 1.1 },
  { name: 'Zambian Kwacha', code: 'ZMW', symbol: 'ZK', isActive: true, exchangeRateToGHS: 0.6 },
  { name: 'Angolan Kwanza', code: 'AOA', symbol: 'Kz', isActive: true, exchangeRateToGHS: 0.018 },
  { name: 'Liberian Dollar', code: 'LRD', symbol: 'L$', isActive: true, exchangeRateToGHS: 0.08 },
  { name: 'Sierra Leonean Leone', code: 'SLL', symbol: 'Le', isActive: true, exchangeRateToGHS: 0.0007 },
  { name: 'Guinean Franc', code: 'GNF', symbol: 'FG', isActive: true, exchangeRateToGHS: 0.0015 },
  { name: 'Zimbabwean Dollar', code: 'ZWL', symbol: 'Z$', isActive: true, exchangeRateToGHS: 0.002 },
  { name: 'Namibian Dollar', code: 'NAD', symbol: 'N$', isActive: true, exchangeRateToGHS: 0.85 },
  { name: 'Mozambican Metical', code: 'MZN', symbol: 'MT', isActive: true, exchangeRateToGHS: 0.24 },
  { name: 'Congolese Franc', code: 'CDF', symbol: 'FC', isActive: true, exchangeRateToGHS: 0.006 },
  { name: 'Tunisian Dinar', code: 'TND', symbol: 'DT', isActive: true, exchangeRateToGHS: 4.9 },
  { name: 'Algerian Dinar', code: 'DZD', symbol: 'DA', isActive: true, exchangeRateToGHS: 0.11 },
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
