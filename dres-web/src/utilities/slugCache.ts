import type { Payload } from 'payload'

/**
 * In-memory cache for slug → ID mappings
 * Provides ~0ms lookup after initial load
 */

interface SlugCacheData {
  categories: Map<string, string>  // slug/name → id
  collections: Map<string, string>
  brands: Map<string, string>
  departments: Map<string, string>
  lastUpdated: number
}

const cache: SlugCacheData = {
  categories: new Map(),
  collections: new Map(),
  brands: new Map(),
  departments: new Map(),
  lastUpdated: 0,
}

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

/**
 * Check if cache needs refresh
 */
function isCacheStale(): boolean {
  return Date.now() - cache.lastUpdated > CACHE_TTL
}

/**
 * Load all slugs into cache
 */
export async function refreshSlugCache(payload: Payload): Promise<void> {
  try {
    // Load all in parallel
    const [categories, collections, brands, departments] = await Promise.all([
      payload.find({
        collection: 'categories',
        pagination: false,
        depth: 0,
        select: { category: true },
      }),
      payload.find({
        collection: 'collections',
        pagination: false,
        depth: 0,
        select: { name: true },
      }),
      payload.find({
        collection: 'brands',
        pagination: false,
        depth: 0,
        select: { name: true },
      }),
      payload.find({
        collection: 'departments',
        pagination: false,
        depth: 0,
        select: { name: true, slug: true },
      }),
    ])

    // Clear and rebuild cache
    cache.categories.clear()
    cache.collections.clear()
    cache.brands.clear()
    cache.departments.clear()

    // Categories - use 'category' field as the name
    categories.docs.forEach((doc: any) => {
      const name = doc.category
      if (name) {
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        cache.categories.set(slug, doc.id)
        cache.categories.set(name.toLowerCase(), doc.id) // Also map by lowercase name
      }
    })

    // Collections
    collections.docs.forEach((doc: any) => {
      const name = doc.name
      if (name) {
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        cache.collections.set(slug, doc.id)
        cache.collections.set(name.toLowerCase(), doc.id)
      }
    })

    // Brands
    brands.docs.forEach((doc: any) => {
      const name = doc.name
      if (name) {
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        cache.brands.set(slug, doc.id)
        cache.brands.set(name.toLowerCase(), doc.id)
      }
    })

    // Departments
    departments.docs.forEach((doc: any) => {
      if (doc.slug) {
        cache.departments.set(doc.slug.toLowerCase(), doc.id)
      }
      if (doc.name) {
        cache.departments.set(doc.name.toLowerCase(), doc.id)
      }
    })

    cache.lastUpdated = Date.now()
    
    console.log(`[SlugCache] Loaded: ${cache.categories.size} categories, ${cache.collections.size} collections, ${cache.brands.size} brands, ${cache.departments.size} departments`)
  } catch (error) {
    console.error('[SlugCache] Failed to refresh cache:', error)
  }
}

/**
 * Ensure cache is loaded, refresh if stale
 */
async function ensureCache(payload: Payload): Promise<void> {
  if (cache.lastUpdated === 0 || isCacheStale()) {
    await refreshSlugCache(payload)
  }
}

/**
 * Check if string looks like a MongoDB ObjectId
 */
function isObjectId(str: string): boolean {
  return /^[a-f\d]{24}$/i.test(str)
}

/**
 * Resolve category slug/name to ID
 * Returns the ID directly if already an ObjectId
 */
export async function resolveCategoryId(
  payload: Payload,
  identifier: string | null | undefined
): Promise<string | null> {
  if (!identifier) return null
  if (isObjectId(identifier)) return identifier

  await ensureCache(payload)
  
  const normalizedId = identifier.toLowerCase().replace(/\s+/g, '-')
  return cache.categories.get(normalizedId) || 
         cache.categories.get(identifier.toLowerCase()) || 
         null
}

/**
 * Resolve collection slug/name to ID
 */
export async function resolveCollectionId(
  payload: Payload,
  identifier: string | null | undefined
): Promise<string | null> {
  if (!identifier) return null
  if (isObjectId(identifier)) return identifier

  await ensureCache(payload)
  
  const normalizedId = identifier.toLowerCase().replace(/\s+/g, '-')
  return cache.collections.get(normalizedId) || 
         cache.collections.get(identifier.toLowerCase()) || 
         null
}

/**
 * Resolve brand slug/name to ID
 */
export async function resolveBrandId(
  payload: Payload,
  identifier: string | null | undefined
): Promise<string | null> {
  if (!identifier) return null
  if (isObjectId(identifier)) return identifier

  await ensureCache(payload)
  
  const normalizedId = identifier.toLowerCase().replace(/\s+/g, '-')
  return cache.brands.get(normalizedId) || 
         cache.brands.get(identifier.toLowerCase()) || 
         null
}

/**
 * Resolve department slug/name to ID (cached version)
 */
export async function resolveDepartmentIdCached(
  payload: Payload,
  identifier: string | null | undefined
): Promise<string | null> {
  if (!identifier) return null
  if (isObjectId(identifier)) return identifier

  await ensureCache(payload)
  
  return cache.departments.get(identifier.toLowerCase()) || null
}

/**
 * Force cache refresh (call after CMS updates)
 */
export function invalidateSlugCache(): void {
  cache.lastUpdated = 0
}

/**
 * Get cache stats for debugging
 */
export function getSlugCacheStats() {
  return {
    categories: cache.categories.size,
    collections: cache.collections.size,
    brands: cache.brands.size,
    departments: cache.departments.size,
    lastUpdated: cache.lastUpdated,
    isStale: isCacheStale(),
  }
}
