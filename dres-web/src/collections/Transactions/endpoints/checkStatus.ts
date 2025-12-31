import { PayloadHandler } from 'payload'

/**
 * GET /api/transactions/check-status?reference=TXN-xxx
 * 
 * Simply checks the transaction status from our database.
 * Does NOT call Paystack API - that's only done by the webhook.
 * 
 * Used by mobile app for polling during payment.
 */
export const checkTransactionStatus: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // Get reference from query params
    const url = new URL(req.url || '', 'http://localhost')
    const reference = url.searchParams.get('reference')

    if (!reference) {
      return Response.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      )
    }

    // Find the transaction by reference (transactionId)
    const transactions = await payload.find({
      collection: 'transactions',
      where: {
        transactionId: { equals: reference },
      },
      limit: 1,
      depth: 1,
    })

    const transaction = transactions.docs[0]

    if (!transaction) {
      return Response.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    // Verify user owns this transaction
    const transactionUserId = typeof transaction.user === 'object' ? transaction.user.id : transaction.user
    if (transactionUserId !== user.id && user.role !== 'admin') {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Get order info
    const orderId = typeof transaction.order === 'object' ? transaction.order.id : transaction.order
    const order = typeof transaction.order === 'object' ? transaction.order : null

    // Return the current status from our database
    return Response.json({
      success: transaction.status === 'completed',
      status: transaction.status, // 'pending', 'completed', 'cancelled'
      message: transaction.status === 'completed' 
        ? 'Payment successful' 
        : transaction.status === 'cancelled'
          ? 'Payment was cancelled or failed'
          : 'Payment is processing',
      order: order ? {
        id: order.id,
        orderId: order.orderId,
        status: order.status,
      } : { id: orderId },
    })

  } catch (error) {
    payload.logger.error(`Error checking transaction status: ${error}`)
    return Response.json(
      {
        success: false,
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
