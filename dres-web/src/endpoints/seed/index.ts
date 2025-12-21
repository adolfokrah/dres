import type { Payload } from 'payload'
import { seedBrands } from './brands'

export const seed = async ({
  payload,
}: {
  payload: Payload
}): Promise<void> => {
  payload.logger.info('Starting seed...')

  // Seed brands
  await seedBrands(payload)

  payload.logger.info('Seed complete!')
}
