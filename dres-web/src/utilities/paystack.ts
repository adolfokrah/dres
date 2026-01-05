/**
 * Paystack Payment Utility
 * 
 * Handles payment initialization and verification with Paystack API
 * Docs: https://paystack.com/docs/payments/accept-payments/
 */

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

interface PaystackInitializeResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    id: number
    domain: string
    status: 'success' | 'failed' | 'abandoned' | 'pending'
    reference: string
    amount: number
    message: string | null
    gateway_response: string
    paid_at: string | null
    created_at: string
    channel: string
    currency: string
    ip_address: string
    metadata: Record<string, unknown>
    fees: number | null
    customer: {
      id: number
      first_name: string | null
      last_name: string | null
      email: string
      customer_code: string
      phone: string | null
    }
    authorization?: {
      authorization_code: string
      bin: string
      last4: string
      exp_month: string
      exp_year: string
      channel: string
      card_type: string
      bank: string
      country_code: string
      brand: string
      reusable: boolean
      signature: string
      account_name: string | null
    }
  }
}

interface InitializePaymentParams {
  email: string
  /** Amount in the smallest currency unit (pesewas for GHS, kobo for NGN) */
  amount: number
  /** Unique reference for the transaction (e.g., orderId) */
  reference: string
  /** Currency code (e.g., 'GHS', 'NGN') */
  currency?: string
  /** URL to redirect to after payment */
  callbackUrl?: string
  /** Additional metadata to attach to the transaction */
  metadata?: Record<string, unknown>
}

interface PaystackError {
  status: boolean
  message: string
}

/**
 * Initialize a payment and get a payment link
 * 
 * @param params - Payment initialization parameters
 * @returns Payment authorization URL and reference
 * 
 * @example
 * ```ts
 * const result = await initializePayment({
 *   email: 'customer@example.com',
 *   amount: 10000, // 100.00 GHS (amount in pesewas)
 *   currency: 'GHS',
 *   metadata: { orderId: 'ORD-123' }
 * })
 * // result.data.authorization_url -> redirect user here
 * ```
 */
