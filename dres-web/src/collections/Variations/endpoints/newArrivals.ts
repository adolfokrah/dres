import type { PayloadHandler } from 'payload'
import { filteredVariations } from './filtered'

/**
 * GET /api/variations/new-arrivals
 *
 * Delegates to the filtered endpoint (default sort is createdAt desc).
 * Kept for backward compatibility with older app versions.
 */
export const newArrivals: PayloadHandler = async (req) => {
  const response = await filteredVariations(req)
  const data = await response.json()
  return Response.json({
    ...data,
    docs: data.variations,
  })
}
