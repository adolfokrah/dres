import type { Payload } from 'payload'
import { seedAttributes } from './attributes'
import { seedAttributeOptions } from './attributeOptions'
import { seedBrands } from './brands'
import { seedCategories } from './categories'
import { seedCollections } from './collections'
import { seedCountries } from './countries'
import { seedCurrencies } from './currencies'
import { seedDepartments } from './departments'
import { seedRegionsAndCities } from './locations'
import { seedUsers } from './users'

export const seed = async ({
  payload,
}: {
  payload: Payload
}): Promise<void> => {
  payload.logger.info('🌱 Starting seed...')

  const isProduction = process.env.NODE_ENV === 'production'

  // Run all seeds in correct order (dependencies first)
  await seedCurrencies(payload)
  await seedCountries(payload)
  await seedRegionsAndCities(payload)
  
  // Skip users in production - don't want to seed fake/test users
  if (!isProduction) {
    await seedUsers(payload)
  } else {
    payload.logger.info('⏭️ Skipping users seed in production')
  }
  
  await seedDepartments(payload)
  await seedCollections(payload)
  await seedBrands(payload)
  await seedAttributes(payload)
  await seedCategories(payload)
  await seedAttributeOptions(payload)

  payload.logger.info('✅ Seed complete!')
}
