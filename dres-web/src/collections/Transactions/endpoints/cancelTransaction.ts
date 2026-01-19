import { PayloadHandler } from 'payload'

/**
 * POST /api/transactions/cancel
 *
 * Cancels a pending transaction and its linked order (if any).
 * Called when user closes the payment screen without completing payment.
 *
 * Body: { reference: string }
 */
export const cancelTransaction: PayloadHandler = async (req) => {
  const { payload, user } = req

  // Require authenticated user
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json?.() as { reference?: string } | undefined
    const reference = body?.reference

    if (!reference) {
      return Response.json({ error: 'Reference is required' }, { status: 400 })
    }

    payload.logger.info(`[CancelTransaction] Cancelling transaction ${reference} for user ${user.id}`)

    // Find the transaction by reference
    const transactions = await payload.find({
      collection: 'transactions',
      where: {
        transactionId: { equals: reference },
      },
      limit: 1,
      depth: 0, // We only need the IDs, not populated objects
    })

    const transaction = transactions.docs[0]

    if (!transaction) {
      payload.logger.error(`[CancelTransaction] Transaction not found: ${reference}`)
      return Response.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify the transaction belongs to this user (or user is admin)
    const transactionUserId = typeof transaction.user === 'object' ? transaction.user?.id : transaction.user
    if (transactionUserId !== user.id && user.role !== 'admin') {
      payload.logger.error(`[CancelTransaction] Unauthorized: user ${user.id} trying to cancel transaction belonging to ${transactionUserId}`)
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Only cancel if still pending
    if (transaction.status !== 'pending') {
      payload.logger.info(`[CancelTransaction] Transaction ${reference} already ${transaction.status}, skipping`)
      return Response.json({
        success: true,
        message: `Transaction already ${transaction.status}`,
        transaction: {
          id: transaction.id,
          status: transaction.status,
        },
      })
    }

    // Update transaction status to cancelled
    await payload.update({
      collection: 'transactions',
      id: transaction.id,
      data: {
        status: 'cancelled',
        notes: 'Payment cancelled by user',
      },
    })

    payload.logger.info(`[CancelTransaction] Transaction ${reference} marked as cancelled`)

    // If there's a linked order, cancel it too
    // order can be a string ID or a populated object
    const orderId = typeof transaction.order === 'object' && transaction.order !== null
      ? (transaction.order as { id: string }).id
      : (transaction.order as string | null | undefined)

    payload.logger.info(`[CancelTransaction] Order ID from transaction: ${orderId}, type: ${typeof transaction.order}`)

    if (orderId) {
      // Get the order to check its status
      const order = await payload.findByID({
        collection: 'orders',
        id: orderId,
      })

      payload.logger.info(`[CancelTransaction] Order ${orderId} current status: ${order?.status}`)

      // Only cancel if order is still awaiting payment ('new' status)
      if (order && order.status === 'new') {
        await payload.update({
          collection: 'orders',
          id: orderId,
          data: {
            status: 'cancelled',
          },
        })

        payload.logger.info(`[CancelTransaction] Order ${orderId} marked as cancelled`)
      } else if (order) {
        payload.logger.info(`[CancelTransaction] Order ${orderId} not cancelled - status is '${order.status}', not 'new'`)
      } else {
        payload.logger.warn(`[CancelTransaction] Order ${orderId} not found`)
      }
    } else {
      payload.logger.info(`[CancelTransaction] No linked order to cancel`)
    }

    return Response.json({
      success: true,
      message: 'Transaction cancelled',
      transaction: {
        id: transaction.id,
        status: 'cancelled',
      },
      ...(orderId && { orderId }),
    })

  } catch (error) {
    payload.logger.error(`[CancelTransaction] Error: ${error}`)
    return Response.json(
      { error: 'Failed to cancel transaction' },
      { status: 500 }
    )
  }
}
