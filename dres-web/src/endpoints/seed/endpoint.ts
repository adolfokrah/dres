import type { PayloadHandler } from 'payload'
import { seedAttributes } from './attributes'
import { seedAttributeOptions } from './attributeOptions'
import { seedBrands } from './brands'
import { seedCategories } from './categories'
import { seedCollections } from './collections'
import { seedCountries } from './countries'
import { seedCurrencies } from './currencies'
import { seedDepartments } from './departments'
import { seedRegionsAndCities } from './locations'

/**
 * Protected seed endpoint - requires admin authentication
 * 
 * Usage:
 * POST /api/seed
 * Body: { "target": "all" | "categories" | "collections" | "brands" | etc. }
 * 
 * Or with query param:
 * POST /api/seed?target=categories
 */
export const seedEndpoint: PayloadHandler = async (req) => {
  const { payload, user } = req

  // Check if user is authenticated and is admin
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check if user has admin role
  const userRoles = (user as any).roles || []
  if (!userRoles.includes('admin')) {
    return Response.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
  }

  // Get target from body or query params
  const body = await req.json?.().catch(() => ({})) || {}
  const target = body.target || req.query?.target || 'all'

  payload.logger.info(`🌱 Seed requested by ${user.email} - target: ${target}`)

  try {
    switch (target) {
      case 'all':
        await seedCurrencies(payload)
        await seedCountries(payload)
        await seedRegionsAndCities(payload)
        await seedDepartments(payload)
        await seedCollections(payload)
        await seedBrands(payload)
        await seedAttributes(payload)
        await seedCategories(payload)
        await seedAttributeOptions(payload)
        break
      case 'currencies':
        await seedCurrencies(payload)
        break
      case 'countries':
        await seedCurrencies(payload)
        await seedCountries(payload)
        break
      case 'locations':
        await seedRegionsAndCities(payload)
        break
      case 'brands':
        await seedBrands(payload)
        break
      case 'departments':
        await seedDepartments(payload)
        break
      case 'collections':
        await seedDepartments(payload)
        await seedCollections(payload)
        break
      case 'categories':
        await seedDepartments(payload)
        await seedCollections(payload)
        await seedBrands(payload)
        await seedAttributes(payload)
        await seedCategories(payload)
        break
      case 'attributes':
        await seedAttributes(payload)
        break
      case 'attribute-options':
        await seedAttributes(payload)
        await seedAttributeOptions(payload)
        break
      default:
        return Response.json(
          { error: `Unknown seed target: ${target}` },
          { status: 400 },
        )
    }

    payload.logger.info(`✅ Seed complete - target: ${target}`)
    return Response.json({
      success: true,
      message: `Seed completed for: ${target}`,
    })
  } catch (error) {
    payload.logger.error(`❌ Seed failed: ${error}`)
    return Response.json(
      {
        error: 'Seed failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
