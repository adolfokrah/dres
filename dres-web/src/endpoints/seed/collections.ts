import type { Payload } from 'payload'

// Collections with their department mappings
const collectionsData = [
  { name: 'Bags', departments: ['Women', 'Men', 'Kids'] },
  { name: 'Clothing', departments: ['Women', 'Men', 'Kids'] },
  { name: 'Shoes', departments: ['Women', 'Men', 'Kids'] },
  { name: 'Accessories', departments: ['Women', 'Men', 'Kids'] },
  { name: 'Jewelry', departments: ['Women', 'Men'] },
  { name: 'Watches', departments: ['Women', 'Men'] },
]

export const seedCollections = async (payload: Payload): Promise<void> => {
  payload.logger.info('Clearing collections...')

  // Delete all existing collections
  const existingCollections = await payload.find({
    collection: 'collections',
    limit: 1000,
  })

  for (const doc of existingCollections.docs) {
    await payload.delete({
      collection: 'collections',
      id: doc.id,
    })
  }

  payload.logger.info(`Deleted ${existingCollections.docs.length} collections`)
  payload.logger.info('Seeding collections...')

  for (const collection of collectionsData) {
    await payload.create({
      collection: 'collections',
      data: { name: collection.name },
    })
    payload.logger.info(`Created collection: ${collection.name}`)
  }

  payload.logger.info(`Collections seeding complete! (${collectionsData.length} collections)`)
}
