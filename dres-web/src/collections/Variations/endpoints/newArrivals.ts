import type { PayloadHandler } from 'payload'
import { filteredVariations } from './filtered'

/**
 * GET /api/variations/new-arrivals
 *
 * Delegates to the filtered endpoint with no filterType (default sort is createdAt desc).
 * Transforms the response to return 'docs' instead of 'variations' for backward compat.
 */
export const newArrivals: PayloadHandler = async (req) => {
  const response = await filteredVariations(req)
  const data = await response.json()
  return Response.json({
    ...data,
    docs: data.variations,
  })
}
