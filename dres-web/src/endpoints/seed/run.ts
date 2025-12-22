import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../payload.config'
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

const runSeed = async () => {
  const payload = await getPayload({ config })
  const args = process.argv.slice(2)

  console.log('🌱 Starting seed...')

  if (args.length === 0) {
    // Run all seeds in correct order (dependencies first)
    await seedCurrencies(payload) // Currencies first
    await seedCountries(payload) // Countries need currencies
    await seedRegionsAndCities(payload) // Regions and cities
    await seedUsers(payload) // Users need countries
    await seedDepartments(payload)
    await seedCollections(payload)
    await seedBrands(payload)
    await seedAttributes(payload) // Attributes before categories and options
    await seedCategories(payload) // Categories need departments, collections, brands, and attributes
    await seedAttributeOptions(payload) // Attribute options need attributes AND categories
  } else if (args.includes('currencies')) {
    await seedCurrencies(payload)
  } else if (args.includes('countries')) {
    await seedCurrencies(payload) // Ensure currencies exist
    await seedCountries(payload)
  } else if (args.includes('locations')) {
    await seedRegionsAndCities(payload)
  } else if (args.includes('brands')) {
    await seedBrands(payload)
  } else if (args.includes('users')) {
    await seedCurrencies(payload) // Ensure currencies exist
    await seedCountries(payload) // Ensure countries exist
    await seedUsers(payload)
  } else if (args.includes('departments')) {
    await seedDepartments(payload)
  } else if (args.includes('collections')) {
    await seedCollections(payload)
  } else if (args.includes('categories')) {
    await seedCategories(payload)
  } else if (args.includes('attributes')) {
    await seedAttributes(payload)
  } else if (args.includes('attributeOptions')) {
    await seedAttributeOptions(payload)
  }

  console.log('✅ Seed complete!')
  process.exit(0)
}

runSeed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
