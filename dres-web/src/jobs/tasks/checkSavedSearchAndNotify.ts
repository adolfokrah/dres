import type { TaskConfig } from 'payload'

/**
 * Task: checkSavedSearchAndNotify
 * 
 * Checks a saved search for new matching items and creates a notification
 * if new items are found since the last check.
 */
export const checkSavedSearchAndNotifyTask: TaskConfig<'checkSavedSearchAndNotify'> = {
  slug: 'checkSavedSearchAndNotify',
  retries: 2,
  inputSchema: [
    {
      name: 'savedSearchId',
      type: 'text',
      required: true,
    },
  ],
  outputSchema: [
    {
      name: 'newItemsCount',
      type: 'number',
    },
    {
      name: 'notificationSent',
      type: 'checkbox',
    },
  ],
  handler: async ({ input, req }) => {
    const { payload } = req
    const { savedSearchId } = input

    try {
      // 1. Fetch the saved search
      const savedSearch = await payload.findByID({
        collection: 'saved-searches',
        id: savedSearchId,
      })

      if (!savedSearch) {
        payload.logger.warn(`Saved search ${savedSearchId} not found`)
        return { output: { newItemsCount: 0, notificationSent: false } }
      }

      if (!savedSearch.isActive) {
        payload.logger.info(`Saved search ${savedSearchId} is not active, skipping`)
        return { output: { newItemsCount: 0, notificationSent: false } }
      }

      const userId = typeof savedSearch.user === 'string' 
        ? savedSearch.user 
        : savedSearch.user?.id

      if (!userId) {
        payload.logger.warn(`No user found for saved search ${savedSearchId}`)
        return { output: { newItemsCount: 0, notificationSent: false } }
      }

      const searchData = savedSearch.searchData as Record<string, any> || {}
      const lastChecked = savedSearch.lastChecked 
        ? new Date(savedSearch.lastChecked) 
        : new Date(0) // If never checked, check from beginning of time

      // 2. Build where conditions from searchData
      const whereConditions: any = {
        status: { not_equals: 'archived' },
        createdAt: { greater_than: lastChecked.toISOString() },
      }

      // Add filters from searchData
      if (searchData.departmentId) {
        whereConditions['style.department'] = { equals: searchData.departmentId }
      }
      if (searchData.categoryId) {
        whereConditions['style.category'] = { equals: searchData.categoryId }
      }
      if (searchData.collectionId) {
        whereConditions['style.collections'] = { contains: searchData.collectionId }
      }
      if (searchData.brandId) {
        whereConditions['style.brand'] = { equals: searchData.brandId }
      }

      // 3. Query for new variations
      const newVariations = await payload.find({
        collection: 'variations',
        where: whereConditions,
        limit: 1, // We just need to know if there are any
        depth: 0,
      })

      const newItemsCount = newVariations.totalDocs

      // 4. Update lastChecked regardless of results
      await payload.update({
        collection: 'saved-searches',
        id: savedSearchId,
        data: {
          lastChecked: new Date().toISOString(),
        },
      })

      // 5. If new items found, create notification
      if (newItemsCount > 0) {
        const searchName = savedSearch.name || 'your saved search'
        const message = newItemsCount === 1
          ? `1 new item matches "${searchName}"`
          : `${newItemsCount} new items match "${searchName}"`

        // Build the path to navigate to the search results
        const pathParams = new URLSearchParams()
        if (searchData.departmentId) pathParams.append('departmentId', searchData.departmentId)
        if (searchData.categoryId) pathParams.append('categoryId', searchData.categoryId)
        if (searchData.collectionId) pathParams.append('collectionId', searchData.collectionId)
        if (searchData.brandId) pathParams.append('brandId', searchData.brandId)
        if (searchData.filterType) pathParams.append('filterType', searchData.filterType)
        pathParams.append('title', savedSearch.name || 'Saved Search')

        const path = `/products?${pathParams.toString()}`

        // Create notification (FCM push will be sent automatically via hook)
        await payload.create({
          collection: 'notifications',
          data: {
            user: userId,
            type: 'system',
            message,
            path,
            metadata: {
              savedSearchId: savedSearch.id,
              savedSearchName: savedSearch.name,
              newItemsCount,
            },
            read: false,
          },
        })

        payload.logger.info(
          `Created notification for saved search ${savedSearchId}: ${newItemsCount} new items`
        )

        return { output: { newItemsCount, notificationSent: true } }
      }

      payload.logger.info(`No new items for saved search ${savedSearchId}`)
      return { output: { newItemsCount: 0, notificationSent: false } }

    } catch (error) {
      payload.logger.error(`Error checking saved search ${savedSearchId}: ${error}`)
      throw error // Let the task retry
    }
  },
}
