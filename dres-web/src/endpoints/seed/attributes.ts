import type { Payload } from 'payload'

// Attributes used for product variations and filtering
// level: 'variation' = used at Variation level (e.g., Color)
// level: 'sku' = used at SKU level (e.g., Size)
const attributesData = [
  { name: 'Size', level: 'sku' as const },
  { name: 'Color', level: 'variation' as const },
  { name: 'Material', level: 'variation' as const },
  { name: 'Fit', level: 'variation' as const },
  { name: 'Length', level: 'variation' as const },
  { name: 'Condition', level: 'variation' as const },
  { name: 'Heel Height', level: 'sku' as const },
]

export const seedAttributes = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding attributes...')

  for (const attribute of attributesData) {
    // Check if attribute already exists
    const existing = await payload.find({
      collection: 'attributes',
      where: { name: { equals: attribute.name } },
      limit: 1,
    })

    if (existing.docs.length === 0) {
      await payload.create({
        collection: 'attributes',
        data: attribute,
      })
      payload.logger.info(`Created attribute: ${attribute.name} (${attribute.level} level)`)
    } else {
      // Update existing attribute with level if not set
      await payload.update({
        collection: 'attributes',
        id: existing.docs[0].id,
        data: { level: attribute.level },
      })
      payload.logger.info(`Updated attribute: ${attribute.name} (${attribute.level} level)`)
    }
  }
}
