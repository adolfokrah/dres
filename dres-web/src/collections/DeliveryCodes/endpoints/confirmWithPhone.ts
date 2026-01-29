import type { PayloadHandler } from 'payload'

/**
 * POST /api/delivery-codes/confirm-with-phone
 * Confirm delivery with phone number and PIN verification (for courier web page)
 * Body: { phone: "0245301631", code: "1234" }
 */
export const confirmWithPhone: PayloadHandler = async (req) => {
  const { payload } = req

  // Parse request body
  let body: { phone?: string; code?: string }
  try {
    body = (await req.json?.()) ?? {}
  } catch {
    return Response.json({ success: false, message: 'Invalid request body' }, { status: 400 })
  }

  const { phone, code } = body

  if (!phone || phone.length < 9) {
    return Response.json(
      { success: false, message: 'Please enter a valid phone number' },
      { status: 400 },
    )
  }

  if (!code || code.length !== 4) {
    return Response.json(
      { success: false, message: 'Please enter a valid 4-digit delivery PIN' },
      { status: 400 },
    )
  }

  // Normalize phone number
  const normalizedPhone = phone.replace(/[\s\-]/g, '').replace(/^\+233/, '0').replace(/^233/, '0')

  try {
    // Find the delivery code by code AND phone
    const deliveryCodeResult = await payload.find({
      collection: 'delivery-codes' as any,
      where: {
        and: [{ code: { equals: code } }, { phone: { contains: normalizedPhone } }],
      },
      limit: 1,
      depth: 1,
    })

    if (deliveryCodeResult.docs.length === 0) {
      return Response.json(
        { success: false, message: 'Invalid phone number or delivery PIN.' },
        { status: 404 },
      )
    }

    const deliveryCode = deliveryCodeResult.docs[0] as any

    // Get the order
    const orderId =
      typeof deliveryCode.order === 'object' ? deliveryCode.order.id : deliveryCode.order
    const sellerId =
      typeof deliveryCode.seller === 'object' ? deliveryCode.seller.id : deliveryCode.seller

    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 1,
    })

    if (!order) {
      return Response.json({ success: false, message: 'Order not found.' }, { status: 404 })
    }

    // Get item IDs from the delivery code
    const coveredItemIds = (deliveryCode.items || []).map((item: any) => item.itemId)

    // Update all covered items to 'delivered'
    const items = order.items as any[]
    const statusLogEntry = {
      status: 'delivered',
      timestamp: new Date().toISOString(),
      note: `Delivery confirmed via web PIN ${code}`,
    }

    let deliveredCount = 0
    const deliveredItems: string[] = []
    const updatedItems = items.map((item: any) => {
      const itemSellerId = typeof item.seller === 'object' ? item.seller.id : item.seller

      if (
        itemSellerId === sellerId &&
        coveredItemIds.includes(item.id) &&
        item.shippingStatus === 'out_for_delivery'
      ) {
        deliveredCount++
        deliveredItems.push(item.variationTitle || item.skuTitle || 'Item')
        return {
          ...item,
          shippingStatus: 'delivered',
          statusLogs: [...(item.statusLogs || []), statusLogEntry],
        }
      }
      return item
    })

    // Calculate new order status
    const allItemStatuses = updatedItems.map((i: any) => i.shippingStatus)
    const completedStatuses = ['delivered', 'returned', 'not_available', 'cancelled']
    let newOrderStatus = order.status

    if (allItemStatuses.every((s: string) => completedStatuses.includes(s))) {
      newOrderStatus = 'completed'
    } else if (allItemStatuses.some((s: string) => s === 'out_for_delivery' || s === 'delivered')) {
      newOrderStatus = 'in_progress'
    }

    // Update the order
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        items: updatedItems,
        status: newOrderStatus,
      },
    })

    // Delete the delivery code
    await payload.delete({
      collection: 'delivery-codes' as any,
      id: deliveryCode.id,
    })

    payload.logger.info(
      `Delivery confirmed via web - ${deliveredCount} items delivered for order ${orderId}`,
    )

    // Get customer info for response
    const customerName = (order.shippingDetails as any)?.fullName || 'Customer'
    const customerPhone = deliveryCode.phone

    return Response.json({
      success: true,
      message: 'Delivery Confirmed',
      order: {
        orderId: order.orderId,
        customerName,
        phone: customerPhone,
        deliveredCount,
        deliveredItems,
      },
    })
  } catch (error) {
    payload.logger.error(`Error confirming delivery with phone: ${error}`)
    return Response.json(
      { success: false, message: 'Failed to confirm delivery. Please try again.' },
      { status: 500 },
    )
  }
}
