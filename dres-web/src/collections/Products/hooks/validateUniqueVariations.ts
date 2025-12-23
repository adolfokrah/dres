import type { CollectionBeforeValidateHook } from 'payload'
import { APIError } from 'payload'

// Helper to create a unique key from variation options
const getVariationKey = (options: Record<string, number | null> | null | undefined): string => {
  if (!options || typeof options !== 'object') return ''
  // Sort keys to ensure consistent comparison
  const sortedEntries = Object.entries(options)
    .filter(([, value]) => value !== null)
    .sort(([a], [b]) => a.localeCompare(b))
  return JSON.stringify(sortedEntries)
}

interface Variation {
  options?: Record<string, number | null>
}

export const validateUniqueVariations: CollectionBeforeValidateHook = ({ data }) => {
  const variations = data?.variations as Variation[] | undefined

  if (!variations || !Array.isArray(variations) || variations.length <= 1) {
    return data
  }

  const seenVariations = new Map<string, number>()

  for (let i = 0; i < variations.length; i++) {
    const variation = variations[i]
    const options = variation?.options
    const key = getVariationKey(options)

    if (key) {
      const existingIndex = seenVariations.get(key)
      if (existingIndex !== undefined) {
        // Build a readable description of the duplicate options
        const optionsList = options
          ? Object.entries(options)
              .filter(([, val]) => val !== null)
              .map(([name]) => name)
              .join(', ')
          : 'unknown options'

        throw new APIError(
          `Duplicate variation found! Variation ${i + 1} has the same options as Variation ${existingIndex + 1} (${optionsList}). Please ensure each variation has a unique combination of options.`,
          400,
        )
      }
      seenVariations.set(key, i)
    }
  }

  return data
}
