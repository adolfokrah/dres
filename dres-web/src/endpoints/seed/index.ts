import type { Payload } from 'payload'
import { seedBrands } from './brands'
import { seedUsers } from './users'

export const seed = async ({
  payload,
}: {
  payload: Payload
}): Promise<void> => {
  payload.logger.info('Starting seed...')

  // Seed users first (needed for relationships)
  await seedUsers(payload)

  // Seed brands
  await seedBrands(payload)

  payload.logger.info('Seed complete!')
}
