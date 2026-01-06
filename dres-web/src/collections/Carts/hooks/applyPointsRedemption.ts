import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

// Default redemption rate (used if site-settings not available)
const DEFAULT_REDEMPTION_RATE = 1 // 1 point = 1 GHS

interface SiteSettings {
  pointsRedemptionRate?: number
  pointsEnabled?: boolean
}

/**
 * Validates and calculates points redemption for the cart
 * - Checks if user has enough points
 * - Calculates pointsDiscount based on cart's currency
 * - Limits redemption to subtotal (can't make cart negative)
 * 
 * Points value is configured in site-settings (pointsRedemptionRate)
 * Default: 1 point = 1 GHS
 * When redeeming in other currencies, we convert based on exchange rate
 */
export const applyPointsRedemption: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
}) => {
  const payload = req.payload

  // Get customer ID
  const customerId = data?.customer
    ? typeof data.customer === 'object'
      ? data.customer.id
      : data.customer
    : originalDoc?.customer
      ? typeof originalDoc.customer === 'object'
        ? originalDoc.customer.id
        : originalDoc.customer
      : null

  if (!customerId) {
    // Only update if values are different
    if (originalDoc?.pointsToRedeem !== 0) {
      data.pointsToRedeem = 0
    }
    if (originalDoc?.pointsDiscount !== 0) {
      data.pointsDiscount = 0
    }
    return data
  }

  const pointsToRedeem = data?.pointsToRedeem || 0

  // If no points to redeem, reset discount (only if changed)
  if (!pointsToRedeem || pointsToRedeem <= 0) {
    if (originalDoc?.pointsToRedeem !== 0) {
      data.pointsToRedeem = 0
    }
    if (originalDoc?.pointsDiscount !== 0) {
      data.pointsDiscount = 0
    }
    return data
  }

  try {
    // Get points configuration from site-settings
    let redemptionRate = DEFAULT_REDEMPTION_RATE
    let pointsEnabled = true

    try {
      const siteSettings = await payload.findGlobal({
        slug: 'site-settings',
      }) as SiteSettings

      redemptionRate = siteSettings?.pointsRedemptionRate ?? DEFAULT_REDEMPTION_RATE
      pointsEnabled = siteSettings?.pointsEnabled ?? true
    } catch (_error) {
      payload.logger.warn('Could not fetch site-settings for points configuration, using defaults')
    }

    // If points system is disabled, don't allow redemption
    if (!pointsEnabled) {
      data.pointsToRedeem = 0
      data.pointsDiscount = 0
      return data
    }

    // Get exchange rate for this cart's currency
    let exchangeRateToGHS = 1
    const currencyId = data?.currency
      ? typeof data.currency === 'object'
        ? data.currency.id
        : data.currency
      : originalDoc?.currency
        ? typeof originalDoc.currency === 'object'
          ? originalDoc.currency.id
          : originalDoc.currency
        : null

    if (currencyId) {
      try {
        const currency = await payload.findByID({
          collection: 'currencies',
          id: currencyId,
          depth: 0,
        })
        exchangeRateToGHS = currency?.exchangeRateToGHS || 1
      } catch (error) {
        payload.logger.warn(`Could not fetch currency for points redemption, using rate 1`)
      }
    }

    // Get user's points balance
    const userPoints = await payload.find({
      collection: 'user-points',
      where: {
        user: { equals: customerId },
      },
      limit: 1,
    })

    const availablePoints = userPoints.docs[0]?.balance || 0

    // Check if user has enough points
    if (pointsToRedeem > availablePoints) {
      throw new APIError(
        `Insufficient points. You have ${availablePoints} points available.`,
        400,
      )
    }

    // Calculate subtotal to limit points redemption
    const subtotal = data?.subtotal || originalDoc?.subtotal || 0
    const discountAmount = data?.discountAmount || originalDoc?.discountAmount || 0
    const maxRedeemableAmount = Math.max(0, subtotal - discountAmount)

    // Calculate points discount in cart's currency
    // pointsToRedeem * redemptionRate = GHS value, then convert to cart currency
    // E.g., 10 points * 1 GHS/point = 10 GHS, if USD rate is 15: 10/15 = 0.67 USD discount
    const pointsInGHS = pointsToRedeem * redemptionRate
    let pointsDiscount = pointsInGHS / exchangeRateToGHS

    // Can't redeem more than remaining subtotal after discount code
    if (pointsDiscount > maxRedeemableAmount) {
      pointsDiscount = maxRedeemableAmount
      // Adjust points to redeem (convert back to points)
      data.pointsToRedeem = Math.floor((pointsDiscount * exchangeRateToGHS) / redemptionRate)
    }

    data.pointsDiscount = Math.round(pointsDiscount * 100) / 100

    payload.logger.info(
      `Points redemption applied: ${data.pointsToRedeem} points (${pointsInGHS} GHS) = ${data.pointsDiscount} discount (rate: ${exchangeRateToGHS}, redemptionRate: ${redemptionRate})`,
    )
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    payload.logger.error(`Error applying points redemption: ${error}`)
    data.pointsToRedeem = 0
    data.pointsDiscount = 0
  }

  return data
}
