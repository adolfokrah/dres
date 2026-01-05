import type { PayloadHandler } from 'payload'

/**
 * GET /api/saved-searches/my-searches
 * Fetch the logged-in user's saved searches
 *
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20)
 */
export const getMySavedSearches: PayloadHandler = async (req) => {
  const { payload, user } = req
  const url = new URL(req.url || '', 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '20', 10)

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await payload.find({
      collection: 'saved-searches' as any,
      where: {
        user: { equals: user.id },
      },
      sort: '-createdAt',
      page,
      limit,
    })

    // Transform to a cleaner format
    const searches = result.docs.map((doc: any) => ({
      id: doc.id,
      name: doc.name,
      searchData: doc.searchData,
      createdAt: doc.createdAt,
    }))

    return Response.json({
      docs: searches,
      totalDocs: result.totalDocs ?? searches.length,
      totalPages: result.totalPages ?? 1,
      page: result.page ?? page,
      limit,
      hasNextPage: result.hasNextPage ?? false,
      hasPrevPage: result.hasPrevPage ?? page > 1,
    })
  } catch (error: any) {
    payload.logger.error(`Error fetching saved searches: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch saved searches',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
