import type { TaskConfig } from 'payload'

/**
 * Auto Return Stale Orders Task
 *
 * Automatically returns order items that have been in 'placed' status for more than 24 hours.
 * When this happens:
 * 1. Item status is set to 'not_available' (triggers refund via existing hook)
 * 2. Seller receives a sanction for late shipment
 * 3. Buyer is notified of the refund
 *
 * Schedule: Twice daily (every 12 hours)
 */
export const autoReturnStaleOrdersTask: TaskConfig = {
  slug: 'autoReturnStaleOrders' as any,
  retries: 2,
  outputSchema: [
    { name: 'ordersProcessed', type: 'number' },
    { name: 'itemsReturned', type: 'number' },
    { name: 'sellersSanctioned', type: 'number' },
  ],
  // Schedule: Twice daily at 6 AM and 6 PM
  schedule: [
    {
      cron: '*/7 * * * *', // Every 7 minutes (for testing - change back to '0 6,18 * * *' for production)
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req

    payload.logger.info('[AutoReturnStale] Starting auto-return stale orders task')

    let ordersProcessed = 0
    let itemsReturned = 0
    let sellersSanctioned = 0

    // Calculate 24 hours ago
    const staleThreshold = new Date()
    staleThreshold.setHours(staleThreshold.getHours() - 24)

    try {
      // Find orders with items that are still 'placed' and were placed more than 24 hours ago
      const orders = await payload.find({
        collection: 'orders',
        where: {
          and: [
            { 'items.shippingStatus': { equals: 'placed' } },
            { status: { in: ['placed', 'in_progress'] } },
            { placedAt: { less_than: staleThreshold.toISOString() } },
          ],
        },
        limit: 100, // Process in batches
        depth: 0,
      })

      payload.logger.info(`[AutoReturnStale] Found ${orders.docs.length} orders with stale placed items`)

      // Track sellers to sanction (avoid duplicate sanctions for same seller in same run)
      const sanctionedSellers = new Map<string, { orderId: string; orderDbId: string; itemIndices: number[] }>()

      for (const order of orders.docs) {
        const items = order.items as any[]
        let orderModified = false

        const statusLogEntry = {
          status: 'not_available',
          timestamp: new Date().toISOString(),
          note: 'Auto-returned: Seller did not ship within 24 hours',
        }

        const updatedItems = items.map((item: any, index: number) => {
          // Check if this specific item is stale (placed and order is older than 24 hours)
          if (item.shippingStatus === 'placed') {
            // Check if item has a status log with 'placed' timestamp older than 24 hours
            const placedLog = item.statusLogs?.find((log: any) => log.status === 'placed')
            const itemPlacedAt = placedLog?.timestamp ? new Date(placedLog.timestamp) : new Date(order.placedAt || order.createdAt)

            if (itemPlacedAt < staleThreshold) {
              orderModified = true
              itemsReturned++

              // Track seller for sanction
              const sellerId = typeof item.seller === 'object' ? item.seller.id : item.seller
              if (sellerId) {
                if (!sanctionedSellers.has(sellerId)) {
                  sanctionedSellers.set(sellerId, {
                    orderId: order.orderId as string,
                    orderDbId: order.id,
                    itemIndices: [index],
                  })
                } else {
                  sanctionedSellers.get(sellerId)!.itemIndices.push(index)
                }
              }

              payload.logger.info(
                `[AutoReturnStale] Marking item ${index} in order ${order.orderId} as not_available (seller: ${sellerId})`
              )

              return {
                ...item,
                shippingStatus: 'not_available',
                statusLogs: [...(item.statusLogs || []), statusLogEntry],
              }
            }
          }
          return item
        })

        if (orderModified) {
          // Update the order - this will trigger the refund hook
          await payload.update({
            collection: 'orders',
            id: order.id,
            data: {
              items: updatedItems,
            },
          })

          ordersProcessed++
          payload.logger.info(`[AutoReturnStale] Updated order ${order.orderId} - marked stale items as not_available`)

          // Notify the customer
          const customerId = typeof order.customer === 'object' ? order.customer.id : order.customer
          if (customerId) {
            await payload.create({
              collection: 'notifications',
              data: {
                user: customerId,
                type: 'system',
                message: `Some items in your order ${order.orderId} were not shipped by the seller within 24 hours. A refund has been initiated.`,
                path: `/purchases/${order.id}`,
                metadata: {
                  orderId: order.id,
                  orderNumber: order.orderId,
                  reason: 'seller_late_shipment',
                },
              },
            })
          }
        }
      }

      // Create sanctions for sellers
      for (const [sellerId, data] of sanctionedSellers) {
        try {
          const itemCount = data.itemIndices.length
          await payload.create({
            collection: 'seller-sanctions',
            data: {
              seller: sellerId,
              reason: 'late_shipment',
              notes: `Order ${data.orderId}: ${itemCount} item(s) not shipped within 24 hours. Auto-refunded to buyer.`,
            },
          })

          sellersSanctioned++
          payload.logger.info(`[AutoReturnStale] Created sanction for seller ${sellerId}`)

          // Notify the seller
          await payload.create({
            collection: 'notifications',
            data: {
              user: sellerId,
              type: 'system',
              message: `Warning: Order ${data.orderId} was not shipped in time. The buyer has been refunded.`,
              path: `/sell/orders`,
              metadata: {
                orderId: data.orderDbId,
                orderNumber: data.orderId,
              },
            },
          })
        } catch (error) {
          payload.logger.error(`[AutoReturnStale] Error creating sanction for seller ${sellerId}: ${error}`)
        }
      }

      payload.logger.info(
        `[AutoReturnStale] Completed - ${ordersProcessed} orders processed, ${itemsReturned} items returned, ${sellersSanctioned} sellers sanctioned`
      )

      return {
        output: {
          ordersProcessed,
          itemsReturned,
          sellersSanctioned,
        },
      }
    } catch (error) {
      payload.logger.error(`[AutoReturnStale] Error: ${error}`)
      throw error
    }
  },
}
