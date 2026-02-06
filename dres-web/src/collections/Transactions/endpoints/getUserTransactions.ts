import type { PayloadHandler } from 'payload'
import { calculateUserBalance } from '../../../utilities/calculateUserBalance'

// Mobile money provider bank codes (Paystack Ghana)
const MOBILE_MONEY_BANK_CODES = ['MTN', 'VOD', 'ATL', 'GMP', 'ZEN']

function isMobileMoneyProvider(bankCode: string): boolean {
  return MOBILE_MONEY_BANK_CODES.includes(bankCode.toUpperCase())
}

interface TransactionItem {
  id: string
  transactionId: string
  type: 'order_payment' | 'transfer' | 'refund' | 'return_charge'
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  amount: number
  fees: number
  orderId: string | null
  orderDisplayId: string | null
  currencySymbol: string
  createdAt: string
}

interface UserTransactionsResponse {
  totalEarned: number // Total from order_payment transactions (converted to user's currency)
  availableBalance: number // Withdrawable balance: order_payments + refunds - transfers (converted to user's currency)
  withdrawalFee: number // Transfer fee that will be deducted on withdrawal (in user's currency)
  minimumWithdrawalAmount: number // Minimum balance required to withdraw (in user's currency)
  hasWithdrawalAccount: boolean // Whether user has set up a withdrawal account
  currencySymbol: string // User's currency symbol for displaying totals
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
 * Fetch user's transactions that are linked to orders (excludes deposits and standalone transactions)
 * Amounts are stored in GHS (base currency) and converted to user's currency
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

  // Get user's currency for conversion
  let userCurrencySymbol = '₵'
  let userExchangeRate = 1 // Default to GHS (no conversion)

  const userCountry = user.country
  if (userCountry && typeof userCountry === 'object' && userCountry.currency) {
    const currency = userCountry.currency
    if (typeof currency === 'object') {
      userCurrencySymbol = currency.symbol || '₵'
      userExchangeRate = currency.exchangeRateToGHS || 1
    }
  }

  // Helper to convert GHS amount to user's currency
  const convertToUserCurrency = (amountInGHS: number): number => {
    if (userExchangeRate === 1) return amountInGHS
    return amountInGHS / userExchangeRate
  }

  try {
    // Build query - fetch order_payment, transfer, and refund transactions
    const where: any = {
      user: { equals: user.id },
      or: [
        { type: { equals: 'order_payment' }, order: { exists: true } }, // Order payments linked to an order
        { type: { equals: 'transfer' } }, // Transfer transactions (withdrawals)
        { type: { equals: 'refund' } }, // Refund transactions (buyer refunds)
      ],
    }

    // Apply type filter if provided
    if (typeFilter && typeFilter !== 'all') {
      if (typeFilter === 'order_payment') {
        delete where.or
        where.type = { equals: 'order_payment' }
        where.order = { exists: true }
      } else if (typeFilter === 'transfer') {
        delete where.or
        where.type = { equals: 'transfer' }
      } else if (typeFilter === 'refund') {
        delete where.or
        where.type = { equals: 'refund' }
      }
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
      depth: 2, // Depth 2 to get currency and order.currency populated
    })

    // Transform transactions - convert amounts to user's currency
    const transactions: TransactionItem[] = transactionsResult.docs.map((txn: any) => {
      const order = txn.order
      const amountInGHS = txn.amount || 0
      const feesInGHS = txn.fees || 0

      return {
        id: txn.id,
        transactionId: txn.transactionId,
        type: txn.type,
        status: txn.status,
        amount: Math.round(convertToUserCurrency(amountInGHS) * 100) / 100,
        fees: Math.round(convertToUserCurrency(feesInGHS) * 100) / 100,
        orderId: order ? (typeof order === 'object' ? order.id : order) : null,
        orderDisplayId: order ? (typeof order === 'object' ? order.orderId : '') : null,
        currencySymbol: userCurrencySymbol,
        createdAt: txn.createdAt,
      }
    })

    // Calculate total earned (sum of all completed order_payment transactions linked to orders for this user)
    const orderPaymentTxns = await payload.find({
      collection: 'transactions',
      where: {
        user: { equals: user.id },
        type: { equals: 'order_payment' },
        status: { equals: 'completed' }, // Only completed transactions
        order: { exists: true }, // Only transactions linked to an order
      },
      limit: 0, // Get all for aggregation
    })

    const totalEarnedInGHS = orderPaymentTxns.docs.reduce((sum: number, txn: any) => {
      return sum + (txn.amount || 0)
    }, 0)

    // Calculate available balance
    const availableBalanceInGHS = await calculateUserBalance(payload, user.id)

    // Check if user has a withdrawal account set up
    const withdrawalAccount = user.withdrawalAccount as {
      bankCode?: string
      accountNumber?: string
    } | undefined
    const hasWithdrawalAccount = !!(withdrawalAccount?.accountNumber && withdrawalAccount?.bankCode)

    // Get site settings for fees and minimum withdrawal
    const siteSettings = await payload.findGlobal({ slug: 'site-settings' })
    const minimumWithdrawalAmountInGHS = (siteSettings.minimumWithdrawalAmount as number) ?? 5

    // Calculate withdrawal fee based on user's country and payment method
    let withdrawalFeeInGHS = 1 // Default fee

    if (hasWithdrawalAccount) {
      try {
        const isMobileMoney = isMobileMoneyProvider(withdrawalAccount.bankCode || '')
        const userCountryId = typeof user.country === 'object' ? user.country?.id : user.country

        // Start with default fee
        withdrawalFeeInGHS = isMobileMoney
          ? (siteSettings.defaultMobileMoneyFee ?? 1)
          : (siteSettings.defaultBankTransferFee ?? 5)

        // Look up country-specific fee
        const withdrawalFees = (siteSettings.withdrawalFees || []) as Array<{
          country: string | { id: string }
          mobileMoneyFee: number
          bankTransferFee: number
        }>

        if (userCountryId) {
          const countryFee = withdrawalFees.find(fee => {
            const feeCountryId = typeof fee.country === 'object' ? fee.country?.id : fee.country
            return feeCountryId === userCountryId
          })

          if (countryFee) {
            withdrawalFeeInGHS = isMobileMoney ? countryFee.mobileMoneyFee : countryFee.bankTransferFee
          }
        }
      } catch {
        // Use default fee if site settings lookup fails
        withdrawalFeeInGHS = 1
      }
    }

    const response: UserTransactionsResponse = {
      totalEarned: Math.round(convertToUserCurrency(totalEarnedInGHS) * 100) / 100,
      availableBalance: Math.round(convertToUserCurrency(availableBalanceInGHS) * 100) / 100,
      withdrawalFee: Math.round(convertToUserCurrency(withdrawalFeeInGHS) * 100) / 100,
      minimumWithdrawalAmount: Math.round(convertToUserCurrency(minimumWithdrawalAmountInGHS) * 100) / 100,
      hasWithdrawalAccount,
      currencySymbol: userCurrencySymbol,
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
