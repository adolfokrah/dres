import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { seedAttributes } from './attributes'
import { seedAttributeOptions } from './attributeOptions'
import { seedBoostTiers } from './boostTiers'
import { seedBrands } from './brands'
import { seedCategories } from './categories'
import { seedCollections } from './collections'
import { seedCountries } from './countries'
import { seedCurrencies } from './currencies'
import { seedDepartments } from './departments'
import { seedRegionsAndCities } from './locations'
import { seedMenHomePage } from './menHomePage'
import { seedWomenHomePage } from './womenHomePage'
import { seedHeader } from './headerSeed'

const runSeed = async () => {
  const payload = await getPayload({ config })
  const args = process.argv.slice(2)

  console.log('🌱 Starting seed...')

  if (args.length === 0) {
    // Run all seeds in correct order (dependencies first)
    await seedCurrencies(payload) // Currencies first
    await seedCountries(payload) // Countries need currencies
    await seedRegionsAndCities(payload) // Regions and cities
    await seedDepartments(payload)
    await seedCollections(payload)
    await seedBrands(payload)
    await seedAttributes(payload) // Attributes before categories and options
    await seedCategories(payload) // Categories need departments, collections, brands, and attributes
    await seedAttributeOptions(payload) // Attribute options need attributes AND categories
    await seedBoostTiers(payload)
    await seedMenHomePage(payload)
    await seedWomenHomePage(payload)
    await seedHeader(payload)
  } else {
    // Run specific seeds based on arguments (supports multiple: pnpm seed men-home women-home)
    if (args.includes('currencies')) {
      await seedCurrencies(payload)
    }
    if (args.includes('countries')) {
      await seedCurrencies(payload) // Ensure currencies exist
      await seedCountries(payload)
    }
    if (args.includes('locations')) {
      await seedRegionsAndCities(payload)
    }
    if (args.includes('brands')) {
      await seedBrands(payload)
    }
    if (args.includes('departments')) {
      await seedDepartments(payload)
    }
    if (args.includes('collections')) {
      await seedCollections(payload)
    }
    if (args.includes('categories')) {
      await seedCategories(payload)
    }
    if (args.includes('attributes')) {
      await seedAttributes(payload)
    }
    if (args.includes('attributeOptions')) {
      await seedAttributeOptions(payload)
    }
    if (args.includes('boost-tiers')) {
      await seedBoostTiers(payload)
    }
    if (args.includes('men-home')) {
      await seedMenHomePage(payload)
    }
    if (args.includes('women-home')) {
      await seedWomenHomePage(payload)
    }
    if (args.includes('header')) {
      await seedHeader(payload)
    }
  }

  console.log('✅ Seed complete!')
  process.exit(0)
}

runSeed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
