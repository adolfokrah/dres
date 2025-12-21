import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { seedBrands } from './brands'

const runSeed = async () => {
  const payload = await getPayload({ config })
  const args = process.argv.slice(2)

  console.log('🌱 Starting seed...')

  if (args.length === 0 || args.includes('brands')) {
    await seedBrands(payload)
  }

  console.log('✅ Seed complete!')
  process.exit(0)
}

runSeed().catch((err) => {
  console.error('❌ Seed failed:', err)
  process.exit(1)
})
