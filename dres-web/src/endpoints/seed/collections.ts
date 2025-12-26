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

  // Fetch all departments to get their IDs
  const departmentsResult = await payload.find({
    collection: 'departments',
    limit: 100,
  })
  
  const departmentMap = new Map<string, string>()
  for (const dept of departmentsResult.docs) {
    departmentMap.set(dept.name, dept.id)
  }

  for (const collection of collectionsData) {
    // Get department IDs for this collection
    const departmentIds = collection.departments
      .map(deptName => departmentMap.get(deptName))
      .filter((id): id is string => id !== undefined)

    await payload.create({
      collection: 'collections',
      data: { 
        name: collection.name,
        departments: departmentIds,
      },
    })
    payload.logger.info(`Created collection: ${collection.name} (${departmentIds.length} departments)`)
  }

  payload.logger.info(`Collections seeding complete! (${collectionsData.length} collections)`)
}
