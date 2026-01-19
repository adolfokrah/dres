import type { TaskConfig } from 'payload'

/**
 * Auto Deliver Items Task (FOR TESTING ONLY)
 *
 * Automatically marks items that are 'out_for_delivery' as 'delivered'.
 * This is for testing purposes only - remove in production!
 *
 * Schedule: Every 5 minutes
 */
export const autoDeliverItemsTask: TaskConfig = {
  slug: 'autoDeliverItems' as any,
  retries: 2,
  outputSchema: [
    { name: 'ordersUpdated', type: 'number' },
    { name: 'itemsDelivered', type: 'number' },
  ],
  // Schedule: Every 5 minutes (FOR TESTING ONLY)
  schedule: [
    {
      cron: '*/5 * * * *', // Every 5 minutes
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req

    payload.logger.info('[AutoDeliver] Starting auto-deliver task (TESTING ONLY)')

    let ordersUpdated = 0
    let itemsDelivered = 0

    // Only update orders that haven't been updated in the last 5 minutes
    const fiveMinutesAgo = new Date()
    fiveMinutesAgo.setMinutes(fiveMinutesAgo.getMinutes() - 5)

    try {
      // Find orders with items that are 'out_for_delivery' and updated more than 5 mins ago
      const orders = await payload.find({
        collection: 'orders',
        where: {
          'items.shippingStatus': { equals: 'out_for_delivery' },
          status: { not_equals: 'completed' },
          updatedAt: { less_than: fiveMinutesAgo.toISOString() },
        },
        limit: 50,
        depth: 0,
      })

      payload.logger.info(`[AutoDeliver] Found ${orders.docs.length} orders with out_for_delivery items`)

      for (const order of orders.docs) {
        const items = order.items as any[]
        let orderModified = false

        const statusLogEntry = {
          status: 'delivered',
          timestamp: new Date().toISOString(),
          note: 'Auto-delivered by scheduled task (TESTING)',
        }

        const updatedItems = items.map((item: any) => {
          if (item.shippingStatus === 'out_for_delivery') {
            orderModified = true
            itemsDelivered++
            return {
              ...item,
              shippingStatus: 'delivered',
              statusLogs: [...(item.statusLogs || []), statusLogEntry],
            }
          }
          return item
        })

        if (orderModified) {
          // Check if all items are now in a completed state
          const allItemStatuses = updatedItems.map((i: any) => i.shippingStatus)
          const completedStatuses = ['delivered', 'returned', 'not_available', 'cancelled']
          const allCompleted = allItemStatuses.every((s: string) => completedStatuses.includes(s))

          await payload.update({
            collection: 'orders',
            id: order.id,
            data: {
              items: updatedItems,
              status: allCompleted ? 'completed' : order.status,
            },
          })

          ordersUpdated++
          payload.logger.info(`[AutoDeliver] Updated order ${order.id} - marked items as delivered`)
        }
      }

      payload.logger.info(
        `[AutoDeliver] Completed - ${ordersUpdated} orders updated, ${itemsDelivered} items delivered`,
      )

      return {
        output: {
          ordersUpdated,
          itemsDelivered,
        },
      }
    } catch (error) {
      payload.logger.error(`[AutoDeliver] Error: ${error}`)
      throw error
    }
  },
}
