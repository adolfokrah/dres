import type { Payload } from 'payload'

const departments = ['Men', 'Women', 'Kids']

export const seedDepartments = async (payload: Payload): Promise<void> => {
  payload.logger.info('Clearing departments...')

  // Delete all existing departments
  const existingDepartments = await payload.find({
    collection: 'departments',
    limit: 1000,
  })

  for (const doc of existingDepartments.docs) {
    await payload.delete({
      collection: 'departments',
      id: doc.id,
    })
  }

  payload.logger.info(`Deleted ${existingDepartments.docs.length} departments`)
  payload.logger.info('Seeding departments...')

  for (const name of departments) {
    await payload.create({
      collection: 'departments',
      data: { name },
    })
    payload.logger.info(`Created department: ${name}`)
  }

  payload.logger.info(`Departments seeding complete! (${departments.length} departments)`)
}
