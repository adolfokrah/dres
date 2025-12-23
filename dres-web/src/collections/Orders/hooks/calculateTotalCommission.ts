import type { CollectionBeforeChangeHook } from 'payload'

interface OrderItem {
  buyerProtectionFee?: number
  shippingFee?: number
  shippingStatus?: string
}

export const calculateTotalCommission: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const payload = req.payload

  try {
    const items = (data?.items || []) as OrderItem[]
    const orderId = originalDoc?.id
    const discountAmount = data?.discountAmount || 0

    // Sum up buyer protection fees from all items
    const totalBuyerProtection = items.reduce((sum, item) => {
      return sum + (item.buyerProtectionFee || 0)
    }, 0)

    // Sum up shipping fees for returned items (we lose this)
    const returnedShippingFees = items.reduce((sum, item) => {
      if (item.shippingStatus === 'returned') {
        return sum + (item.shippingFee || 0)
      }
      return sum
    }, 0)

    // Get commission fees from transactions for this order
    let totalCommissionFees = 0

    if (orderId) {
      const transactions = await payload.find({
        collection: 'transactions',
        where: {
          and: [
            { order: { equals: orderId } },
            { type: { equals: 'transfer' } },
          ],
        },
        limit: 100,
      })

      totalCommissionFees = transactions.docs.reduce((sum, tx) => {
        return sum + ((tx.commissionFees as number) || 0)
      }, 0)
    }

    // Calculate total commission
    // = Buyer Protection Fees + Commission Fees - Returned Shipping Fees - Discount Amount
    const totalCommission = totalBuyerProtection + totalCommissionFees - returnedShippingFees - discountAmount

    data.totalCommission = Math.round(Math.max(0, totalCommission) * 100) / 100

    payload.logger.info(
      `Order commission calculated: Buyer Protection: ${totalBuyerProtection}, Commission Fees: ${totalCommissionFees}, Returned Shipping: ${returnedShippingFees}, Discount: ${discountAmount}, Total: ${data.totalCommission}`,
    )
  } catch (error) {
    payload.logger.error(`Error calculating total commission: ${error}`)
  }

  return data
}
