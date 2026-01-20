import type { Payload } from 'payload'
import { assignBrandsToStyles } from './assignBrandsToStyles'
import { seedAttributes } from './attributes'
import { seedAttributeOptions } from './attributeOptions'
import { seedBrands } from './brands'
import { seedCategories } from './categories'
import { seedCollections } from './collections'
import { seedCountries } from './countries'
import { seedCurrencies } from './currencies'
import { seedDepartments } from './departments'
import { seedRegionsAndCities } from './locations'

export const seed = async ({
  payload,
}: {
  payload: Payload
}): Promise<void> => {
  payload.logger.info('🌱 Starting seed...')

  // Run all seeds in correct order (dependencies first)
  await seedCurrencies(payload)
  await seedCountries(payload)
  await seedRegionsAndCities(payload)
  await seedDepartments(payload)
  await seedCollections(payload)
  await seedBrands(payload)
  await seedAttributes(payload)
  await seedCategories(payload)
  await seedAttributeOptions(payload)

  payload.logger.info('✅ Seed complete!')
}

// Export individual seed functions for selective use
export { assignBrandsToStyles }
