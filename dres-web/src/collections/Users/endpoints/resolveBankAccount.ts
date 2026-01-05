import type { Endpoint } from 'payload'
import { getBanks, resolveAccountNumber } from '../../../utilities/paystack'
import { User } from '../../../payload-types'

/**
 * Get list of banks for a country
 * GET /api/users/banks?country=ghana&currency=GHS
 */
export const getBanksEndpoint: Endpoint = {
  path: '/banks',
  method: 'get',
  handler: async (req) => {
    try {
      const country = (req.query?.country as string) || 'ghana'
      const currency = (req.query?.currency as string) || 'GHS'

      const result = await getBanks(country, currency)

      if (!result.success) {
        return Response.json(
          { error: result.error },
          { status: 400 }
        )
      }

      // Return simplified bank list
      const banks = result.data?.map(bank => ({
        id: bank.id,
        name: bank.name,
        code: bank.code,
        type: bank.type,
        currency: bank.currency,
        country: bank.country,
        supportsTransfer: bank.supports_transfer,
      })) || []

      return Response.json({
        success: true,
        data: banks,
      })
    } catch (error) {
      console.error('Error fetching banks:', error)
      return Response.json(
        { error: 'Failed to fetch banks' },
        { status: 500 }
      )
    }
  },
}

/**
 * Resolve a bank account number to get the account holder's name
 * GET /api/users/resolve-account?account_number=1234567890&bank_code=058
 * 
 * NOTE: This endpoint requires a LIVE Paystack key to work.
 * Test keys will return an error.
 */
export const resolveAccountEndpoint: Endpoint = {
  path: '/resolve-account',
  method: 'get',
  handler: async (req) => {
    try {
      const accountNumber = req.query?.account_number as string
      const bankCode = req.query?.bank_code as string

      if (!accountNumber || !bankCode) {
        return Response.json(
          { error: 'account_number and bank_code are required' },
          { status: 400 }
        )
      }

      const result = await resolveAccountNumber(accountNumber, bankCode)

      if (!result.success) {
        return Response.json(
          { 
            error: result.error,
            // Provide helpful message for test key error
            hint: result.error?.includes('Invalid key') 
              ? 'Account resolution requires a LIVE Paystack key. Test keys cannot access real bank account data.'
              : undefined
          },
          { status: 400 }
        )
      }

      return Response.json({
        success: true,
        data: {
          accountNumber: result.data?.account_number,
          accountName: result.data?.account_name,
          bankId: result.data?.bank_id,
        },
      })
    } catch (error) {
      console.error('Error resolving account:', error)
      return Response.json(
        { error: 'Failed to resolve account' },
        { status: 500 }
      )
    }
  },
}

/**
 * Save withdrawal account details for the authenticated user
 * POST /api/users/withdrawal-account
 * Body: { bankCode, bankName, accountNumber, accountName }
 */
export const saveWithdrawalAccountEndpoint: Endpoint = {
  path: '/withdrawal-account',
  method: 'post',
  handler: async (req) => {
    try {
      // Check if user is authenticated
      const user = req.user as User | undefined
      if (!user) {
        return Response.json(
          { error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Parse request body
      const body = await req.json?.() as {
        bankCode?: string
        bankName?: string
        accountNumber?: string
        accountName?: string
      } | undefined

      if (!body) {
        return Response.json(
          { error: 'Request body is required' },
          { status: 400 }
        )
      }

      const { bankCode, bankName, accountNumber, accountName } = body

      if (!bankCode || !bankName || !accountNumber || !accountName) {
        return Response.json(
          { error: 'bankCode, bankName, accountNumber, and accountName are required' },
          { status: 400 }
        )
      }

      // Update user's withdrawal account
      await req.payload.update({
        collection: 'users',
        id: user.id,
        data: {
          withdrawalAccount: {
            bank: bankName,
            accountNumber: accountNumber,
            accountName: accountName,
          },
        },
      })

      return Response.json({
        success: true,
        message: 'Withdrawal account saved successfully',
      })
    } catch (error) {
      console.error('Error saving withdrawal account:', error)
      return Response.json(
        { error: 'Failed to save withdrawal account' },
        { status: 500 }
      )
    }
  },
}
