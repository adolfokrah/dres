import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

// Points redemption configuration
// 100 points = 1 GHS (base currency)
// When redeeming in other currencies, we convert based on exchange rate

/**
 * Validates and calculates points redemption for the cart
 * - Checks if user has enough points
 * - Calculates pointsDiscount based on cart's currency
 * - Limits redemption to subtotal (can't make cart negative)
 * 
 * Points are stored in GHS equivalent, so when redeeming:
 * - If cart is in GHS: 100 points = 1 GHS discount
 * - If cart is in USD (1 USD = 15 GHS): 100 points = 0.067 USD discount (1/15)
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
    // 100 points = 1 GHS, so divide points by 100 first, then by exchange rate
    // E.g., 1000 points = 10 GHS, if USD rate is 15: 10/15 = 0.67 USD discount
    const pointsInGHS = pointsToRedeem / 100 // Convert points to GHS value
    let pointsDiscount = pointsInGHS / exchangeRateToGHS

    // Can't redeem more than remaining subtotal after discount code
    if (pointsDiscount > maxRedeemableAmount) {
      pointsDiscount = maxRedeemableAmount
      // Adjust points to redeem (convert back to points)
      data.pointsToRedeem = Math.floor(pointsDiscount * exchangeRateToGHS * 100)
    }

    data.pointsDiscount = Math.round(pointsDiscount * 100) / 100

    payload.logger.info(
      `Points redemption applied: ${data.pointsToRedeem} points (${pointsInGHS} GHS) = ${data.pointsDiscount} discount (rate: ${exchangeRateToGHS})`,
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
