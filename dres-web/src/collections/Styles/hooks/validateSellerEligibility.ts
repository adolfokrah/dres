import type { CollectionBeforeChangeHook } from 'payload'
import { checkSellerEligibility } from '../../Users/endpoints/sellerEligibility'

/**
 * Hook that validates seller eligibility before creating a new style.
 * 
 * Requirements:
 * 1. Shop name set
 * 2. Phone number set
 * 3. Profile photo uploaded
 * 4. Withdrawal account configured
 * 5. At least one shipping rate set up
 */
export const validateSellerEligibility: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
}) => {
  // Only check on create - allow updates to existing styles
  if (operation !== 'create') {
    return data
  }

  const { payload, user } = req

  // Must be authenticated
  if (!user) {
    throw new Error('You must be logged in to create a listing')
  }

  // Admins bypass the check
  if (user.role === 'admin') {
    return data
  }

  // Check seller eligibility
  const eligibility = await checkSellerEligibility(payload, user.id)

  if (!eligibility.canSell) {
    const missing = eligibility.missingRequirements.join(', ')
    throw new Error(
      `You cannot create listings until you complete your seller profile. Missing: ${missing}`
    )
  }

  return data
}
