import type { Payload } from 'payload'

const variantTypes = ['Size', 'Color', 'Material', 'Length', 'Fit', 'Heel Height', 'Condition']

export const seedVariantTypes = async (payload: Payload): Promise<void> => {
  // Must delete variant options first due to foreign key constraint
  payload.logger.info('Clearing variant options (required before variant types)...')

  const existingOptions = await payload.find({
    collection: 'variantOptions',
    limit: 1000,
  })

  for (const doc of existingOptions.docs) {
    await payload.delete({
      collection: 'variantOptions',
      id: doc.id,
    })
  }

  payload.logger.info(`Deleted ${existingOptions.docs.length} variant options`)

  // Now delete variant types
  payload.logger.info('Clearing variant types...')

  const existing = await payload.find({
    collection: 'variantTypes',
    limit: 1000,
  })

  for (const doc of existing.docs) {
    await payload.delete({
      collection: 'variantTypes',
      id: doc.id,
    })
  }

  payload.logger.info(`Deleted ${existing.docs.length} variant types`)
  payload.logger.info('Seeding variant types...')

  for (const name of variantTypes) {
    await payload.create({
      collection: 'variantTypes',
      data: { name },
    })
    payload.logger.info(`Created variant type: ${name}`)
  }

  payload.logger.info(`Variant types seeding complete! (${variantTypes.length} types)`)
}
