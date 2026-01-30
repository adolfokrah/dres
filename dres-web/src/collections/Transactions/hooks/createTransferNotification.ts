import type { CollectionAfterChangeHook } from 'payload'
import type { Transaction } from '../../../payload-types'

/**
 * After a transfer transaction is marked as completed or cancelled,
 * create a notification for the user.
 *
 * Handles both:
 * - Create operations (test mode - transaction created as completed)
 * - Update operations (live mode - webhook updates status)
 */
export const createTransferNotification: CollectionAfterChangeHook<Transaction> = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  const { payload } = req

  // Only handle transfer transactions
  if (doc.type !== 'transfer') return doc

  const currentStatus = doc.status

  // For create operations, only notify if created as completed (test mode)
  // For update operations, only notify if status changed to completed/cancelled
  if (operation === 'create') {
    // Only notify on create if status is completed (test mode scenario)
    if (currentStatus !== 'completed') return doc
  } else if (operation === 'update') {
    // Check if status actually changed
    const previousStatus = previousDoc?.status
    if (previousStatus === currentStatus) return doc
    // Only notify for completed or cancelled status changes
    if (currentStatus !== 'completed' && currentStatus !== 'cancelled') return doc
  } else {
    return doc
  }

  // Get user ID
  const userId = typeof doc.user === 'object' && doc.user ? doc.user.id : doc.user

  if (!userId) {
    payload.logger.error(`[TransferNotification] No user linked to transaction ${doc.transactionId}`)
    return doc
  }

  // Get transaction amount and currency symbol
  const amount = Math.abs(doc.amount) // Transfers are stored as negative amounts
  const currencyId = typeof doc.currency === 'object' && doc.currency ? doc.currency.id : doc.currency

  let currencySymbol = '₵'
  if (currencyId) {
    try {
      const currency = await payload.findByID({
        collection: 'currencies',
        id: currencyId,
        depth: 0,
      })
      currencySymbol = currency?.symbol || '₵'
    } catch {
      // Use default symbol
    }
  }

  // Create notification based on status
  if (currentStatus === 'completed') {
    await payload.create({
      collection: 'notifications',
      data: {
        user: userId,
        type: 'system',
        message: `An amount of ${currencySymbol}${amount.toFixed(2)} has been transferred to your withdrawal account 💰`,
        path: `/profile?tab=transactions`,
        read: false,
      },
    })

    payload.logger.info(`[TransferNotification] Success notification sent to user ${userId} for ${doc.transactionId}`)
  } else if (currentStatus === 'cancelled') {
    await payload.create({
      collection: 'notifications',
      data: {
        user: userId,
        type: 'system',
        message: `Your withdrawal transfer failed. Please contact support or update your withdrawal account details.`,
        path: `/profile?tab=transactions`,
        read: false,
      },
    })

    payload.logger.info(`[TransferNotification] Failed notification sent to user ${userId} for ${doc.transactionId}`)
  }

  return doc
}
