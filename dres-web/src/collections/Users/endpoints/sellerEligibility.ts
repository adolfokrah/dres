import type { PayloadHandler } from 'payload'

/**
 * GET /api/users/seller-eligibility
 * 
 * Checks if the current user meets all requirements to sell on the platform.
 * 
 * Requirements:
 * 1. Shop name set
 * 2. Phone number set
 * 3. Profile photo uploaded
 * 4. Withdrawal account configured (accountNumber + bank)
 * 5. At least one shipping rate set up
 */
export const getSellerEligibility: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Authentication required' }, { status: 401 })
  }

  try {
    // Fetch user with full details
    const fullUser = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 1,
    })

    if (!fullUser) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch shipping rates count for this user
    const shippingRatesResult = await payload.find({
      collection: 'shippingRates',
      where: {
        user: { equals: user.id },
      },
      limit: 1,
      depth: 0,
    })

    // Check each requirement
    const requirements = {
      shopName: {
        complete: Boolean(fullUser.shopName && fullUser.shopName.trim().length > 0),
        value: fullUser.shopName || null,
        message: 'Add a shop name to your profile',
      },
      phoneNumber: {
        complete: Boolean(fullUser.phone && fullUser.phone.trim().length > 0),
        value: fullUser.phone || null,
        message: 'Add a phone number for customer inquiries',
      },
      photo: {
        complete: Boolean(fullUser.photo),
        url: fullUser.photo && typeof fullUser.photo === 'object' ? fullUser.photo.url : null,
        message: 'Upload a profile photo',
      },
      withdrawalAccount: {
        complete: Boolean(
          fullUser.withdrawalAccount?.accountNumber &&
          fullUser.withdrawalAccount?.bank &&
          fullUser.withdrawalAccount?.accountName
        ),
        details: fullUser.withdrawalAccount ? {
          accountName: fullUser.withdrawalAccount.accountName || null,
          accountNumber: fullUser.withdrawalAccount.accountNumber 
            ? `****${fullUser.withdrawalAccount.accountNumber.slice(-4)}`
            : null,
          bank: fullUser.withdrawalAccount.bank || null,
        } : null,
        message: 'Set up a withdrawal account to receive payments',
      },
      shippingRates: {
        complete: shippingRatesResult.totalDocs > 0,
        count: shippingRatesResult.totalDocs,
        message: 'Add at least one shipping rate',
      },
    }

    // Calculate overall eligibility
    const completedCount = Object.values(requirements).filter(r => r.complete).length
    const totalCount = Object.keys(requirements).length
    const canSell = completedCount === totalCount

    return Response.json({
      canSell,
      requirements,
      completedCount,
      totalCount,
      progress: Math.round((completedCount / totalCount) * 100),
    })
  } catch (error) {
    payload.logger.error(`Error checking seller eligibility: ${error}`)
    return Response.json(
      { error: 'Failed to check seller eligibility' },
      { status: 500 }
    )
  }
}

/**
 * Helper function to check seller eligibility (for use in hooks)
 * Returns { canSell: boolean, missingRequirements: string[] }
 */
export async function checkSellerEligibility(
  payload: any,
  userId: string
): Promise<{ canSell: boolean; missingRequirements: string[] }> {
  const fullUser = await payload.findByID({
    collection: 'users',
    id: userId,
    depth: 0,
  })

  if (!fullUser) {
    return { canSell: false, missingRequirements: ['User not found'] }
  }

  const shippingRatesResult = await payload.find({
    collection: 'shippingRates',
    where: { user: { equals: userId } },
    limit: 1,
    depth: 0,
  })

  const missingRequirements: string[] = []

  if (!fullUser.shopName?.trim()) {
    missingRequirements.push('Shop name')
  }
  if (!fullUser.phone?.trim()) {
    missingRequirements.push('Phone number')
  }
  if (!fullUser.photo) {
    missingRequirements.push('Profile photo')
  }
  if (
    !fullUser.withdrawalAccount?.accountNumber ||
    !fullUser.withdrawalAccount?.bank ||
    !fullUser.withdrawalAccount?.accountName
  ) {
    missingRequirements.push('Withdrawal account')
  }
  if (shippingRatesResult.totalDocs === 0) {
    missingRequirements.push('Shipping rates')
  }

  return {
    canSell: missingRequirements.length === 0,
    missingRequirements,
  }
}
