import type { PayloadHandler } from 'payload'
import { filteredVariations } from './filtered'

/**
 * GET /api/variations/trending
 *
 * Delegates to the filtered endpoint with filterType=trending.
 * Transforms the response to return 'docs' instead of 'variations' for backward compat.
 */
export const trendingVariations: PayloadHandler = async (req) => {
  ;(req.query as Record<string, unknown>).filterType = 'trending'
  const response = await filteredVariations(req)
  const data = await response.json()
  return Response.json({
    ...data,
    docs: data.variations,
  })
}
