import type { CollectionAfterChangeHook } from 'payload'
import type { Order } from '../../../payload-types'

/**
 * Manages draft reviews based on order item delivery/return status.
 * 
 * Logic:
 * 1. When ANY item of a variation is delivered → Create ONE draft review per variation per order
 * 2. When ALL items of a variation are returned → Delete the draft review
 * 
 * Reviews are per variation (not per SKU), per buyer, per order.
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
  const items = (doc.items || []) as any[]
  const previousItems = (previousDoc?.items || []) as any[]

  // Get customer ID
  const customerId = typeof doc.customer === 'string' 
    ? doc.customer 
    : doc.customer?.id

  if (!customerId) {
    return doc
  }

  // Group items by variation ID to track status changes
  const variationStatusMap = new Map<string, {
    hasDelivered: boolean
    allReturned: boolean
    styleId: string | null
    justDelivered: boolean
    justAllReturned: boolean
  }>()

  // Build current state for each variation
  for (let i = 0; i < items.length; i++) {
    const currentItem = items[i]
    const previousItem = previousItems[i]

    const variationId = typeof currentItem.variation === 'string'
      ? currentItem.variation
      : currentItem.variation?.id

    if (!variationId) continue

    if (!variationStatusMap.has(variationId)) {
      variationStatusMap.set(variationId, {
        hasDelivered: false,
        allReturned: true,
        styleId: null,
        justDelivered: false,
        justAllReturned: false,
      })
    }

    const status = variationStatusMap.get(variationId)!

    // Check if this item is delivered
    if (currentItem.shippingStatus === 'delivered') {
      status.hasDelivered = true
      status.allReturned = false

      // Check if this item just changed to delivered
      if (previousItem?.shippingStatus !== 'delivered') {
        status.justDelivered = true
      }
    }

    // Check if this item is NOT returned (meaning not all are returned)
    if (currentItem.shippingStatus !== 'returned' && currentItem.shippingStatus !== 'not_available') {
      status.allReturned = false
    }
  }

  // Check for variations where all items just became returned
  for (let i = 0; i < items.length; i++) {
    const currentItem = items[i]
    const previousItem = previousItems[i]

    const variationId = typeof currentItem.variation === 'string'
      ? currentItem.variation
      : currentItem.variation?.id

    if (!variationId) continue

    const status = variationStatusMap.get(variationId)!

    // If current item just changed to returned/not_available
    if (
      (currentItem.shippingStatus === 'returned' || currentItem.shippingStatus === 'not_available') &&
      previousItem?.shippingStatus !== 'returned' &&
      previousItem?.shippingStatus !== 'not_available'
    ) {
      // Check if ALL items of this variation are now returned
      if (status.allReturned) {
        status.justAllReturned = true
      }
    }
  }

  // Process each variation
  for (const [variationId, status] of variationStatusMap) {
    try {
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

      // Case 1: Item just delivered - create draft review if doesn't exist
      if (status.justDelivered) {
        // Check if a review already exists for this user + variation + order
        const existingReview = await payload.find({
          collection: 'reviews',
          where: {
            and: [
              { user: { equals: customerId } },
              { variation: { equals: variationId } },
              { order: { equals: doc.id } },
            ],
          },
          limit: 1,
        })

        if (existingReview.docs.length === 0) {
          // Create draft review
          await payload.create({
            collection: 'reviews',
            data: {
              user: customerId,
              style: styleId,
              variation: variationId,
              order: doc.id,
              status: 'draft',
            },
          })

          payload.logger.info(
            `Created draft review for user ${customerId}, variation ${variationId}, order ${doc.id}`
          )
        }
      }

      // Case 2: All items of this variation just returned - delete draft review
      if (status.justAllReturned) {
        // Find and delete draft/pending reviews (not active ones - user already submitted)
        const reviewToDelete = await payload.find({
          collection: 'reviews',
          where: {
            and: [
              { user: { equals: customerId } },
              { variation: { equals: variationId } },
              { order: { equals: doc.id } },
              { status: { in: ['draft', 'pending'] } },
            ],
          },
          limit: 1,
        })

        if (reviewToDelete.docs.length > 0) {
          await payload.delete({
            collection: 'reviews',
            id: reviewToDelete.docs[0].id,
          })

          payload.logger.info(
            `Deleted draft review for user ${customerId}, variation ${variationId}, order ${doc.id} (all items returned)`
          )
        }
      }

    } catch (error) {
      payload.logger.error(
        `Error processing review for variation ${variationId} in order ${doc.id}: ${error}`
      )
    }
  }

  return doc
}
