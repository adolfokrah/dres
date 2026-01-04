import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Generates a unique slug for variations in the format:
 * {style.title}-{variant1Value}-{variant2Value}-{variantNValue}-{variationId}
 * 
 * Example: "nike-air-max-red-42-abc123"
 */
export const generateVariationSlug: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
  context,
}) => {
  // Check if forced regeneration is requested (e.g., when style title changes)
  const forceRegenerate = context?.forceRegenerateSlug === true

  // Only generate slug on create or if style/variants changed, or if forced
  const shouldGenerateSlug =
    forceRegenerate ||
    operation === 'create' ||
    !originalDoc?.slug ||
    data?.style !== originalDoc?.style ||
    JSON.stringify(data?.variants) !== JSON.stringify(originalDoc?.variants)

  if (!shouldGenerateSlug) {
    return data
  }

  const { payload } = req

  try {
    // Get style title
    let styleTitle = ''
    const styleId = data?.style || originalDoc?.style

    if (styleId) {
      const styleIdStr = typeof styleId === 'object' ? styleId.id : styleId
      const style = await payload.findByID({
        collection: 'styles',
        id: styleIdStr,
        depth: 0,
      })
      styleTitle = style?.title || ''
    }

    // Get variant value names from the variants array (only first 2)
    const variantValueNames: string[] = []
    const variants = data?.variants || originalDoc?.variants

    if (variants && Array.isArray(variants)) {
      // Only take first 2 variants for title and slug
      const variantsToProcess = variants.slice(0, 2)
      
      for (const variantItem of variantsToProcess) {
        const valueId = variantItem?.value
        if (valueId) {
          const valueIdStr = typeof valueId === 'object' ? valueId.id : valueId
          try {
            const attributeOption = await payload.findByID({
              collection: 'attributeOptions',
              id: valueIdStr,
              depth: 0,
            })
            if (attributeOption?.name) {
              variantValueNames.push(attributeOption.name)
            }
          } catch {
            // Attribute option not found, skip
          }
        }
      }
    }

    // Generate the slug
    const slugParts: string[] = []

    if (styleTitle) {
      slugParts.push(slugify(styleTitle))
    }

    // Add all variant value names
    for (const valueName of variantValueNames) {
      if (valueName) {
        slugParts.push(slugify(valueName))
      }
    }

    // Add a unique identifier (use existing ID or generate short ID)
    const uniqueId = originalDoc?.id || generateShortId()
    slugParts.push(uniqueId.toString().slice(-8)) // Last 8 chars of ID

    data.slug = slugParts.join('-')

    // Generate title: "Style Name - Variant1 - Variant2"
    const titleParts: string[] = []
    if (styleTitle) {
      titleParts.push(styleTitle)
    }
    for (const valueName of variantValueNames) {
      if (valueName) {
        titleParts.push(valueName)
      }
    }
    data.title = titleParts.join(' - ') || `Variation ${uniqueId.toString().slice(-6)}`

    return data
  } catch (error) {
    console.error('Error generating variation slug:', error)
    // Fallback: generate a random slug
    data.slug = `variation-${generateShortId()}`
    return data
  }
}

/**
 * Convert a string to URL-friendly slug
 */
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
}

/**
 * Generate a short random ID
 */
function generateShortId(): string {
  return Math.random().toString(36).substring(2, 10)
}
