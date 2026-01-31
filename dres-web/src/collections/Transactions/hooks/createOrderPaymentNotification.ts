import type { CollectionAfterChangeHook } from 'payload'
import type { Transaction } from '../../../payload-types'

/**
 * After an order_payment transaction is marked as completed,
 * create a notification for the seller.
 *
 * This notifies sellers when funds from an order become available in their balance.
 */
export const createOrderPaymentNotification: CollectionAfterChangeHook<Transaction> = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  const { payload } = req

  // Only handle order_payment transactions
  if (doc.type !== 'order_payment') return doc

  // Only notify when status changes to completed
  if (operation === 'update') {
    const previousStatus = previousDoc?.status
    const currentStatus = doc.status

    // Check if status actually changed to completed
    if (previousStatus === currentStatus || currentStatus !== 'completed') return doc
  } else {
    // Don't notify on create - order_payments start as pending
    return doc
  }

  // Get user (seller) ID
  const userId = typeof doc.user === 'object' && doc.user ? doc.user.id : doc.user

  if (!userId) {
    payload.logger.error(`[OrderPaymentNotification] No user linked to transaction ${doc.transactionId}`)
    return doc
  }

  // Get transaction amount and currency symbol
  const amount = doc.amount
  const currencyId = typeof doc.currency === 'object' && doc.currency ? doc.currency.id : doc.currency

  let currencySymbol = '₵'
  if (currencyId) {
    try {
      const currency = await payload.findByID({
        collection: 'currencies',
        id: String(currencyId),
        depth: 0,
      })
      currencySymbol = currency?.symbol || '₵'
    } catch {
      // Use default symbol
    }
  }

  // Get order display ID if available
  const orderId = typeof doc.order === 'object' && doc.order ? doc.order.id : doc.order
  let orderDisplayId = ''

  if (orderId) {
    try {
      const order = await payload.findByID({
        collection: 'orders',
        id: String(orderId),
        depth: 0,
      })
      orderDisplayId = order?.orderId || ''
    } catch {
      // Order not found, continue without display ID
    }
  }

  // Create notification for seller
  const orderText = orderDisplayId ? ` for order #${orderDisplayId}` : ''
  await payload.create({
    collection: 'notifications',
    data: {
      user: userId,
      type: 'system',
      message: `${currencySymbol}${amount.toFixed(2)} has been added to your balance${orderText} 🎉`,
      path: `/profile?tab=transactions`,
      read: false,
    },
  })

  payload.logger.info(`[OrderPaymentNotification] Notification sent to seller ${userId} for ${doc.transactionId}`)

  return doc
}
