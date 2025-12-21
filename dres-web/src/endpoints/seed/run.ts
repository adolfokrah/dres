import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { seedBrands } from './brands'
import { seedCategories } from './categories'
import { seedCollections } from './collections'
import { seedDepartments } from './departments'
import { seedMaterials } from './materials'
import { seedUsers } from './users'
import { seedVariantOptions } from './variantOptions'
import { seedVariantTypes } from './variantTypes'

const runSeed = async () => {
  const payload = await getPayload({ config })
  const args = process.argv.slice(2)

  console.log('🌱 Starting seed...')

  if (args.length === 0) {
    // Run all seeds in correct order (dependencies first)
    await seedUsers(payload)
    await seedDepartments(payload)
    await seedCollections(payload)
    await seedBrands(payload)
    await seedVariantTypes(payload) // Variant types before categories
    await seedCategories(payload) // Categories need departments, collections, brands, and variant types
    await seedVariantOptions(payload) // Variant options need variant types and categories
    await seedMaterials(payload) // Materials need categories
  } else if (args.includes('brands')) {
    await seedBrands(payload)
  } else if (args.includes('users')) {
    await seedUsers(payload)
  } else if (args.includes('departments')) {
    await seedDepartments(payload)
  } else if (args.includes('collections')) {
    await seedCollections(payload)
  } else if (args.includes('categories')) {
    await seedCategories(payload)
  } else if (args.includes('variantTypes')) {
    await seedVariantTypes(payload)
  } else if (args.includes('variantOptions')) {
    await seedVariantOptions(payload)
  } else if (args.includes('materials')) {
    await seedMaterials(payload)
  }

  console.log('✅ Seed complete!')
  process.exit(0)
}

runSeed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
