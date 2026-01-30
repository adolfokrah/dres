import type { CollectionAfterChangeHook } from 'payload'
import { renderOrderPlacedEmail } from '../../../emails'
import type { OrderPlacedEmailProps, OrderItem, ShippingDetails } from '../../../emails'

/**
 * Send order confirmation email to customer when order is placed
 */
export const sendOrderConfirmationEmail: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
  operation,
}) => {
  // Skip if context indicates we should skip hooks
  if (req.context?.skipHooks) return doc

  const payload = req.payload

  // Only trigger when status changes TO 'placed'
  const previousStatus = previousDoc?.status
  const newStatus = doc.status

  // Check if this is a new 'placed' order or status changed to 'placed'
  const isNewPlacedOrder = operation === 'create' && newStatus === 'placed'
  const statusChangedToPlaced =
    operation === 'update' && newStatus === 'placed' && previousStatus !== 'placed'

  if (!isNewPlacedOrder && !statusChangedToPlaced) {
    return doc
  }

  // Skip in test environment
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) return doc

  payload.logger.info(`📧 Order ${doc.orderId} placed - sending confirmation email`)

  try {
    // Get customer email
    const customer =
      typeof doc.customer === 'object' ? doc.customer : await payload.findByID({
        collection: 'users',
        id: doc.customer,
        depth: 0,
      })

    if (!customer?.email) {
      payload.logger.warn(`No email found for customer on order ${doc.orderId}`)
      return doc
    }

    // Get currency symbol
    const currency = typeof doc.currency === 'object'
      ? doc.currency
      : doc.currency
        ? await payload.findByID({
            collection: 'currencies',
            id: doc.currency,
            depth: 0,
          })
        : null
    const currencySymbol = (currency as any)?.symbol || '₵'

    // Build order items for email
    const items: OrderItem[] = (doc.items || []).map((item: any) => ({
      id: item.id || '',
      variationTitle: item.variationTitle || 'Item',
      variationImage: item.variationImage || null,
      skuTitle: item.skuTitle || null,
      price: item.price || 0,
      quantity: item.quantity || 1,
      shippingFee: item.shippingFee || 0,
      buyerProtectionFee: item.buyerProtectionFee || 0,
    }))

    // Build shipping details
    const shippingDetails: ShippingDetails = {
      fullName: doc.shippingDetails?.fullName || null,
      phone: doc.shippingDetails?.phone || null,
      address: doc.shippingDetails?.address || null,
      city: doc.shippingDetails?.city || null,
      region: doc.shippingDetails?.region || null,
      postalCode: doc.shippingDetails?.postalCode || null,
      country: doc.shippingDetails?.country || null,
    }

    // Calculate totals
    const totalShipping = items.reduce((sum, item) => sum + item.shippingFee, 0)
    const totalBuyerProtection = items.reduce(
      (sum, item) => sum + (item.buyerProtectionFee || 0),
      0,
    )

    // Build email props
    const emailProps: OrderPlacedEmailProps = {
      customerName: customer.firstName || customer.email.split('@')[0] || 'Customer',
      id: doc.id,
      orderId: doc.orderId,
      orderDate: doc.placedAt
        ? new Date(doc.placedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          }),
      items,
      shippingDetails,
      subtotal: doc.subtotal || 0,
      totalShipping,
      totalBuyerProtection,
      discountAmount: doc.discountAmount || 0,
      discountCode: doc.discountCodeUsed || null,
      pointsRedeemed: doc.pointsRedeemed || 0,
      pointsValue: doc.pointsDiscount || 0,
      grandTotal: doc.grandTotal || 0,
      currencySymbol,
    }

    // Render and send email
    const html = await renderOrderPlacedEmail(emailProps)

    await payload.sendEmail({
      to: customer.email,
      subject: `Order Confirmation - ${doc.orderId}`,
      html,
    })

    payload.logger.info(`📧 Order confirmation email sent to ${customer.email} for order ${doc.orderId}`)
  } catch (error) {
    // Don't fail order placement if email fails
    payload.logger.error(
      `Failed to send order confirmation email for order ${doc.orderId}: ${error}`,
    )
  }

  return doc
}
