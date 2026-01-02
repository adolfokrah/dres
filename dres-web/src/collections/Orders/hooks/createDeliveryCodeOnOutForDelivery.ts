import type { CollectionAfterChangeHook } from 'payload'
import { generateUniqueDeliveryCode } from '@/utilities/generateDeliveryCode'

/**
 * Hook that creates delivery codes when items are marked as 'out_for_delivery'
 * Creates one code per seller per order
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

    // Find items that just changed to 'out_for_delivery'
    const newlyOutForDeliveryItems: { itemId: string; sellerId: string }[] = []

    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i]
      const previousItem = previousItems[i]

      const isNowOutForDelivery = currentItem.shippingStatus === 'out_for_delivery'
      const wasOutForDelivery = previousItem?.shippingStatus === 'out_for_delivery'

      if (isNowOutForDelivery && !wasOutForDelivery) {
        const sellerId = typeof currentItem.seller === 'object' 
          ? currentItem.seller.id 
          : currentItem.seller

        if (sellerId && currentItem.id) {
          newlyOutForDeliveryItems.push({
            itemId: currentItem.id,
            sellerId,
          })
        }
      }
    }

    // If no new out_for_delivery items, return early
    if (newlyOutForDeliveryItems.length === 0) return doc

    // Group items by seller
    const itemsBySeller = new Map<string, string[]>()
    for (const item of newlyOutForDeliveryItems) {
      if (!itemsBySeller.has(item.sellerId)) {
        itemsBySeller.set(item.sellerId, [])
      }
      itemsBySeller.get(item.sellerId)!.push(item.itemId)
    }

    // Get buyer ID
    const buyerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer

    // Create or update delivery codes for each seller
    for (const [sellerId, itemIds] of itemsBySeller) {
      // Check if active delivery code exists for this seller + order
      const existingCode = await payload.find({
        collection: 'delivery-codes' as any,
        where: {
          and: [
            { order: { equals: doc.id } },
            { seller: { equals: sellerId } },
          ],
        },
        limit: 1,
      })

      if (existingCode.docs.length > 0) {
        // Update existing code with new items
        const code = existingCode.docs[0] as any
        const existingItems = (code.items || []) as { itemId: string }[]
        const existingItemIds = existingItems.map((i) => i.itemId)

        // Add new items that aren't already in the code
        const newItems = itemIds
          .filter((id) => !existingItemIds.includes(id))
          .map((id) => ({ itemId: id }))

        if (newItems.length > 0) {
          await payload.update({
            collection: 'delivery-codes' as any,
            id: code.id,
            data: {
              items: [...existingItems, ...newItems],
            } as any,
          })

          payload.logger.info(
            `Updated delivery code ${code.code} for order ${doc.id} - added ${newItems.length} item(s)`,
          )
        }
      } else {
        // Create new delivery code
        const newCode = await generateUniqueDeliveryCode(payload)
        await payload.create({
          collection: 'delivery-codes' as any,
          data: {
            code: newCode,
            order: doc.id,
            seller: sellerId,
            buyer: buyerId,
            items: itemIds.map((id) => ({ itemId: id })),
          } as any,
        })

        payload.logger.info(
          `Created delivery code ${newCode} for order ${doc.id}, seller ${sellerId} - ${itemIds.length} item(s)`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error creating delivery code: ${error}`)
  }

  return doc
}
