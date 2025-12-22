import type { Payload } from 'payload'
import { getCountryIdByCode } from './countries'

type UserSeedData = {
  email: string
  password: string
  firstName: string
  lastName: string
  shopName?: string
  role: 'admin' | 'user'
  accountStatus: 'active' | 'banned' | 'deleted'
  language: 'de' | 'en' | 'es' | 'fr' | 'it' | 'ja' | 'ko' | 'nl' | 'pt' | 'zh'
  countryCode: string
}

const sampleUsers: UserSeedData[] = [
  {
    email: 'admin@dres.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    accountStatus: 'active',
    language: 'en',
    countryCode: 'GH',
  },
  {
    email: 'kwame.asante@example.com',
    password: 'password123',
    firstName: 'Kwame',
    lastName: 'Asante',
    shopName: 'Asante Styles',
    role: 'user',
    accountStatus: 'active',
    language: 'en',
    countryCode: 'GH',
  },
  {
    email: 'ama.mensah@example.com',
    password: 'password123',
    firstName: 'Ama',
    lastName: 'Mensah',
    shopName: 'Mensah Fashion House',
    role: 'user',
    accountStatus: 'active',
    language: 'en',
    countryCode: 'GH',
  },
  {
    email: 'chidi.okonkwo@example.com',
    password: 'password123',
    firstName: 'Chidi',
    lastName: 'Okonkwo',
    shopName: 'Okonkwo Fashion House',
    role: 'user',
    accountStatus: 'active',
    language: 'en',
    countryCode: 'NG',
  },
  {
    email: 'ngozi.adichie@example.com',
    password: 'password123',
    firstName: 'Ngozi',
    lastName: 'Adichie',
    shopName: 'Adichie Couture',
    role: 'user',
    accountStatus: 'active',
    language: 'en',
    countryCode: 'NG',
  },
  {
    email: 'wanjiku.kamau@example.com',
    password: 'password123',
    firstName: 'Wanjiku',
    lastName: 'Kamau',
    shopName: 'Kamau Designs',
    role: 'user',
    accountStatus: 'active',
    language: 'en',
    countryCode: 'KE',
  },
  {
    email: 'thabo.mokoena@example.com',
    password: 'password123',
    firstName: 'Thabo',
    lastName: 'Mokoena',
    shopName: 'Mokoena Style',
    role: 'user',
    accountStatus: 'active',
    language: 'en',
    countryCode: 'ZA',
  },
  {
    email: 'fatou.diallo@example.com',
    password: 'password123',
    firstName: 'Fatou',
    lastName: 'Diallo',
    shopName: 'Diallo Mode',
    role: 'user',
    accountStatus: 'active',
    language: 'fr',
    countryCode: 'SN',
  },
  {
    email: 'amina.hassan@example.com',
    password: 'password123',
    firstName: 'Amina',
    lastName: 'Hassan',
    shopName: 'Hassan Textiles',
    role: 'user',
    accountStatus: 'active',
    language: 'en',
    countryCode: 'TZ',
  },
  {
    email: 'banned.user@example.com',
    password: 'password123',
    firstName: 'Banned',
    lastName: 'User',
    role: 'user',
    accountStatus: 'banned',
    language: 'en',
    countryCode: 'GH',
  },
]

export const seedUsers = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding users...')

  for (const user of sampleUsers) {
    // Check if user already exists by email only
    const existing = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: user.email,
        },
      },
      depth: 0,
    })

    if (existing.docs.length === 0) {
      // Get country ID
      const countryId = await getCountryIdByCode(payload, user.countryCode)
      
      if (!countryId) {
        payload.logger.warn(`Country ${user.countryCode} not found for ${user.email}, skipping...`)
        continue
      }
      
      const { countryCode, ...userData } = user
      
      await payload.create({
        collection: 'users',
        data: {
          ...userData,
          country: countryId,
        },
      })
      payload.logger.info(`Created user: ${user.email}`)
    } else {
      payload.logger.info(`User already exists: ${user.email}`)
    }
  }

  payload.logger.info('Users seeding complete!')
}
