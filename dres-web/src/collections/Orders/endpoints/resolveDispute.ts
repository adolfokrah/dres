import type { PayloadHandler } from 'payload'

type DisputeResolution = 'refund_buyer' | 'release_to_seller'

interface ResolveDisputeBody {
  itemId: string
  resolution: DisputeResolution
  adminNote?: string
}

/**
 * POST /api/orders/:id/resolve-dispute
 * Admin only - Resolve a disputed item
 * - refund_buyer: Mark item as returned and process refund
 * - release_to_seller: Mark item as delivered and release payment to seller
 */
export const resolveDispute: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req
  const orderId = routeParams?.id as string

  // Only admins can resolve disputes
  if (!user || user.role !== 'admin') {
    return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 })
  }

  if (!orderId) {
    return Response.json({ error: 'Order ID is required' }, { status: 400 })
  }

  // Parse request body
  let body: ResolveDisputeBody
  try {
    body = await req.json?.() ?? {}
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { itemId, resolution, adminNote } = body

  if (!itemId || !resolution) {
    return Response.json({ error: 'itemId and resolution are required' }, { status: 400 })
  }

  const validResolutions: DisputeResolution[] = ['refund_buyer', 'release_to_seller']
  if (!validResolutions.includes(resolution)) {
    return Response.json({ error: 'Invalid resolution. Must be refund_buyer or release_to_seller' }, { status: 400 })
  }

  try {
    // Fetch the order
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 1,
    })

    if (!order) {
      return Response.json({ error: 'Order not found' }, { status: 404 })
    }

    // Find the item in the order
    const items = order.items as any[]
    const itemIndex = items.findIndex((item: any) => item.id === itemId)

    if (itemIndex === -1) {
      return Response.json({ error: 'Item not found in order' }, { status: 404 })
    }

    const item = items[itemIndex]

    // Can only resolve disputed items
    if (item.shippingStatus !== 'disputed') {
      return Response.json(
        { error: 'Can only resolve items in disputed status' },
        { status: 400 },
      )
    }

    // Determine new status based on resolution
    let newStatus: string
    let statusNote: string

    if (resolution === 'refund_buyer') {
      newStatus = 'returned'
      statusNote = `Dispute resolved by admin: Refund issued to buyer${adminNote ? `. Note: ${adminNote}` : ''}`
    } else {
      newStatus = 'delivered'
      statusNote = `Dispute resolved by admin: Payment released to seller${adminNote ? `. Note: ${adminNote}` : ''}`
    }

    // Create status log entry
    const statusLogEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: statusNote,
      resolvedBy: user.id,
    }

    // Update the item's status
    const updatedItems = [...items]
    updatedItems[itemIndex] = {
      ...item,
      shippingStatus: newStatus,
      disputeResolution: resolution,
      disputeResolvedAt: new Date().toISOString(),
      disputeResolvedBy: user.id,
      statusLogs: [...(item.statusLogs || []), statusLogEntry],
    }

    // Calculate new order status
    const allItemStatuses = updatedItems.map((i: any) => i.shippingStatus)
    let newOrderStatus = order.status

    const completedStatuses = ['delivered', 'returned', 'not_available', 'cancelled']
    if (allItemStatuses.every((s: string) => completedStatuses.includes(s))) {
      newOrderStatus = 'completed'
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

    // TODO: Send notification to buyer and seller about dispute resolution

    return Response.json({
      success: true,
      message: `Dispute resolved: ${resolution === 'refund_buyer' ? 'Buyer refunded' : 'Payment released to seller'}`,
      itemId,
      newStatus,
      orderStatus: newOrderStatus,
    })
  } catch (error) {
    console.error('Error resolving dispute:', error)
    return Response.json({ error: 'Failed to resolve dispute' }, { status: 500 })
  }
}
