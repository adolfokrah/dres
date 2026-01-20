import type { Payload } from 'payload'

/**
 * Assigns brands to styles that don't have a brand set or have orphaned brand references.
 * Uses the category's associated brands to pick a random one.
 * If a style's category has no brands, falls back to any available brand.
 */
export const assignBrandsToStyles = async (payload: Payload): Promise<void> => {
  payload.logger.info('Assigning brands to styles without valid brands...')

  // Get all valid brand IDs first
  const allBrands = await payload.find({
    collection: 'brands',
    limit: 500,
  })

  if (allBrands.docs.length === 0) {
    payload.logger.error('No brands found in database. Please seed brands first.')
    return
  }

  const validBrandIds = new Set(allBrands.docs.map((b) => b.id))
  const allBrandIds = allBrands.docs.map((b) => b.id)

  // Get all styles with depth to populate category
  const allStyles = await payload.find({
    collection: 'styles',
    limit: 1000,
    depth: 1,
  })

  // Filter styles that need brand assignment:
  // - brand is null/undefined
  // - brand ID references a deleted brand (orphaned reference)
  const stylesNeedingBrands = allStyles.docs.filter((style) => {
    if (!style.brand) return true

    // Check if brand is an orphaned reference (ID exists but brand was deleted)
    const brandId = typeof style.brand === 'object' ? style.brand.id : style.brand
    return !validBrandIds.has(brandId)
  })

  if (stylesNeedingBrands.length === 0) {
    payload.logger.info('No styles found without valid brands. Nothing to do.')
    return
  }

  payload.logger.info(
    `Found ${stylesNeedingBrands.length} styles without valid brands (out of ${allStyles.docs.length} total)`,
  )

  let updated = 0
  let skipped = 0

  for (const style of stylesNeedingBrands) {
    let brandId: string | null = null

    // Try to get brands from the style's category
    if (style.category && typeof style.category === 'object') {
      const categoryBrands = style.category.brands
      if (Array.isArray(categoryBrands) && categoryBrands.length > 0) {
        // Get brand IDs from category (could be objects or strings)
        const categoryBrandIds = categoryBrands.map((b) =>
          typeof b === 'object' ? b.id : b,
        )
        // Pick a random brand from category's brands
        const randomIndex = Math.floor(Math.random() * categoryBrandIds.length)
        brandId = categoryBrandIds[randomIndex]
      }
    }

    // Fallback: pick random brand from all brands
    if (!brandId) {
      const randomIndex = Math.floor(Math.random() * allBrandIds.length)
      brandId = allBrandIds[randomIndex]
    }

    if (!brandId) {
      payload.logger.warn(`Could not find brand for style: ${style.title || style.id}`)
      skipped++
      continue
    }

    try {
      await payload.update({
        collection: 'styles',
        id: style.id,
        data: {
          brand: brandId,
        },
      })
      updated++

      if (updated % 50 === 0) {
        payload.logger.info(`Progress: ${updated} styles updated...`)
      }
    } catch (error) {
      payload.logger.error(`Failed to update style ${style.id}: ${error}`)
      skipped++
    }
  }

  payload.logger.info(
    `Brand assignment complete! Updated: ${updated}, Skipped: ${skipped}`,
  )
}
