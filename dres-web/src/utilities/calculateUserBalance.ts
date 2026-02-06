import type { BasePayload } from 'payload'

/**
 * Calculate a user's available balance in GHS.
 *
 * Sums all completed and in_progress transactions for the user.
 * Excludes boost_payment (paid separately via Paystack) and pending order_payments
 * (not available until completed by cron job).
 *
 * Amounts are stored as +/- values so the sum gives the net balance.
 */
export async function calculateUserBalance(
  payload: BasePayload,
  userId: string,
): Promise<number> {
  const balanceTxns = await payload.find({
    collection: 'transactions',
    where: {
      user: { equals: userId },
      status: { in: ['completed', 'in_progress'] },
      type: { in: ['order_payment', 'transfer', 'refund', 'return_charge', 'deposit'] },
    },
    limit: 0,
  })

  const balanceInGHS = balanceTxns.docs.reduce((sum: number, txn: any) => {
    return sum + (txn.amount || 0)
  }, 0)

  return Math.round(balanceInGHS * 100) / 100
}
