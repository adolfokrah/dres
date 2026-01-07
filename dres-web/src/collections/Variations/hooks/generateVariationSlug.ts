import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Generates a unique slug for variations in the format:
 * {style.title}-{variantValue}-{variationId}
 * 
 * Title format: "Style Name - Color" (prioritizes color, else uses first attribute)
 * Example: "nike-air-max-red-abc123"
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

    // Get variant values with their attribute info
    const variants = data?.variants || originalDoc?.variants
    let selectedVariantName: string | null = null
    let colorVariantName: string | null = null
    let firstVariantName: string | null = null

    if (variants && Array.isArray(variants)) {
      for (const variantItem of variants) {
        const valueId = variantItem?.value
        if (valueId) {
          const valueIdStr = typeof valueId === 'object' ? valueId.id : valueId
          try {
            // Fetch attribute option with its parent attribute
            const attributeOption = await payload.findByID({
              collection: 'attributeOptions',
              id: valueIdStr,
              depth: 1, // Get parent attribute
            })
            
            if (attributeOption?.name) {
              // Store first variant as fallback
              if (!firstVariantName) {
                firstVariantName = attributeOption.name
              }
              
              // Check if this is a color attribute
              const attribute = attributeOption.attribute
              const attributeName = typeof attribute === 'object' 
                ? attribute?.name?.toLowerCase() 
                : null
              
              if (attributeName === 'color' || attributeName === 'colour') {
                colorVariantName = attributeOption.name
                break // Found color, no need to continue
              }
            }
          } catch {
            // Attribute option not found, skip
          }
        }
      }
    }

    // Prioritize color, else use first available variant
    selectedVariantName = colorVariantName || firstVariantName

    // Generate the slug
    const slugParts: string[] = []

    if (styleTitle) {
      slugParts.push(slugify(styleTitle))
    }

    // Add single variant value name
    if (selectedVariantName) {
      slugParts.push(slugify(selectedVariantName))
    }

    // Add a unique identifier (use existing ID or generate short ID)
    const uniqueId = originalDoc?.id || generateShortId()
    slugParts.push(uniqueId.toString().slice(-8)) // Last 8 chars of ID

    data.slug = slugParts.join('-')

    // Generate title: "Style Name - VariantValue"
    const titleParts: string[] = []
    if (styleTitle) {
      titleParts.push(styleTitle)
    }
    if (selectedVariantName) {
      titleParts.push(selectedVariantName)
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
