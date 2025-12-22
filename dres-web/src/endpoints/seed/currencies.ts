import type { Payload } from 'payload'

const sampleCurrencies = [
  // African Currencies
  { name: 'Ghana Cedi', code: 'GHS', symbol: '₵', isActive: true },
  { name: 'Nigerian Naira', code: 'NGN', symbol: '₦', isActive: true },
  { name: 'South African Rand', code: 'ZAR', symbol: 'R', isActive: true },
  { name: 'Kenyan Shilling', code: 'KES', symbol: 'KSh', isActive: true },
  { name: 'Egyptian Pound', code: 'EGP', symbol: 'E£', isActive: true },
  { name: 'Moroccan Dirham', code: 'MAD', symbol: 'MAD', isActive: true },
  { name: 'Tanzanian Shilling', code: 'TZS', symbol: 'TSh', isActive: true },
  { name: 'Ugandan Shilling', code: 'UGX', symbol: 'USh', isActive: true },
  { name: 'Rwandan Franc', code: 'RWF', symbol: 'FRw', isActive: true },
  { name: 'Ethiopian Birr', code: 'ETB', symbol: 'Br', isActive: true },
  { name: 'CFA Franc BCEAO', code: 'XOF', symbol: 'CFA', isActive: true }, // West African CFA
  { name: 'CFA Franc BEAC', code: 'XAF', symbol: 'FCFA', isActive: true }, // Central African CFA
  { name: 'Botswana Pula', code: 'BWP', symbol: 'P', isActive: true },
  { name: 'Zambian Kwacha', code: 'ZMW', symbol: 'ZK', isActive: true },
  { name: 'Angolan Kwanza', code: 'AOA', symbol: 'Kz', isActive: true },
  { name: 'Liberian Dollar', code: 'LRD', symbol: 'L$', isActive: true },
  { name: 'Sierra Leonean Leone', code: 'SLL', symbol: 'Le', isActive: true },
  { name: 'Guinean Franc', code: 'GNF', symbol: 'FG', isActive: true },
  { name: 'Zimbabwean Dollar', code: 'ZWL', symbol: 'Z$', isActive: true },
  { name: 'Namibian Dollar', code: 'NAD', symbol: 'N$', isActive: true },
  { name: 'Mozambican Metical', code: 'MZN', symbol: 'MT', isActive: true },
  { name: 'Congolese Franc', code: 'CDF', symbol: 'FC', isActive: true },
  { name: 'Tunisian Dinar', code: 'TND', symbol: 'DT', isActive: true },
  { name: 'Algerian Dinar', code: 'DZD', symbol: 'DA', isActive: true },
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
