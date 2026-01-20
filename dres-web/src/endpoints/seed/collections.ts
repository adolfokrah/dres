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

  let created = 0
  let updated = 0

  for (const collection of collectionsData) {
    // Get department IDs for this collection
    const departmentIds = collection.departments
      .map((deptName) => departmentMap.get(deptName))
      .filter((id): id is string => id !== undefined)

    // Check if collection already exists
    const existing = await payload.find({
      collection: 'collections',
      where: { name: { equals: collection.name } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      // Update existing collection
      await payload.update({
        collection: 'collections',
        id: existing.docs[0].id,
        data: {
          name: collection.name,
          departments: departmentIds,
        },
      })
      updated++
    } else {
      // Create new collection
      await payload.create({
        collection: 'collections',
        data: {
          name: collection.name,
          departments: departmentIds,
        },
      })
      created++
    }
  }

  payload.logger.info(
    `Collections seeding complete! Created: ${created}, Updated: ${updated}`,
  )
}
