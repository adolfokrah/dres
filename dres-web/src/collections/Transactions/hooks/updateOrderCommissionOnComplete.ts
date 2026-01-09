import type { CollectionAfterChangeHook } from 'payload'

/**
 * When a transaction is marked as completed and has an order ID,
 * recalculate the commission breakdown for that order
 */
export const updateOrderCommissionOnComplete: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  // Skip if no order linked
  if (!doc.order) return doc

  const payload = req.payload

  // Only trigger when status changes TO completed (not on create if already completed)
  if ( (operation != 'update')) {
    return doc
  }

  const orderId = typeof doc.order === 'object' ? doc.order.id : doc.order

  try {
        await payload.update({
        collection: 'orders',
        id: orderId,
        data: {
          updatedAt: new Date().toISOString(),
        }
      })
  } catch (error) {
    payload.logger.error(`[Commission] Error updating order ${orderId}: ${error}`)
  }

  return doc
}
