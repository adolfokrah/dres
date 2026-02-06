import type { PayloadHandler } from 'payload'
import { filteredVariations } from './filtered'

/**
 * GET /api/variations/featured
 *
 * Delegates to the filtered endpoint with filterType=we-love.
 * The original featured endpoint only returned items with showWeLoveBadge,
 * so we use 'we-love' to match that behavior.
 * Transforms the response to return 'docs' instead of 'variations' for backward compat.
 */
export const featuredVariations: PayloadHandler = async (req) => {
  ;(req.query as Record<string, unknown>).filterType = 'we-love'
  const response = await filteredVariations(req)
  const data = await response.json()
  return Response.json({
    ...data,
    docs: data.variations,
  })
}
