import type { CollectionAfterChangeHook } from 'payload'

// Points configuration
// Spend 100 GHS → earn 10 points (10% back)
const POINTS_PER_GHS = 0.1 // 0.1 points per 1 GHS spent (10% earning rate)
const POINTS_MULTIPLIER = 1 // Can be increased for promotions

interface OrderItem {
  id?: string
  price: number
  quantity: number
  shippingStatus?: string
}

/**
 * Award points to customer when order items are delivered
 * Points are calculated based on the item price converted to GHS (base currency)
 */
export const awardPointsOnDelivery: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Only process on update
  if (operation !== 'update') return doc

  const payload = req.payload

  try {
    const currentItems = (doc.items || []) as OrderItem[]
    const previousItems = (previousDoc?.items || []) as OrderItem[]
    const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer

    if (!customerId) return doc

    // Get exchange rate for this order's currency
    let exchangeRateToGHS = 1
    const currencyId = typeof doc.currency === 'object' ? doc.currency?.id : doc.currency
    
    if (currencyId) {
      try {
        const currency = await payload.findByID({
          collection: 'currencies',
          id: currencyId,
          depth: 0,
        })
        exchangeRateToGHS = currency?.exchangeRateToGHS || 1
      } catch (error) {
        payload.logger.warn(`Could not fetch currency for points calculation, using rate 1`)
      }
    }

    // Find items that just changed to 'delivered'
    let totalPointsToAward = 0
    const deliveredItems: string[] = []

    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i]
      const previousItem = previousItems[i]

      // Check if this item just changed to 'delivered'
      if (
        currentItem.shippingStatus === 'delivered' &&
        previousItem?.shippingStatus !== 'delivered'
      ) {
        // Calculate points for this item (price * quantity * exchange rate to GHS)
        const itemTotal = currentItem.price * currentItem.quantity
        const itemTotalInGHS = itemTotal * exchangeRateToGHS
        const points = Math.floor(itemTotalInGHS * POINTS_PER_GHS * POINTS_MULTIPLIER)
        totalPointsToAward += points
        deliveredItems.push(currentItem.id || `item-${i}`)
      }
    }

    // Skip if no points to award
    if (totalPointsToAward === 0) return doc

    // Find or create user's points record
    let userPoints = await payload.find({
      collection: 'user-points',
      where: {
        user: { equals: customerId },
      },
      limit: 1,
    })

    if (userPoints.docs.length === 0) {
      // Create new points record for user
      await payload.create({
        collection: 'user-points',
        data: {
          user: customerId,
          balance: totalPointsToAward,
          totalEarned: totalPointsToAward,
          totalRedeemed: 0,
          history: [
            {
              type: 'earned',
              points: totalPointsToAward,
              description: `Earned from order ${doc.orderId}`,
              order: doc.id,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      })

      payload.logger.info(
        `Created points record for user ${customerId} with ${totalPointsToAward} points from order ${doc.orderId}`,
      )
    } else {
      // Update existing points record
      const existingPoints = userPoints.docs[0]
      const currentHistory = (existingPoints.history || []) as Array<{
        type: 'earned' | 'redeemed' | 'expired' | 'adjusted'
        points: number
        description?: string
        order?: string
        createdAt?: string
      }>

      await payload.update({
        collection: 'user-points',
        id: existingPoints.id,
        data: {
          balance: (existingPoints.balance || 0) + totalPointsToAward,
          totalEarned: (existingPoints.totalEarned || 0) + totalPointsToAward,
          history: [
            ...currentHistory,
            {
              type: 'earned' as const,
              points: totalPointsToAward,
              description: `Earned from order ${doc.orderId}`,
              order: doc.id,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      })

      payload.logger.info(
        `Awarded ${totalPointsToAward} points to user ${customerId} for order ${doc.orderId}. New balance: ${(existingPoints.balance || 0) + totalPointsToAward}`,
      )
    }
  } catch (error) {
    payload.logger.error(`Error awarding points: ${error}`)
  }

  return doc
}
