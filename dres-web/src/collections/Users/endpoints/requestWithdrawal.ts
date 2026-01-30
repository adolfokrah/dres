import type { PayloadHandler } from 'payload'
import { ObjectId } from 'mongodb'
import { createTransferRecipient, initiateBulkTransfer, toSmallestUnit } from '../../../utilities/paystack'
import { generateTransactionId } from '../../../utilities/generateTransactionId'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || ''
const isTestMode = PAYSTACK_SECRET_KEY.startsWith('sk_test_')

// Mobile money provider bank codes (Paystack Ghana)
const MOBILE_MONEY_BANK_CODES = [
  'MTN', // MTN Mobile Money
  'VOD', // Vodafone Cash
  'ATL', // AirtelTigo Money
  'GMP', // G-Money
  'ZEN', // Zeepay
]

/**
 * Determine if the bank code is for mobile money or traditional bank
 */
function isMobileMoneyProvider(bankCode: string): boolean {
  return MOBILE_MONEY_BANK_CODES.includes(bankCode.toUpperCase())
}

/**
 * POST /api/users/request-withdrawal
 *
 * Initiates a withdrawal of the user's full available balance minus transfer fee.
 * Balance = completed order_payments + completed refunds - (completed + in_progress transfers)
 *
 * Requirements:
 * - User must be authenticated
 * - User must have a withdrawal account set up (with recipientCode)
 * - Balance must be greater than the transfer fee
 */
