import type { TaskConfig } from 'payload'

/**
 * Expire Flash Sales Task
 *
 * Automatically disables flash sales that have ended:
 * 1. Finds SKUs where flashSaleEnabled=true and flashSaleEndDate is in the past
 * 2. Sets price = compareAtPrice (restore original price)
 * 3. Clears compareAtPrice (remove strikethrough pricing)
 * 4. Sets flashSaleEnabled = false
 * 5. Clears flashSaleEndDate
 *
 * Schedule: Every 5 minutes
 */
export const expireFlashSalesTask: TaskConfig = {
  slug: 'expireFlashSales' as any,
  retries: 2,
  outputSchema: [
    { name: 'skusExpired', type: 'number' },
  ],
  schedule: [
    {
      cron: '*/5 * * * *',
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req

    payload.logger.info('[ExpireFlashSales] Starting flash sale expiration task')

    let skusExpired = 0
    const now = new Date().toISOString()

    try {
      const expiredSkus = await payload.find({
        collection: 'skus',
        where: {
          and: [
            { flashSaleEnabled: { equals: true } },
            { flashSaleEndDate: { less_than: now } },
          ],
        },
        limit: 100,
        depth: 0,
      })

      payload.logger.info(
        `[ExpireFlashSales] Found ${expiredSkus.docs.length} expired flash sale SKUs`,
      )

      for (const sku of expiredSkus.docs) {
        try {
          const originalPrice = sku.compareAtPrice as number | undefined

          await payload.update({
            collection: 'skus',
            id: sku.id,
            data: {
              ...(originalPrice ? { price: originalPrice } : {}),
              compareAtPrice: null,
              flashSaleEnabled: false,
              flashSaleEndDate: null,
            },
          })

          skusExpired++
          payload.logger.info(
            `[ExpireFlashSales] Expired SKU ${sku.id} - restored price to ${originalPrice ?? sku.price}`,
          )
        } catch (error) {
          payload.logger.error(`[ExpireFlashSales] Error expiring SKU ${sku.id}: ${error}`)
        }
      }

      payload.logger.info(`[ExpireFlashSales] Completed - ${skusExpired} SKUs expired`)

      return {
        output: {
          skusExpired,
        },
      }
    } catch (error) {
      payload.logger.error(`[ExpireFlashSales] Error: ${error}`)
      throw error
    }
  },
}
