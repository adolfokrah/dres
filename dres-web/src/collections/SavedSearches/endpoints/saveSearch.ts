import type { PayloadHandler } from 'payload'

/**
 * POST /api/saved-searches/save
 * Save a search with its filters
 *
 * Body:
 * - name?: Optional name for the saved search
 * - searchData: Object containing all search/filter parameters
 */
export const saveSearch: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json?.() ?? {}
    const { name, searchData } = body

    if (!searchData) {
      return Response.json(
        { error: 'searchData is required' },
        { status: 400 }
      )
    }

    // Create the saved search
    const savedSearch = await payload.create({
      collection: 'saved-searches' as any,
      data: {
        user: user.id,
        name: name || null,
        searchData: searchData,
        isActive: true,
      },
      overrideAccess: true,
    })

    return Response.json({
      success: true,
      message: 'Search saved successfully',
      doc: {
        id: savedSearch.id,
        name: savedSearch.name,
        searchData: savedSearch.searchData,
        isActive: savedSearch.isActive,
        createdAt: savedSearch.createdAt,
        lastChecked: savedSearch.lastChecked,
        lastNotificationSent: savedSearch.lastNotificationSent,
      },
    }, { status: 201 })

  } catch (error: any) {
    payload.logger.error(`Error saving search: ${error}`)
    return Response.json(
      {
        error: 'Failed to save search',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
