import type { Payload } from 'payload'

const departments = [
  { name: 'Men', slug: 'men' },
  { name: 'Women', slug: 'women' },
  { name: 'Kids', slug: 'kids' },
]

export const seedDepartments = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding departments...')

  let created = 0
  let skipped = 0

  for (const dept of departments) {
    // Check if department already exists by slug
    const existing = await payload.find({
      collection: 'departments',
      where: { slug: { equals: dept.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      skipped++
      continue
    }

    await payload.create({
      collection: 'departments',
      data: { name: dept.name, slug: dept.slug },
    })
    created++
  }

  payload.logger.info(
    `Departments seeding complete! Created: ${created}, Skipped (already exist): ${skipped}`,
  )
}
