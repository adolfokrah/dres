import type { TaskConfig } from 'payload'

const MINIMUM_ITEMS_SOLD = 5

/**
 * Grant Trusted Seller Task
 *
 * Automatically grants "Trusted Seller" status to sellers who have
 * sold 5 or more items (delivered or out_for_delivery).
 * Once granted, the status is permanent and will not be revoked.
 *
 * Schedule: Every 6 hours
 */
export const grantTrustedSellerTask: TaskConfig = {
  slug: 'grantTrustedSeller' as any,
  retries: 2,
  outputSchema: [
    { name: 'sellersGranted', type: 'number' },
    { name: 'sellersChecked', type: 'number' },
  ],
  schedule: [
    {
      cron: '0 */6 * * *',
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req

    payload.logger.info('[GrantTrustedSeller] Starting trusted seller grant task')

    let sellersGranted = 0
    let sellersChecked = 0

    try {
      // Find all users who are NOT yet trusted sellers
      const nonTrustedUsers = await payload.find({
        collection: 'users',
        where: {
          or: [
            { trustedSeller: { equals: false } },
            { trustedSeller: { exists: false } },
          ],
        },
        limit: 500,
        depth: 0,
      })

      payload.logger.info(
        `[GrantTrustedSeller] Found ${nonTrustedUsers.docs.length} non-trusted users to check`,
      )

      for (const user of nonTrustedUsers.docs) {
        sellersChecked++

        // Find orders where this user is a seller
        const orders = await payload.find({
          collection: 'orders',
          where: {
            sellers: { contains: user.id },
          },
          limit: 100,
          depth: 0,
        })

        // Count delivered items for this seller
        let deliveredItems = 0

        for (const order of orders.docs) {
          const items = (order.items as any[]) || []
          for (const item of items) {
            const itemSellerId = typeof item.seller === 'object' ? item.seller?.id : item.seller
            if (itemSellerId === user.id) {
              if (item.shippingStatus === 'delivered' || item.shippingStatus === 'out_for_delivery') {
                deliveredItems += item.quantity || 1
              }
            }
          }

          // Early exit if threshold already met
          if (deliveredItems >= MINIMUM_ITEMS_SOLD) break
        }

        if (deliveredItems >= MINIMUM_ITEMS_SOLD) {
          await payload.update({
            collection: 'users',
            id: user.id,
            data: { trustedSeller: true },
          })

          sellersGranted++
          payload.logger.info(
            `[GrantTrustedSeller] Granted trusted seller to user ${user.id} (${deliveredItems} items delivered)`,
          )
        }
      }

      payload.logger.info(
        `[GrantTrustedSeller] Completed - ${sellersChecked} checked, ${sellersGranted} granted`,
      )

      return {
        output: {
          sellersGranted,
          sellersChecked,
        },
      }
    } catch (error) {
      payload.logger.error(`[GrantTrustedSeller] Error: ${error}`)
      throw error
    }
  },
}
