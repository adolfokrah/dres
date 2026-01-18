import type { Payload } from 'payload'

export const seedFooter = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding Footer...')

  try {
    await payload.updateGlobal({
      slug: 'footer',
      data: {
        navItems: [
          {
            link: {
              type: 'custom',
              label: 'Privacy Policy',
              url: '/privacy-policy',
            },
          },
          {
            link: {
              type: 'custom',
              label: 'Terms of Service',
              url: '/terms-of-service',
            },
          },
        ],
      },
    })

    payload.logger.info('✅ Footer seeded successfully')
  } catch (error) {
    payload.logger.error(`❌ Error seeding footer: ${error}`)
    throw error
  }
}
