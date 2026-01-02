import type { CollectionAfterChangeHook } from 'payload'
import { generateUniqueDeliveryCode } from '@/utilities/generateDeliveryCode'

/**
 * Hook that creates a delivery code when any item in the order is marked as 'out_for_delivery'
 * Creates one code per order (not per seller)
 */
export const createDeliveryCodeOnOutForDelivery: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only process on update
  if (operation !== 'update') return doc

  const payload = req.payload

  try {
    const currentItems = (doc.items || []) as any[]
    const previousItems = (previousDoc?.items || []) as any[]

    // Check if any item just changed to 'out_for_delivery'
    let hasNewOutForDelivery = false

    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i]
      const previousItem = previousItems[i]

      const isNowOutForDelivery = currentItem.shippingStatus === 'out_for_delivery'
      const wasOutForDelivery = previousItem?.shippingStatus === 'out_for_delivery'

      if (isNowOutForDelivery && !wasOutForDelivery) {
        hasNewOutForDelivery = true
        break
      }
    }

    // If no new out_for_delivery items, return early
    if (!hasNewOutForDelivery) return doc

    // Check if delivery code already exists for this order
    const existingCode = await payload.find({
      collection: 'delivery-codes' as any,
      where: {
        order: { equals: doc.id },
      },
      limit: 1,
    })

    // If code already exists, no need to create another
    if (existingCode.docs.length > 0) {
      payload.logger.info(
        `Delivery code already exists for order ${doc.id}: ${(existingCode.docs[0] as any).code}`,
      )
      return doc
    }

    // Get buyer ID
    const buyerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer

    // Create new delivery code for the order
    const newCode = await generateUniqueDeliveryCode(payload)
    await payload.create({
      collection: 'delivery-codes' as any,
      data: {
        code: newCode,
        order: doc.id,
        buyer: buyerId,
      } as any,
    })

    payload.logger.info(`Created delivery code ${newCode} for order ${doc.id}`)
  } catch (error) {
    payload.logger.error(`Error creating delivery code: ${error}`)
  }

  return doc
}
