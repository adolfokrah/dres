import type { CollectionBeforeChangeHook } from 'payload'

// Generate unique transaction ID: TXN-YYYYMMDD-XXXXXX-XXXX
const generateTransactionId = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomUUID().split('-')[0].toUpperCase()
  return `TXN-${dateStr}-${timestamp}-${random}`
}

/**
 * Hook to generate transaction ID and set currency from user's country
 */
export const setTransactionIdAndCurrency: CollectionBeforeChangeHook = async ({ data, operation, req }) => {
  // Generate transaction ID on create
  if (operation === 'create' && !data?.transactionId) {
    data.transactionId = generateTransactionId()
  }
  
  // Set currency from transaction's user field on create
  if (operation === 'create' && data?.user && !data?.currency) {
    const userId = typeof data.user === 'object' ? data.user.id : data.user
    
    // Fetch the user to get their country
    const user = await req.payload.findByID({
      collection: 'users',
      id: userId,
      depth: 1,
    })
    
    if (user?.country) {
      const countryId = typeof user.country === 'object' ? user.country.id : user.country
      // Fetch country to get currency
      const country = await req.payload.findByID({
        collection: 'countries',
        id: countryId,
        depth: 1,
      })
      if (country?.currency) {
        const currencyId = typeof country.currency === 'object' ? country.currency.id : country.currency
        data.currency = currencyId
      }
    }
  }
  
  return data
}
