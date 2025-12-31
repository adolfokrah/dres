import type { PayloadHandler } from 'payload'

/**
 * POST /api/orders/:id/return-item
 * Request a return for an order item
 * Body: { itemId: string, reason: string, returnImage: string (media ID) }
 */
export const returnItem: PayloadHandler = async (req) => {
  const { payload, routeParams, user } = req
  const orderId = routeParams?.id as string

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!orderId) {
    return Response.json({ error: 'Order ID is required' }, { status: 400 })
  }

  // Parse request body
  let body: { itemId?: string; reason?: string; returnImage?: string }
  try {
    body = await req.json?.() || {}
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { itemId, reason, returnImage } = body

  if (!itemId) {
    return Response.json({ error: 'Item ID is required' }, { status: 400 })
  }

  if (!reason) {
    return Response.json({ error: 'Return reason is required' }, { status: 400 })
  }

  // Validate reason
  const validReasons = ['wrong_item', 'fake_item', 'damaged', 'not_as_described']
  if (!validReasons.includes(reason)) {
    return Response.json({ error: 'Invalid return reason' }, { status: 400 })
  }

  try {
    // Get the order
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if user owns this order
    const customerId = typeof order.customer === 'object' ? order.customer.id : order.customer
    if (customerId !== user.id && user.role !== 'admin') {
      return Response.json({ error: 'Not authorized to return this item' }, { status: 403 })
    }

    // Find the item in the order
    const items = order.items as Array<{
      id: string
      shippingStatus: string
      statusLogs?: Array<{ status: string; timestamp: string }>
      returnReason?: string
      returnImage?: string
    }>

    const itemIndex = items.findIndex((item) => item.id === itemId)
    if (itemIndex === -1) {
      return Response.json({ error: 'Item not found in order' }, { status: 404 })
    }

    const item = items[itemIndex]

    // Check if item is delivered
    if (item.shippingStatus !== 'delivered') {
      return Response.json({ error: 'Only delivered items can be returned' }, { status: 400 })
    }

    // Check if return window is still open (6 hours from delivery)
    const deliveredLog = item.statusLogs?.find((log) => log.status === 'delivered')
    if (deliveredLog) {
      const deliveredAt = new Date(deliveredLog.timestamp)
      const now = new Date()
      const hoursSinceDelivery = (now.getTime() - deliveredAt.getTime()) / (1000 * 60 * 60)
      
      if (hoursSinceDelivery > 6) {
        return Response.json({ 
          error: 'Return window has expired. Items can only be returned within 6 hours of delivery.' 
        }, { status: 400 })
      }
    }

    // Update the item status to return_in_progress
    items[itemIndex] = {
      ...item,
      shippingStatus: 'return_in_progress' as const,
      returnReason: reason,
      returnImage: returnImage || item.returnImage,
    }

    // Update the order
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        items: items as unknown as typeof order.items,
      },
    })

    // Log the return request
    payload.logger.info(`Return requested for order ${orderId}, item ${itemId}, reason: ${reason}`)

    return Response.json({ 
      success: true,
      message: 'Return request submitted successfully',
    })
  } catch (error) {
    console.error('Error processing return request:', error)
    return Response.json({ error: 'Failed to process return request' }, { status: 500 })
  }
}
