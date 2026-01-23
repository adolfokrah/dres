import type { TaskConfig } from 'payload'

/**
 * Task: Abandoned Cart Reminder
 *
 * Sends push notifications to users who have items in their cart
 * but haven't completed checkout within 24 hours.
 *
 * Features:
 * - Only sends one reminder per cart (tracks via cartReminderSentAt)
 * - Only for active carts with items
 * - Only for registered users (need FCM tokens linked)
 * - Includes first product image in notification
 *
 * Scheduled to run every hour.
 */
export const abandonedCartReminderTask: TaskConfig = {
  slug: 'abandonedCartReminder' as any,
  retries: 2,
  outputSchema: [
    {
      name: 'cartsProcessed',
      type: 'number',
    },
    {
      name: 'remindersSkipped',
      type: 'number',
    },
  ],
  // Schedule: every hour
  schedule: [
    {
      cron: '0 * * * *', // At minute 0 of every hour
      queue: 'default',
    },
  ],
  handler: async ({ req }) => {
    const { payload } = req
    const abandonmentHours = 4 // Send reminder after 24 hours of inactivity

    payload.logger.info(
      `🛒 Starting abandoned cart reminder task (abandonmentHours: ${abandonmentHours})`,
    )

    try {
      // Calculate cutoff date - carts not updated in the last 24 hours
      const cutoffDate = new Date()
      cutoffDate.setHours(cutoffDate.getHours() - abandonmentHours)

      // Fetch active carts that:
      // 1. Have items (itemCount > 0)
      // 2. Were last updated more than 24 hours ago
      // 3. Haven't been sent a reminder yet (cartReminderSentAt is null)
      // 4. Have a customer (registered user)
      const abandonedCarts = await payload.find({
        collection: 'carts',
        where: {
          and: [
            { status: { equals: 'active' } },
            { itemCount: { greater_than: 0 } },
            { updatedAt: { less_than: cutoffDate.toISOString() } },
            { cartReminderSentAt: { exists: false } },
            { customer: { exists: true } },
          ],
        },
        limit: 100, // Process up to 100 carts per run
        depth: 2, // Get customer and variation details
      })

      if (abandonedCarts.docs.length === 0) {
        payload.logger.info('No abandoned carts found to remind about')
        return { output: { cartsProcessed: 0, remindersSkipped: 0 } }
      }

      payload.logger.info(`Found ${abandonedCarts.docs.length} abandoned carts to process`)

      let cartsProcessed = 0
      let remindersSkipped = 0

      for (const cart of abandonedCarts.docs) {
        const customerId = typeof cart.customer === 'string' ? cart.customer : cart.customer?.id

        if (!customerId) {
          remindersSkipped++
          continue
        }

        // Get the first item's variation for the notification image
        const firstItem = cart.items?.[0]
        let imageId: string | undefined

        if (firstItem?.variation) {
          const variation =
            typeof firstItem.variation === 'string'
              ? await payload.findByID({
                  collection: 'variations',
                  id: firstItem.variation,
                  depth: 1,
                })
              : firstItem.variation

          // Get the first image from the variation
          const firstImage = variation?.images?.[0]
          if (firstImage) {
            imageId = typeof firstImage === 'string' ? firstImage : firstImage.id
          }
        }

        // Create notification message
        const itemCount = cart.itemCount || cart.items?.length || 0
        const message =
          itemCount === 1
            ? 'You have an item waiting in your cart. Complete your purchase before it sells out!'
            : `You have ${itemCount} items waiting in your cart. Complete your purchase before they sell out!`

        try {
          // Create notification (this will trigger push via the afterChange hook)
          await payload.create({
            collection: 'notifications',
            data: {
              user: customerId,
              type: 'abandoned_cart',
              message,
              path: '/cart',
              ...(imageId && { image: imageId }),
              metadata: {
                cartId: cart.id,
                itemCount,
              },
              read: false,
            },
          })

          // Mark cart as reminder sent
          await payload.update({
            collection: 'carts',
            id: cart.id,
            data: {
              cartReminderSentAt: new Date().toISOString(),
            },
          })

          cartsProcessed++
          payload.logger.info(`Sent abandoned cart reminder for cart ${cart.id} to user ${customerId}`)
        } catch (error) {
          payload.logger.error(`Failed to send reminder for cart ${cart.id}: ${error}`)
          remindersSkipped++
        }
      }

      payload.logger.info(
        `✅ Abandoned cart reminder complete: ${cartsProcessed} reminders sent, ${remindersSkipped} skipped`,
      )

      return { output: { cartsProcessed, remindersSkipped } }
    } catch (error) {
      payload.logger.error(`Error in abandoned cart reminder task: ${error}`)
      throw error
    }
  },
}
