import type { Payload } from 'payload'

const boostTiersData = [
  {
    name: 'Basic',
    slug: 'basic',
    duration: 7,
    price: 15,
    benefits: 'Higher visibility in search results\nAppear in "Trending" section\n7 days of boosted exposure',
    isPopular: false,
    isActive: true,
    hasAnalytics: false,
    showWeLoveBadge: false,
    sortOrder: 1,
  },
  {
    name: 'Standard',
    slug: 'standard',
    duration: 14,
    price: 25,
    benefits: 'Higher visibility in search results\nAppear in "Trending" section\nPriority placement in category pages\n14 days of boosted exposure',
    isPopular: true,
    isActive: true,
    hasAnalytics: false,
    showWeLoveBadge: true,
    sortOrder: 2,
  },
  {
    name: 'Premium',
    slug: 'premium',
    duration: 30,
    price: 45,
    benefits: 'Highest visibility in search results\nAppear in "Trending" section\nTop placement in category pages\nFeatured in "We Love" section\nFull analytics dashboard\n"We Love" badge on listing\n30 days of boosted exposure',
    isPopular: false,
    isActive: true,
    hasAnalytics: true,
    showWeLoveBadge: true,
    sortOrder: 3,
  },
]

export const seedBoostTiers = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding boost tiers...')

  for (const tier of boostTiersData) {
    // Check if tier already exists by slug
    const existing = await payload.find({
      collection: 'boost-tiers',
      where: {
        slug: { equals: tier.slug },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      // Update existing tier
      await payload.update({
        collection: 'boost-tiers',
        id: existing.docs[0].id,
        data: tier,
      })
      payload.logger.info(`Updated boost tier: ${tier.name}`)
    } else {
      // Create new tier
      await payload.create({
        collection: 'boost-tiers',
        data: tier,
      })
      payload.logger.info(`Created boost tier: ${tier.name}`)
    }
  }

  payload.logger.info('✅ Boost tiers seeding complete!')
}
