import type { TaskConfig } from 'payload'

/**
 * Auto Return Stale Deliveries Task
 *
 * Automatically returns order items that have been in 'out_for_delivery' status for more than 48 hours.
 * When this happens:
 * 1. Item status is set to 'returned' (triggers refund via existing hook)
 * 2. Seller receives a sanction for failed delivery
 * 3. Buyer is notified of the refund
 *
 * Schedule: Once daily
 */
export const autoReturnStaleDeliveriesTask: TaskConfig = {
  slug: 'autoReturnStaleDeliveries' as any,
  retries: 2,
  outputSchema: [
    { name: 'ordersProcessed', type: 'number' },
    { name: 'itemsReturned', type: 'number' },
    { name: 'sellersSanctioned', type: 'number' },
  ],
  // Schedule: Once daily at midnight
  schedule: [
    {
      cron: '0 0 * * *',
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req

    payload.logger.info('[AutoReturnStaleDeliveries] Starting auto-return stale deliveries task')

    let ordersProcessed = 0
    let itemsReturned = 0
    let sellersSanctioned = 0

    // Calculate 48 hours ago
    const staleThreshold = new Date()
    staleThreshold.setHours(staleThreshold.getHours() - 48)

    try {
      // Find orders with items that are still 'out_for_delivery' and have been for more than 48 hours
      const orders = await payload.find({
        collection: 'orders',
        where: {
          and: [
            { 'items.shippingStatus': { equals: 'out_for_delivery' } },
            { status: { in: ['placed', 'in_progress'] } },
          ],
        },
        limit: 100, // Process in batches
        depth: 0,
      })

      payload.logger.info(`[AutoReturnStaleDeliveries] Found ${orders.docs.length} orders with out_for_delivery items`)

      // Track sellers to sanction (avoid duplicate sanctions for same seller in same run)
      const sanctionedSellers = new Map<string, { orderId: string; orderDbId: string; itemIndices: number[] }>()

      for (const order of orders.docs) {
        const items = order.items as any[]
        let orderModified = false

        const statusLogEntry = {
          status: 'returned',
          timestamp: new Date().toISOString(),
          note: 'Auto-returned: Delivery took longer than 48 hours',
        }

        const updatedItems = items.map((item: any, index: number) => {
          // Check if this specific item is stale (out_for_delivery for more than 48 hours)
          if (item.shippingStatus === 'out_for_delivery') {
            // Check if item has a status log with 'out_for_delivery' timestamp older than 48 hours
            const outForDeliveryLog = item.statusLogs?.find((log: any) => log.status === 'out_for_delivery')
            const itemOutForDeliveryAt = outForDeliveryLog?.timestamp
              ? new Date(outForDeliveryLog.timestamp)
              : null

            // Only process if we can determine when it went out for delivery and it's been > 48 hours
            if (itemOutForDeliveryAt && itemOutForDeliveryAt < staleThreshold) {
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
                `[AutoReturnStaleDeliveries] Marking item ${index} in order ${order.orderId} as returned (seller: ${sellerId})`
              )

              return {
                ...item,
                shippingStatus: 'returned',
                returnReason: 'Delivery took longer than 48 hours',
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
          payload.logger.info(`[AutoReturnStaleDeliveries] Updated order ${order.orderId} - marked stale delivery items as returned`)

          // Notify the customer
          const customerId = typeof order.customer === 'object' ? order.customer.id : order.customer
          if (customerId) {
            await payload.create({
              collection: 'notifications',
              data: {
                user: customerId,
                type: 'system',
                message: `Some items in your order ${order.orderId} could not be delivered within 48 hours. A refund has been initiated.`,
                path: `/purchases/${order.id}`,
                metadata: {
                  orderId: order.id,
                  orderNumber: order.orderId,
                  reason: 'delivery_timeout',
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
              reason: 'failed_delivery',
              notes: `Order ${data.orderId}: ${itemCount} item(s) not delivered within 48 hours. Auto-refunded to buyer.`,
            },
          })

          sellersSanctioned++
          payload.logger.info(`[AutoReturnStaleDeliveries] Created sanction for seller ${sellerId}`)

          // Notify the seller
          await payload.create({
            collection: 'notifications',
            data: {
              user: sellerId,
              type: 'system',
              message: `Warning: Order ${data.orderId} was not delivered within 48 hours. The buyer has been refunded.`,
              path: `/sell/orders`,
              metadata: {
                orderId: data.orderDbId,
                orderNumber: data.orderId,
              },
            },
          })
        } catch (error) {
          payload.logger.error(`[AutoReturnStaleDeliveries] Error creating sanction for seller ${sellerId}: ${error}`)
        }
      }

      payload.logger.info(
        `[AutoReturnStaleDeliveries] Completed - ${ordersProcessed} orders processed, ${itemsReturned} items returned, ${sellersSanctioned} sellers sanctioned`
      )

      return {
        output: {
          ordersProcessed,
          itemsReturned,
          sellersSanctioned,
        },
      }
    } catch (error) {
      payload.logger.error(`[AutoReturnStaleDeliveries] Error: ${error}`)
      throw error
    }
  },
}
