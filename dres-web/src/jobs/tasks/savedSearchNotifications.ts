import type { TaskConfig } from 'payload'

/**
 * Task: Saved Search Notifications
 * 
 * Checks all active saved searches for new matching items
 * and sends notifications to users.
 * Scheduled to run every 6 hours.
 */
export const savedSearchNotificationsTask: TaskConfig = {
  slug: 'savedSearchNotifications' as any,
  retries: 2,
  inputSchema: [],
  outputSchema: [
    {
      name: 'searchesChecked',
      type: 'number',
    },
    {
      name: 'notificationsSent',
      type: 'number',
    },
  ],
  // Schedule: daily at 8 AM UTC
  schedule: [
    {
      cron: '0 8 * * *', // 8 AM UTC
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req

    payload.logger.info('🔍 Starting saved search notifications task')

    try {
      // Fetch all active saved searches that haven't been checked in the last 6 hours
      const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()

      const savedSearches = await payload.find({
        collection: 'saved-searches',
        where: {
          isActive: { equals: true },
          or: [
            { lastChecked: { exists: false } },
            { lastChecked: { less_than: sixHoursAgo } },
          ],
        },
        limit: 100,
      })

      if (savedSearches.docs.length === 0) {
        payload.logger.info('No saved searches to check')
        return { output: { searchesChecked: 0, notificationsSent: 0 } }
      }

      payload.logger.info(`Found ${savedSearches.docs.length} saved searches to check`)

      let searchesChecked = 0
      let notificationsSent = 0

      for (const savedSearch of savedSearches.docs) {
        searchesChecked++

        try {
          const userId = typeof savedSearch.user === 'string' 
            ? savedSearch.user 
            : savedSearch.user?.id

          if (!userId) continue

          const searchData = savedSearch.searchData as Record<string, any> || {}
          const lastChecked = savedSearch.lastChecked 
            ? new Date(savedSearch.lastChecked) 
            : new Date(0)

          // Build where conditions from searchData
          const whereConditions: any = {
            status: { not_equals: 'archived' },
            createdAt: { greater_than: lastChecked.toISOString() },
          }

          if (searchData.departmentId) {
            whereConditions['style.department'] = { equals: searchData.departmentId }
          }
          if (searchData.categoryId) {
            whereConditions['style.category'] = { equals: searchData.categoryId }
          }
          if (searchData.collectionId) {
            whereConditions['style.collection'] = { equals: searchData.collectionId }
          }
          if (searchData.brandId) {
            whereConditions['style.brand'] = { equals: searchData.brandId }
          }

          // Query for new variations
          const newVariations = await payload.find({
            collection: 'variations',
            where: whereConditions,
            limit: 1,
            depth: 0,
          })

          const newItemsCount = newVariations.totalDocs

          // Update lastChecked
          await payload.update({
            collection: 'saved-searches',
            id: savedSearch.id,
            data: {
              lastChecked: new Date().toISOString(),
            },
          })

          // If new items found, create notification
          if (newItemsCount > 0) {
            const searchName = savedSearch.name || 'your saved search'
            const message = newItemsCount === 1
              ? `1 new item matches "${searchName}"`
              : `${newItemsCount} new items match "${searchName}"`

            const pathParams = new URLSearchParams()
            if (searchData.departmentId) pathParams.append('departmentId', searchData.departmentId)
            if (searchData.categoryId) pathParams.append('categoryId', searchData.categoryId)
            if (searchData.collectionId) pathParams.append('collectionId', searchData.collectionId)
            if (searchData.brandId) pathParams.append('brandId', searchData.brandId)
            if (searchData.filterType) pathParams.append('filterType', searchData.filterType)
            pathParams.append('title', savedSearch.name || 'Saved Search')

            const path = `/products?${pathParams.toString()}`

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

            notificationsSent++
          }

        } catch (searchError) {
          payload.logger.error(`Error processing saved search ${savedSearch.id}: ${searchError}`)
        }
      }

      payload.logger.info(`✅ Saved search notifications complete: ${searchesChecked} checked, ${notificationsSent} notifications sent`)

      return { output: { searchesChecked, notificationsSent } }

    } catch (error) {
      payload.logger.error(`Error in saved search notifications task: ${error}`)
      throw error
    }
  },
}
