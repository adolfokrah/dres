import type { FieldHook } from 'payload'

/**
 * Hook to auto-populate variant types based on category's main category allowed variants
 */
export const setVariantTypesFromMainCategory: FieldHook = async ({
  data,
  req,
  operation,
  value,
}) => {
  // Only check on create or update
  if (operation !== 'create' && operation !== 'update') {
    return value
  }

  // If no category selected, return existing value or undefined
  if (!data?.categories) {
    return value || undefined
  }

  try {
    const categoryId = typeof data.categories === 'object' ? data.categories.id : data.categories

    // Fetch the category with its main categories and allowed variants
    const categoryDoc = await req.payload.findByID({
      collection: 'categories',
      id: categoryId,
      depth: 3, // Increased depth to get allowedVariants
    })

    if (!categoryDoc) {
      return value || undefined
    }

    // Collect all allowed variant types from the category's main categories
    const allowedVariantTypeIds = new Set<string | number>()

    const mainCategories = categoryDoc.mainCategories
    if (mainCategories && Array.isArray(mainCategories)) {
      mainCategories.forEach((mainCat) => {
        if (typeof mainCat === 'object' && 'allowedVariants' in mainCat) {
          const allowedVariants = mainCat.allowedVariants
          if (Array.isArray(allowedVariants) && allowedVariants.length > 0) {
            allowedVariants.forEach((variant) => {
              const variantId = typeof variant === 'object' ? variant.id : variant
              if (variantId) {
                allowedVariantTypeIds.add(variantId)
              }
            })
          }
        }
      })
    }

    // Return the collected variant types, or undefined if none found
    return allowedVariantTypeIds.size > 0 ? Array.from(allowedVariantTypeIds) : undefined
  } catch (error) {
    console.error('Error setting variant types from main category:', error)
    return value || undefined
  }
}

/**
 * Hook to auto-enable variants when category has main category with allowed variants
 */
export const checkVariantRequirement: FieldHook = async ({ data, req, operation }) => {
  // Only check on create or update
  if (operation !== 'create' && operation !== 'update') {
    return data?.enableVariants
  }

  // If no category selected, return false
  if (!data?.categories) {
    return false
  }

  try {
    const categoryId = typeof data.categories === 'object' ? data.categories.id : data.categories

    // Fetch the category with its main categories
    const categoryDoc = await req.payload.findByID({
      collection: 'categories',
      id: categoryId,
      depth: 2,
    })

    if (!categoryDoc) {
      return false
    }

    // Check if any main category has allowed variants
    const mainCategories = categoryDoc.mainCategories
    if (!mainCategories || !Array.isArray(mainCategories)) {
      return false
    }

    const hasAllowedVariants = mainCategories.some((mainCat) => {
      const mainCategory = typeof mainCat === 'object' ? mainCat : null
      return (
        mainCategory &&
        'allowedVariants' in mainCategory &&
        mainCategory.allowedVariants &&
        Array.isArray(mainCategory.allowedVariants) &&
        mainCategory.allowedVariants.length > 0
      )
    })

    console.log(hasAllowedVariants, 'has allowed variants')

    // If main categories have allowed variants, variants should be enabled
    return hasAllowedVariants
  } catch (error) {
    console.error('Error checking variant requirement:', error)
    return false
  }
}
