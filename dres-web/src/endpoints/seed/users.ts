import type { Payload } from 'payload'
import type { User } from '@/payload-types'

type UserSeed = Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { password: string }

const sampleUsers: UserSeed[] = [
  {
    email: 'admin@dres.com',
    password: 'admin123',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    accountStatus: 'active',
    language: 'en',
    currency: 'USD',
    country: 'US',
  },
  {
    email: 'john.doe@example.com',
    password: 'password123',
    firstName: 'John',
    lastName: 'Doe',
    shopName: 'John\'s Fashion',
    role: 'user',
    accountStatus: 'active',
    language: 'en',
    currency: 'USD',
    country: 'US',
  },
  {
    email: 'jane.smith@example.com',
    password: 'password123',
    firstName: 'Jane',
    lastName: 'Smith',
    shopName: 'Smith Boutique',
    role: 'user',
    accountStatus: 'active',
    language: 'en',
    currency: 'GBP',
    country: 'GB',
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
    currency: 'GHS',
    country: 'GH',
  },
  {
    email: 'marie.dupont@example.com',
    password: 'password123',
    firstName: 'Marie',
    lastName: 'Dupont',
    shopName: 'Maison Marie',
    role: 'user',
    accountStatus: 'active',
    language: 'fr',
    currency: 'EUR',
    country: 'FR',
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
    currency: 'NGN',
    country: 'NG',
  },
  {
    email: 'yuki.tanaka@example.com',
    password: 'password123',
    firstName: 'Yuki',
    lastName: 'Tanaka',
    shopName: 'Tanaka Collection',
    role: 'user',
    accountStatus: 'active',
    language: 'ja',
    currency: 'JPY',
    country: 'JP',
  },
  {
    email: 'hans.mueller@example.com',
    password: 'password123',
    firstName: 'Hans',
    lastName: 'Mueller',
    shopName: 'Mueller Mode',
    role: 'user',
    accountStatus: 'active',
    language: 'de',
    currency: 'EUR',
    country: 'DE',
  },
  {
    email: 'banned.user@example.com',
    password: 'password123',
    firstName: 'Banned',
    lastName: 'User',
    role: 'user',
    accountStatus: 'banned',
    language: 'en',
    currency: 'USD',
    country: 'US',
  },
  {
    email: 'sofia.garcia@example.com',
    password: 'password123',
    firstName: 'Sofia',
    lastName: 'Garcia',
    shopName: 'Garcia Moda',
    role: 'user',
    accountStatus: 'active',
    language: 'es',
    currency: 'EUR',
    country: 'ES',
  },
]

export const seedUsers = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding users...')

  for (const user of sampleUsers) {
    // Check if user already exists
    const existing = await payload.find({
      collection: 'users',
      where: {
        email: {
          equals: user.email,
        },
      },
    })

    if (existing.docs.length === 0) {
      await payload.create({
        collection: 'users',
        data: user,
      })
      payload.logger.info(`Created user: ${user.email}`)
    } else {
      payload.logger.info(`User already exists: ${user.email}`)
    }
  }

  payload.logger.info('Users seeding complete!')
}
