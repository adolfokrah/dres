import type { PayloadHandler } from 'payload'

interface TransactionItem {
  id: string
  transactionId: string
  type: 'order_payment' | 'transfer' | 'refund' | 'return_charge'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  amount: number
  fees: number
  orderId: string
  orderDisplayId: string
  createdAt: string
}

interface UserTransactionsResponse {
  totalEarned: number // Total from order_payment transactions
  upcomingPayments: number // Total from completed + pending transactions
  transactions: TransactionItem[]
  totalDocs: number
  totalPages: number
  page: number
  limit: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/**
 * GET /api/transactions/user-transactions
 * Fetch user's transactions (excludes deposits)
 * 
 * Query params:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10)
 * - type: Filter by transaction type (optional)
 * - status: Filter by status (optional)
 */
export const getUserTransactions: PayloadHandler = async (req) => {
  const { payload, user } = req
  const url = new URL(req.url || '', 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || '1', 10)
  const limit = parseInt(url.searchParams.get('limit') || '10', 10)
  const typeFilter = url.searchParams.get('type')
  const statusFilter = url.searchParams.get('status')

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Build query - exclude deposits, filter by user
    const where: any = {
      user: { equals: user.id },
      type: { not_equals: 'deposit' }, // Exclude deposits
    }

    // Apply type filter if provided
    if (typeFilter && typeFilter !== 'all') {
      where.type = { equals: typeFilter }
    }

    // Apply status filter if provided
    if (statusFilter && statusFilter !== 'all') {
      where.status = { equals: statusFilter }
    }

    // Fetch paginated transactions
    const transactionsResult = await payload.find({
      collection: 'transactions',
      where,
      sort: '-createdAt',
      page,
      limit,
      depth: 1,
    })

    // Transform transactions
    const transactions: TransactionItem[] = transactionsResult.docs.map((txn: any) => {
      const order = txn.order
      return {
        id: txn.id,
        transactionId: txn.transactionId,
        type: txn.type,
        status: txn.status,
        amount: txn.amount || 0,
        fees: txn.fees || 0,
        orderId: typeof order === 'object' ? order.id : order,
        orderDisplayId: typeof order === 'object' ? order.orderId : '',
        createdAt: txn.createdAt,
      }
    })

    // Calculate total earned (sum of all order_payment transactions for this user)
    const orderPaymentTxns = await payload.find({
      collection: 'transactions',
      where: {
        user: { equals: user.id },
        type: { equals: 'order_payment' },
      },
      limit: 0, // Get all for aggregation
    })

    const totalEarned = orderPaymentTxns.docs.reduce((sum: number, txn: any) => {
      return sum + (txn.amount || 0)
    }, 0)

    // Calculate upcoming payments (sum of completed + pending transactions, excluding deposits)
    const upcomingTxns = await payload.find({
      collection: 'transactions',
      where: {
        user: { equals: user.id },
        type: { not_equals: 'deposit' },
        status: { in: ['completed', 'pending'] },
      },
      limit: 0, // Get all for aggregation
    })

    const upcomingPayments = upcomingTxns.docs.reduce((sum: number, txn: any) => {
      return sum + (txn.amount || 0)
    }, 0)

    const response: UserTransactionsResponse = {
      totalEarned: Math.round(totalEarned * 100) / 100,
      upcomingPayments: Math.round(upcomingPayments * 100) / 100,
      transactions,
      totalDocs: transactionsResult.totalDocs ?? transactions.length,
      totalPages: transactionsResult.totalPages ?? 1,
      page: transactionsResult.page ?? page,
      limit,
      hasNextPage: transactionsResult.hasNextPage ?? false,
      hasPrevPage: transactionsResult.hasPrevPage ?? page > 1,
    }

    return Response.json(response)
  } catch (error: any) {
    payload.logger.error(`Error fetching user transactions: ${error}`)
    return Response.json(
      {
        error: 'Failed to fetch transactions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
