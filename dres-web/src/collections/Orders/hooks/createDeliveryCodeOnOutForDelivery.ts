import type { CollectionAfterChangeHook } from 'payload'
import { generateUniqueDeliveryCode } from '@/utilities/generateDeliveryCode'

/**
 * Hook that creates a delivery code when any item in the order is marked as 'out_for_delivery'
 * Creates one code per seller per order (each seller gets their own code for their items)
 */
export const createDeliveryCodeOnOutForDelivery: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Skip if context indicates we should skip hooks
  if (req.context?.skipHooks) return doc
  
  // Only process on update
  if (operation !== 'update') return doc

  const payload = req.payload

  try {
    const currentItems = (doc.items || []) as any[]
    const previousItems = (previousDoc?.items || []) as any[]

    // Group items that just changed to 'out_for_delivery' by seller
    const newOutForDeliveryBySeller: Map<string, any[]> = new Map()

    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i]
      const previousItem = previousItems[i]

      const isNowOutForDelivery = currentItem.shippingStatus === 'out_for_delivery'
      const wasOutForDelivery = previousItem?.shippingStatus === 'out_for_delivery'

      if (isNowOutForDelivery && !wasOutForDelivery) {
        const sellerId = typeof currentItem.seller === 'object' 
          ? currentItem.seller.id 
          : currentItem.seller
        
        if (sellerId) {
          if (!newOutForDeliveryBySeller.has(sellerId)) {
            newOutForDeliveryBySeller.set(sellerId, [])
          }
          newOutForDeliveryBySeller.get(sellerId)!.push(currentItem)
        }
      }
    }

    // If no new out_for_delivery items, return early
    if (newOutForDeliveryBySeller.size === 0) return doc

    // Get buyer ID and phone from shipping details
    const buyerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer
    const shippingPhone = (doc.shippingDetails as any)?.phone || ''

    // Create delivery codes for each seller with new out_for_delivery items
    for (const [sellerId, items] of newOutForDeliveryBySeller) {
      // Check if delivery code already exists for this order + seller
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
        // Code exists, update it to include new items
        const existingCodeDoc = existingCode.docs[0] as any
        const existingItemIds = (existingCodeDoc.items || []).map((i: any) => i.itemId)
        
        const newItems = items
          .filter((item: any) => !existingItemIds.includes(item.id))
          .map((item: any) => ({
            itemId: item.id,
            skuTitle: item.skuTitle || item.title || '',
          }))

        if (newItems.length > 0) {
          await payload.update({
            collection: 'delivery-codes' as any,
            id: existingCodeDoc.id,
            data: {
              items: [...existingCodeDoc.items, ...newItems],
            } as any,
          })
          payload.logger.info(
            `Updated delivery code ${existingCodeDoc.code} for order ${doc.id}, seller ${sellerId} with ${newItems.length} new items`,
          )
        }
      } else {
        // Create new delivery code for this seller
        const newCode = await generateUniqueDeliveryCode(payload)
        const itemsData = items.map((item: any) => ({
          itemId: item.id,
          skuTitle: item.skuTitle || item.title || '',
        }))

        await payload.create({
          collection: 'delivery-codes' as any,
          data: {
            code: newCode,
            order: doc.id,
            seller: sellerId,
            buyer: buyerId,
            phone: shippingPhone,
            items: itemsData,
          } as any,
        })

        payload.logger.info(
          `Created delivery code ${newCode} for order ${doc.id}, seller ${sellerId} with ${items.length} items`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error creating delivery code: ${error}`)
  }

  return doc
}
