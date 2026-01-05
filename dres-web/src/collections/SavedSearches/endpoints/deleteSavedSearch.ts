import type { PayloadHandler } from 'payload'

/**
 * DELETE /api/saved-searches/:id
 * Delete a saved search
 *
 * Route params:
 * - id: The saved search ID to delete
 */
export const deleteSavedSearch: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req
  const id = routeParams?.id as string

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!id) {
    return Response.json(
      { error: 'id is required' },
      { status: 400 }
    )
  }

  try {
    // Find the saved search to verify ownership
    const savedSearch = await payload.findByID({
      collection: 'saved-searches' as any,
      id,
    }) as any

    if (!savedSearch) {
      return Response.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    const searchUserId = typeof savedSearch.user === 'object'
      ? savedSearch.user.id
      : savedSearch.user

    if (searchUserId !== user.id && user.role !== 'admin') {
      return Response.json(
        { error: 'You can only delete your own saved searches' },
        { status: 403 }
      )
    }

    // Delete the saved search
    await payload.delete({
      collection: 'saved-searches' as any,
      id,
    })

    return Response.json({
      message: 'Saved search deleted successfully',
    }, { status: 200 })

  } catch (error: any) {
    payload.logger.error(`Error deleting saved search: ${error}`)
    return Response.json(
      {
        error: 'Failed to delete saved search',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
