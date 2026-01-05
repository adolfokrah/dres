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
        searchData: {
          departmentId: searchData.departmentId || null,
          departmentName: searchData.departmentName || null,
          collectionId: searchData.collectionId || null,
          collectionName: searchData.collectionName || null,
          categoryId: searchData.categoryId || null,
          categoryName: searchData.categoryName || null,
          brandId: searchData.brandId || null,
          brandName: searchData.brandName || null,
          filterType: searchData.filterType || null,
          sortBy: searchData.sortBy || null,
          sortPrice: searchData.sortPrice || null,
          minPrice: searchData.minPrice ?? null,
          maxPrice: searchData.maxPrice ?? null,
          selectedAttributes: searchData.selectedAttributes || null,
        },
      },
      overrideAccess: true,
    })

    return Response.json({
      message: 'Search saved successfully',
      id: savedSearch.id,
      name: savedSearch.name,
      searchData: savedSearch.searchData,
      createdAt: savedSearch.createdAt,
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