export const requestWithdrawal: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = user.id

  try {
    // 1. Check withdrawal account exists
    const withdrawalAccount = user.withdrawalAccount as {
      bankCode?: string
      bankName?: string
      accountNumber?: string
      accountName?: string
      recipientCode?: string
    } | undefined

    if (!withdrawalAccount?.accountNumber || !withdrawalAccount?.bankCode) {
      return Response.json(
        { error: 'No withdrawal account set up. Please add your mobile money details first.' },
        { status: 400 }
      )
    }

    // 2. Get withdrawal fee and minimum amount from site settings
    const siteSettings = await payload.findGlobal({ slug: 'site-settings' })
    const minimumWithdrawalAmount = (siteSettings.minimumWithdrawalAmount as number) ?? 5

    // Determine if mobile money or bank transfer
    const isMobileMoney = isMobileMoneyProvider(withdrawalAccount.bankCode)

    // Get user's country ID
    const userCountryId = typeof user.country === 'object' ? user.country?.id : user.country

    // Look up fee for user's country
    let transferFee = isMobileMoney
      ? (siteSettings.defaultMobileMoneyFee ?? 1)
      : (siteSettings.defaultBankTransferFee ?? 5)

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
        transferFee = isMobileMoney ? countryFee.mobileMoneyFee : countryFee.bankTransferFee
      }
    }

    payload.logger.info(`[Withdrawal] Fee for user ${userId}: ${transferFee} (${isMobileMoney ? 'mobile money' : 'bank'})`)

    // 3. Ensure user has a recipient code (create if missing)
    let recipientCode = withdrawalAccount.recipientCode
    if (!recipientCode) {
      payload.logger.info(`[Withdrawal] Creating transfer recipient for user ${userId}`)

      const recipientResult = await createTransferRecipient({
        type: 'mobile_money',
        name: withdrawalAccount.accountName || user.firstName || 'Customer',
        accountNumber: withdrawalAccount.accountNumber,
        bankCode: withdrawalAccount.bankCode,
        currency: 'GHS',
      })

      if (!recipientResult.success || !recipientResult.data?.recipient_code) {
        payload.logger.error(`[Withdrawal] Failed to create recipient: ${recipientResult.error}`)
        return Response.json(
          { error: 'Failed to set up transfer recipient. Please check your withdrawal account details.' },
          { status: 400 }
        )
      }

      recipientCode = recipientResult.data.recipient_code

      // Save recipient code to user
      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          withdrawalAccount: {
            ...withdrawalAccount,
            recipientCode,
          },
        },
      })

      payload.logger.info(`[Withdrawal] Created recipient code ${recipientCode} for user ${userId}`)
    }

    // 3. Calculate available balance using aggregation
    const db = payload.db
    const transactionsCollection = db.collections['transactions']

    // Sum all completed and in_progress transactions for the user
    // Note: pending order_payments are not included until they're completed by the cron job
    // Amounts are already stored as +/- values
    const balanceResult = await transactionsCollection.aggregate([
      {
        $match: {
          user: new ObjectId(userId),
          status: { $in: ['completed', 'in_progress'] },
        },
      },
      {
        $group: {
          _id: null,
          balance: { $sum: '$amount' },
        },
      },
    ])

    // Round to 2 decimal places to avoid floating point precision issues
    const balance = Math.round((balanceResult[0]?.balance || 0) * 100) / 100

    payload.logger.info(`[Withdrawal] User ${userId} available balance: ${balance}, minimumWithdrawalAmount: ${minimumWithdrawalAmount}, check: ${balance} < ${minimumWithdrawalAmount} = ${balance < minimumWithdrawalAmount}`)

    // 5. Validate balance meets minimum withdrawal amount
    // Use <= with small epsilon to handle floating point precision issues
    if (balance < minimumWithdrawalAmount - 0.01) {
      return Response.json(
        { error: `Insufficient balance. Minimum withdrawal is ₵${minimumWithdrawalAmount}.`, balance },
        { status: 400 }
      )
    }

    // 6. Calculate transfer amount (balance minus fee)
    const transferAmount = Math.round((balance - transferFee) * 100) / 100

    // 7. Check for existing in-progress transfer to prevent double-withdrawal
    const existingTransfer = await payload.find({
      collection: 'transactions',
      where: {
        and: [
          { user: { equals: userId } },
          { type: { equals: 'transfer' } },
          { status: { equals: 'in_progress' } },
        ],
      },
      limit: 1,
    })

    if (existingTransfer.docs.length > 0) {
      return Response.json(
        { error: 'You already have a pending withdrawal. Please wait for it to complete.' },
        { status: 400 }
      )
    }

    // 8. Create transfer transaction
    const transactionId = generateTransactionId()

    // In test mode, mark as completed immediately since Paystack doesn't process test transfers
    const transactionStatus = isTestMode ? 'completed' : 'in_progress'

    const transaction = await payload.create({
      collection: 'transactions',
      data: {
        transactionId,
        type: 'transfer',
        status: transactionStatus,
        user: userId,
        amount: -transferAmount, // Negative to deduct from balance
        fees: transferFee,
        paystackFees: transferFee,
        billingDetails: {
          accountName: withdrawalAccount.accountName || '',
          accountNumber: withdrawalAccount.accountNumber || '',
          bank: withdrawalAccount.bankCode || '',
        },
        notes: isTestMode
          ? `[TEST MODE] Manual withdrawal of ₵${transferAmount.toFixed(2)} (balance: ₵${balance.toFixed(2)}, fee: ₵${transferFee})`
          : `Manual withdrawal of ₵${transferAmount.toFixed(2)} (balance: ₵${balance.toFixed(2)}, fee: ₵${transferFee})`,
      },
    })

    payload.logger.info(`[Withdrawal] Created transfer transaction ${transactionId} for ₵${transferAmount} (${isTestMode ? 'TEST MODE' : 'LIVE'})`)

    // 9. In live mode, initiate Paystack transfer
    if (!isTestMode) {
      const transferResult = await initiateBulkTransfer(
        [
          {
            amount: toSmallestUnit(transferAmount),
            recipientCode,
            reference: transactionId,
            reason: `Withdrawal - ${transactionId}`,
          },
        ],
        'GHS'
      )

      if (!transferResult.success) {
        // Mark transaction as cancelled if transfer fails
        await payload.update({
          collection: 'transactions',
          id: transaction.id,
          data: {
            status: 'cancelled',
            notes: `Transfer failed: ${transferResult.error}`,
          },
        })

        payload.logger.error(`[Withdrawal] Transfer failed: ${transferResult.error}`)
        return Response.json(
          { error: 'Transfer failed. Please try again later.' },
          { status: 500 }
        )
      }

      payload.logger.info(`[Withdrawal] Transfer initiated successfully for user ${userId}`)
    } else {
      payload.logger.info(`[Withdrawal] TEST MODE - Skipping Paystack transfer, marked as completed for user ${userId}`)
    }

    return Response.json({
      success: true,
      message: isTestMode
        ? `[TEST] Withdrawal of ₵${transferAmount.toFixed(2)} completed successfully`
        : `Withdrawal of ₵${transferAmount.toFixed(2)} initiated successfully`,
      transactionId,
      amount: transferAmount,
      fee: transferFee,
      previousBalance: balance,
      newBalance: 0,
    })
  } catch (error) {
    payload.logger.error(`[Withdrawal] Error: ${error}`)
    return Response.json(
      { error: 'Failed to process withdrawal request' },
      { status: 500 }
    )
  }
}
