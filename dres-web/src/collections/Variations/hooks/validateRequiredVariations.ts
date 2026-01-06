import type { CollectionBeforeValidateHook } from 'payload'

/**
 * This hook was used to validate that products in categories with variant attributes
 * have at least one variation. The variantAttributes field has been removed from categories,
 * so this hook is now a no-op but kept for potential future use.
 */
export const validateRequiredVariations: CollectionBeforeValidateHook = async ({
  data,
}) => {
  // variantAttributes field was removed from categories
  // This hook is now a no-op
  return data
}
