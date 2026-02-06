import type { PayloadHandler } from 'payload'
import { filteredVariations } from './filtered'

/**
 * GET /api/variations/featured
 *
 * Delegates to the filtered endpoint with filterType=we-love.
 * Kept for backward compatibility with older app versions.
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