export async function initializePayment(params: InitializePaymentParams): Promise<{
  success: boolean
  data?: PaystackInitializeResponse['data']
  error?: string
}> {
  if (!PAYSTACK_SECRET_KEY) {
    return {
      success: false,
      error: 'Paystack secret key is not configured',
    }
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        currency: params.currency || 'GHS',
        callback_url: params.callbackUrl,
        metadata: params.metadata,
      }),
    })

    const result = await response.json() as PaystackInitializeResponse | PaystackError

    if (!result.status) {
      return {
        success: false,
        error: result.message || 'Failed to initialize payment',
      }
    }

    return {
      success: true,
      data: (result as PaystackInitializeResponse).data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Verify a payment by reference
 * 
 * @param reference - The payment reference to verify
 * @returns Payment verification result
 * 
 * @example
 * ```ts
 * const result = await verifyPayment('ref_123456')
 * if (result.success && result.data?.status === 'success') {
 *   // Payment was successful
 * }
 * ```
 */
export async function verifyPayment(reference: string): Promise<{
  success: boolean
  data?: PaystackVerifyResponse['data']
  error?: string
}> {
  if (!PAYSTACK_SECRET_KEY) {
    return {
      success: false,
      error: 'Paystack secret key is not configured',
    }
  }

  if (!reference) {
    return {
      success: false,
      error: 'Payment reference is required',
    }
  }

  try {
    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json() as PaystackVerifyResponse | PaystackError

    if (!result.status) {
      return {
        success: false,
        error: result.message || 'Failed to verify payment',
      }
    }

    return {
      success: true,
      data: (result as PaystackVerifyResponse).data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Convert amount to smallest currency unit (pesewas/kobo)
 * Paystack expects amounts in the smallest currency unit
 * 
 * @param amount - Amount in major currency unit (e.g., 100.00 GHS)
 * @returns Amount in smallest unit (e.g., 10000 pesewas)
 */
export function toSmallestUnit(amount: number): number {
  return Math.round(amount * 100)
}

/**
 * Convert amount from smallest currency unit to major unit
 * 
 * @param amount - Amount in smallest unit (e.g., 10000 pesewas)
 * @returns Amount in major currency unit (e.g., 100.00 GHS)
 */
export function fromSmallestUnit(amount: number): number {
  return amount / 100
}

// =============================================================================
// Bank & Account Verification
// Docs: https://paystack.com/docs/identity-verification/verify-account-number/
// =============================================================================

interface PaystackBank {
  id: number
  name: string
  slug: string
  code: string
  longcode: string
  gateway: string | null
  pay_with_bank: boolean
  supports_transfer: boolean
  active: boolean
  country: string
  currency: string
  type: string
  is_deleted: boolean
}

interface PaystackBankListResponse {
  status: boolean
  message: string
  data: PaystackBank[]
}

interface PaystackResolveAccountResponse {
  status: boolean
  message: string
  data: {
    account_number: string
    account_name: string
    bank_id: number
  }
}

/**
 * Get list of banks for a specific country
 * 
 * @param country - Country code (e.g., 'ghana', 'nigeria')
 * @param currency - Currency code (e.g., 'GHS', 'NGN')
 * @returns List of banks
 * 
 * @example
 * ```ts
 * const result = await getBanks('ghana', 'GHS')
 * if (result.success) {
 *   // result.data contains array of banks
 *   console.log(result.data)
 * }
 * ```
 */
export async function getBanks(country: string = 'ghana', currency: string = 'GHS'): Promise<{
  success: boolean
  data?: PaystackBank[]
  error?: string
}> {
  if (!PAYSTACK_SECRET_KEY) {
    return {
      success: false,
      error: 'Paystack secret key is not configured',
    }
  }

  try {
    const params = new URLSearchParams({
      country,
      currency,
      use_cursor: 'false',
      perPage: '100',
    })

    const response = await fetch(`${PAYSTACK_BASE_URL}/bank?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json() as PaystackBankListResponse | PaystackError

    if (!result.status) {
      return {
        success: false,
        error: result.message || 'Failed to fetch banks',
      }
    }

    return {
      success: true,
      data: (result as PaystackBankListResponse).data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Resolve/Verify a bank account number
 * Get the account name associated with an account number
 * 
 * **IMPORTANT: This endpoint requires a LIVE secret key.**
 * Test keys will return "Invalid key" error.
 * Available for: Nigeria, Ghana
 * 
 * @param accountNumber - The bank account number to verify
 * @param bankCode - The bank code from getBanks()
 * @returns Account details including account name
 * 
 * @example
 * ```ts
 * // First get the bank code from getBanks()
 * const banks = await getBanks('ghana', 'GHS')
 * const bankCode = banks.data?.find(b => b.name === 'Access Bank')?.code
 * 
 * // Then resolve the account
 * const result = await resolveAccountNumber('1234567890', bankCode)
 * if (result.success) {
 *   console.log(result.data.account_name) // "JOHN DOE"
 * }
 * ```
 */
export async function resolveAccountNumber(accountNumber: string, bankCode: string): Promise<{
  success: boolean
  data?: PaystackResolveAccountResponse['data']
  error?: string
}> {
  if (!PAYSTACK_SECRET_KEY) {
    return {
      success: false,
      error: 'Paystack secret key is not configured',
    }
  }

  if (!accountNumber || !bankCode) {
    return {
      success: false,
      error: 'Account number and bank code are required',
    }
  }

  // Return mock data for test keys (Paystack resolve endpoint only works with live keys)
  const isTestKey = PAYSTACK_SECRET_KEY.startsWith('sk_test_')
  if (isTestKey) {
    return {
      success: true,
      data: {
        account_number: accountNumber,
        account_name: 'TEST ACCOUNT HOLDER',
        bank_id: 0,
      },
    }
  }

  try {
    const params = new URLSearchParams({
      account_number: accountNumber,
      bank_code: bankCode,
    })

    const response = await fetch(`${PAYSTACK_BASE_URL}/bank/resolve?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json() as PaystackResolveAccountResponse | PaystackError

    if (!result.status) {
      return {
        success: false,
        error: result.message || 'Failed to resolve account',
      }
    }

    return {
      success: true,
      data: (result as PaystackResolveAccountResponse).data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}
