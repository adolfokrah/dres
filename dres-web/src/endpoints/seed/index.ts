import type { CollectionSlug, Payload, PayloadRequest } from 'payload'
import { seedBrands } from './brands'

export const seed = async ({
  payload,
  req,
}: {
  payload: Payload
  req: PayloadRequest
}): Promise<void> => {
  payload.logger.info('Starting seed...')

  // Seed brands
  await seedBrands(payload)

  payload.logger.info('Seed complete!')
}
