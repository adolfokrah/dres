import type { PayloadHandler } from 'payload'

/**
 * POST /api/delivery-codes/confirm
 * Public endpoint for USSD gateway to confirm delivery
 * Body: { code: "123456" }
 */
export const confirmDelivery: PayloadHandler = async (req) => {
  const { payload } = req

  // Parse request body
  let body: { code?: string }
  try {
    body = (await req.json?.()) ?? {}
  } catch {
    return Response.json({ success: false, message: 'Invalid request body' }, { status: 400 })
  }

  const { code } = body

  if (!code || code.length !== 4) {
    return Response.json(
      { success: false, message: 'Invalid delivery code. Please enter a 4-digit code.' },
      { status: 400 },
    )
  }

  try {
    // Find the delivery code (all existing codes are active - they're deleted after use)
    const deliveryCodeResult = await payload.find({
      collection: 'delivery-codes' as any,
      where: {
        code: { equals: code },
      },
      limit: 1,
      depth: 1,
    })

    if (deliveryCodeResult.docs.length === 0) {
      return Response.json(
        { success: false, message: 'Invalid or expired delivery code.' },
        { status: 404 },
      )
    }

    const deliveryCode = deliveryCodeResult.docs[0] as any

    // Check if expired
    if (deliveryCode.expiresAt && new Date(deliveryCode.expiresAt) < new Date()) {
      // Delete expired code
      await payload.delete({
        collection: 'delivery-codes' as any,
        id: deliveryCode.id,
      })
      return Response.json({ success: false, message: 'Delivery code has expired.' }, { status: 400 })
    }

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
      note: `Delivery confirmed via code ${code}`,
    }

    let deliveredCount = 0
    const updatedItems = items.map((item: any) => {
      // Only update items that belong to this seller and are covered by this code
      const itemSellerId = typeof item.seller === 'object' ? item.seller.id : item.seller

      if (
        itemSellerId === sellerId &&
        coveredItemIds.includes(item.id) &&
        item.shippingStatus === 'out_for_delivery'
      ) {
        deliveredCount++
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

    // Delete the delivery code to free it up for reuse
    await payload.delete({
      collection: 'delivery-codes' as any,
      id: deliveryCode.id,
    })

    payload.logger.info(
      `Delivery confirmed via code ${code} - ${deliveredCount} items delivered for order ${orderId}. Code deleted.`,
    )

    return Response.json({
      success: true,
      message: `Delivery confirmed! ${deliveredCount} item(s) marked as delivered.`,
      deliveredCount,
      orderId,
    })
  } catch (error) {
    payload.logger.error(`Error confirming delivery: ${error}`)
    return Response.json(
      { success: false, message: 'Failed to confirm delivery. Please try again.' },
      { status: 500 },
    )
  }
}
