import { APIError } from 'payload'

/**
 * Generate a unique 4-digit delivery code
 * @returns A 4-digit string code
 */
export const generateDeliveryCode = (): string => {
  // Generate a random 4-digit number (1000 - 9999)
  const code = Math.floor(1000 + Math.random() * 9000)
  return code.toString()
}

/**
 * Generate a unique delivery code that doesn't exist in the database
 * @param payload - Payload instance
 * @param maxAttempts - Maximum attempts to generate unique code
 * @returns A unique 4-digit string code
 */
export const generateUniqueDeliveryCode = async (
  payload: any,
  maxAttempts: number = 10,
): Promise<string> => {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateDeliveryCode()

    // Check if code already exists (codes are deleted after use, so any existing code is active)
    const existing = await payload.find({
      collection: 'delivery-codes',
      where: {
        code: { equals: code },
      },
      limit: 1,
    })

    if (existing.docs.length === 0) {
      return code
    }
  }

  throw new APIError('Failed to generate unique delivery code after maximum attempts', 500)
}
