import type { CollectionAfterChangeHook } from 'payload'
import type { Order } from '../../../payload-types'

/**
 * When an order item is marked as 'delivered', create a draft review
 * for the buyer to complete later.
 * 
 * This hook:
 * 1. Detects items that just changed to 'delivered' status
 * 2. Creates a draft review for each delivered item (if one doesn't exist)
 * 3. The draft review will be picked up by the notification job later
 */
export const createDraftReviewOnDelivery: CollectionAfterChangeHook<Order> = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only process updates (not creates)
  if (operation !== 'update') return doc

  const { payload } = req
  const items = doc.items || []
  const previousItems = previousDoc?.items || []

  // Get customer ID
  const customerId = typeof doc.customer === 'string' 
    ? doc.customer 
    : doc.customer?.id

  if (!customerId) {
    return doc
  }

  for (let i = 0; i < items.length; i++) {
    const currentItem = items[i] as any
    const previousItem = previousItems[i] as any

    // Check if this item just changed to 'delivered'
    if (
      currentItem.shippingStatus === 'delivered' &&
      previousItem?.shippingStatus !== 'delivered'
    ) {
      try {
        // Get variation and style IDs
        const variationId = typeof currentItem.variation === 'string'
          ? currentItem.variation
          : currentItem.variation?.id

        if (!variationId) {
          payload.logger.warn(`No variation ID for delivered item in order ${doc.id}`)
          continue
        }

        // Fetch variation to get style ID
        const variation = await payload.findByID({
          collection: 'variations',
          id: variationId,
          depth: 0,
        })

        const styleId = typeof variation.style === 'string'
          ? variation.style
          : (variation.style as any)?.id

        if (!styleId) {
          payload.logger.warn(`No style ID for variation ${variationId}`)
          continue
        }

        // Check if a review already exists for this user + style + order
        const existingReview = await payload.find({
          collection: 'reviews',
          where: {
            and: [
              { user: { equals: customerId } },
              { style: { equals: styleId } },
              { order: { equals: doc.id } },
            ],
          },
          limit: 1,
        })

        if (existingReview.docs.length > 0) {
          payload.logger.info(
            `Review already exists for user ${customerId}, style ${styleId}, order ${doc.id}`
          )
          continue
        }

        // Create draft review
        await payload.create({
          collection: 'reviews',
          data: {
            user: customerId,
            style: styleId,
            variation: variationId,
            order: doc.id,
            status: 'draft',
            // rating and review will be filled by user later
          },
        })

        payload.logger.info(
          `Created draft review for user ${customerId}, style ${styleId}, variation ${variationId}`
        )

      } catch (error) {
        payload.logger.error(
          `Error creating draft review for order ${doc.id}: ${error}`
        )
      }
    }
  }

  return doc
}
