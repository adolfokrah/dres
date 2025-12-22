import type { CollectionAfterChangeHook } from 'payload'

// Generate unique transaction ID: TXN-YYYYMMDD-XXXXXX-XXXX
const generateTransactionId = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomUUID().split('-')[0].toUpperCase()
  return `TXN-${dateStr}-${timestamp}-${random}`
}

interface OrderItem {
  productTitle: string
  productImage: string
  variationOptions: Record<string, string> | null
  sellerId: string
  sellerName: string
  price: number
  originalPrice: number
  quantity: number
  shippingFee: number
  buyerProtection: boolean
  buyerProtectionFee: number
  shippingStatus: string
}

export const createSellerTransactionOnDelivery: CollectionAfterChangeHook = async ({
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

    // Find items that changed to 'delivered'
    for (let i = 0; i < currentItems.length; i++) {
      const currentItem = currentItems[i]
      const previousItem = previousItems[i]

      // Check if this item just changed to 'delivered'
      if (
        currentItem.shippingStatus === 'delivered' &&
        previousItem?.shippingStatus !== 'delivered' &&
        currentItem.sellerId
      ) {
        // Check if a transaction already exists for this seller + order + product
        const existingTransaction = await payload.find({
          collection: 'transactions',
          where: {
            and: [
              { order: { equals: doc.id } },
              { user: { equals: currentItem.sellerId } },
              // We'll use amount to identify the specific product transaction
              { amount: { equals: currentItem.price * currentItem.quantity } },
            ],
          },
          limit: 1,
        })

        // Skip if transaction already exists
        if (existingTransaction.docs.length > 0) {
          payload.logger.info(
            `Transaction already exists for ${currentItem.productTitle} - skipping`,
          )
          continue
        }

        // Fetch seller details for payment info
        const seller = await payload.findByID({
          collection: 'users',
          id: currentItem.sellerId,
          depth: 0,
        })

        const itemTotal = currentItem.price * currentItem.quantity

        // Get seller's withdrawal account details
        const withdrawalAccount = seller?.withdrawalAccount as {
          accountName?: string
          accountNumber?: string
          bank?: string
        } | undefined

        // Calculate seller payout and platform fees
        // originalPrice is the seller's base price, price is what customer paid (with platform markup)
        const originalPrice = currentItem.originalPrice ?? currentItem.price
        const sellingPrice = currentItem.price * currentItem.quantity
        const sellerPayout = originalPrice * currentItem.quantity
        const fees = (currentItem.price - originalPrice) * currentItem.quantity

        // Calculate paystack fees (1.95% of selling price) + 1 cedi transfer fee
        const paystackFeesAmount = ((1.95 / 100) * sellingPrice) + 1
        // Commission fees = platform fees - paystack fees
        const commissionFees = fees - paystackFeesAmount

        // Create transaction for this seller's delivered item
        // Amount is what the seller receives (original price), fees is the platform cut
        await payload.create({
          collection: 'transactions',
          data: {
            transactionId: generateTransactionId(),
            type: 'transfer',
            status: 'pending',
            user: currentItem.sellerId,
            order: doc.id,
            amount: sellerPayout,
            fees: fees > 0 ? fees : 0,
            paystackFees: Math.round(paystackFeesAmount * 100) / 100,
            commissionFees: Math.round(commissionFees * 100) / 100 > 0 ? Math.round(commissionFees * 100) / 100 : 0,
            billingDetails: {
              accountName:
                withdrawalAccount?.accountName ||
                seller?.shopName ||
                `${seller?.firstName || ''} ${seller?.lastName || ''}`.trim() ||
                '',
              accountNumber: withdrawalAccount?.accountNumber || '',
              bank: withdrawalAccount?.bank || '',
            },
          },
        })

        payload.logger.info(
          `Created seller transaction for delivered item: ${currentItem.productTitle} - Seller: ${currentItem.sellerName}, Payout: ${sellerPayout}, Fees: ${fees}, Commission: ${commissionFees}`,
        )
      }

      // Check if this item just changed to 'returned' - create refund transaction for customer
      if (
        currentItem.shippingStatus === 'returned' &&
        previousItem?.shippingStatus !== 'returned'
      ) {
        // Refund total = selling price (price × qty) + shipping fee + buyer protection fee
        const sellingPriceTotal = currentItem.price * currentItem.quantity
        const shippingFee = currentItem.shippingFee || 0
        const buyerProtectionFee = currentItem.buyerProtectionFee || 0
        const refundTotal = sellingPriceTotal + shippingFee + buyerProtectionFee

        // Check if a refund transaction already exists for this order + product
        const existingRefund = await payload.find({
          collection: 'transactions',
          where: {
            and: [
              { order: { equals: doc.id } },
              { type: { equals: 'refund' } },
              { amount: { equals: refundTotal } },
            ],
          },
          limit: 1,
        })

        // Skip if refund already exists
        if (existingRefund.docs.length > 0) {
          payload.logger.info(
            `Refund transaction already exists for ${currentItem.productTitle} - skipping`,
          )
          continue
        }

        // Get the customer ID from the order
        const customerId = typeof doc.customer === 'object' ? doc.customer.id : doc.customer

        // Find the customer's deposit transaction to get billing details
        const depositTransaction = await payload.find({
          collection: 'transactions',
          where: {
            and: [
              { order: { equals: doc.id } },
              { type: { equals: 'deposit' } },
              { user: { equals: customerId } },
            ],
          },
          limit: 1,
        })

        // Get billing details from the deposit transaction
        const depositBillingDetails = depositTransaction.docs[0]?.billingDetails as {
          accountName?: string
          accountNumber?: string
          bank?: string
        } | undefined

        // Create refund transaction for customer
        await payload.create({
          collection: 'transactions',
          data: {
            transactionId: generateTransactionId(),
            type: 'refund',
            status: 'pending',
            user: customerId,
            order: doc.id,
            amount: refundTotal,
            billingDetails: {
              accountName: depositBillingDetails?.accountName || '',
              accountNumber: depositBillingDetails?.accountNumber || '',
              bank: depositBillingDetails?.bank || '',
            },
          },
        })

        payload.logger.info(
          `Created refund transaction for returned item: ${currentItem.productTitle} - Amount: ${refundTotal} (Product: ${sellingPriceTotal}, Shipping: ${shippingFee}, Protection: ${buyerProtectionFee})`,
        )
      }
    }
  } catch (error) {
    payload.logger.error(`Error creating transaction: ${error}`)
  }

  return doc
}
