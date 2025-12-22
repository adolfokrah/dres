import type { Payload } from 'payload'

// Attributes used for product variations and filtering
const attributesData = [
  { name: 'Size' },
  { name: 'Color' },
  { name: 'Material' },
  { name: 'Fit' },
  { name: 'Length' },
  { name: 'Condition' },
  { name: 'Heel Height' },
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
      payload.logger.info(`Created attribute: ${attribute.name}`)
    } else {
      payload.logger.info(`Attribute already exists: ${attribute.name}`)
    }
  }
}
