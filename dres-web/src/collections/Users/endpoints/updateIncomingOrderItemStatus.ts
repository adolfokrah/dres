import type { PayloadHandler } from 'payload'

type ItemStatusAction = 'not_available' | 'out_for_delivery' | 'accept_return'

interface UpdateItemStatusBody {
  action: ItemStatusAction
  itemId: string
}

/**
 * POST /api/users/:id/incoming-orders/:orderId/update-item-status
 * Update the shipping status of an item in an incoming order
 * Note: Delivery code creation is handled by the Orders afterChange hook
 */
export const updateIncomingOrderItemStatus: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req
  const userId = routeParams?.id as string
  const orderId = routeParams?.orderId as string

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!userId) {
    return Response.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (!orderId) {
    return Response.json({ error: 'Order ID is required' }, { status: 400 })
  }

  // Check authorization - users can only update their own incoming orders
  if (user.role !== 'admin' && user.id !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Parse request body
  let body: UpdateItemStatusBody
  try {
    body = await req.json?.() ?? {}
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { action, itemId } = body

  if (!action || !itemId) {
    return Response.json({ error: 'Action and itemId are required' }, { status: 400 })
  }

  const validActions: ItemStatusAction[] = ['not_available', 'out_for_delivery', 'accept_return']
  if (!validActions.includes(action)) {
    return Response.json({ error: 'Invalid action' }, { status: 400 })
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

    // Verify the seller owns this item
    const sellerId = typeof item.seller === 'object' ? item.seller.id : item.seller
    if (user.role !== 'admin' && sellerId !== userId) {
      return Response.json({ error: 'You can only update your own items' }, { status: 403 })
    }

    // Determine the new status based on action
    let newStatus: string
    let statusNote: string

    switch (action) {
      case 'not_available':
        // Can only mark as not available if item is placed or new
        if (!['placed', 'new'].includes(item.shippingStatus)) {
          return Response.json(
            { error: 'Item can only be marked as not available when in placed or new status' },
            { status: 400 },
          )
        }
        newStatus = 'not_available'
        statusNote = 'Item marked as not available by seller'
        break

      case 'out_for_delivery':
        // Can mark as out for delivery if item is placed, new, or not already out for delivery
        if (['out_for_delivery', 'delivered', 'returned', 'cancelled'].includes(item.shippingStatus)) {
          return Response.json(
            { error: 'Item cannot be marked as out for delivery in current status' },
            { status: 400 },
          )
        }
        newStatus = 'out_for_delivery'
        statusNote = 'Item shipped and out for delivery'
        break

      case 'accept_return':
        // Can only accept return if item is in return_in_progress status
        if (item.shippingStatus !== 'return_in_progress') {
          return Response.json(
            { error: 'Item can only have return accepted when in return_in_progress status' },
            { status: 400 },
          )
        }
        newStatus = 'returned'
        statusNote = 'Return accepted by seller'
        break

      default:
        return Response.json({ error: 'Invalid action' }, { status: 400 })
    }

    // Create status log entry
    const statusLogEntry = {
      status: newStatus,
      timestamp: new Date().toISOString(),
      note: statusNote,
    }

    // Update the item's status and add to status logs
    const updatedItems = [...items]
    updatedItems[itemIndex] = {
      ...item,
      shippingStatus: newStatus,
      statusLogs: [...(item.statusLogs || []), statusLogEntry],
    }

    // Calculate new order status based on all items
    const allItemStatuses = updatedItems.map((i: any) => i.shippingStatus)
    let newOrderStatus = order.status

    // If all items are delivered or returned or not_available, order is completed
    const completedStatuses = ['delivered', 'returned', 'not_available', 'cancelled']
    if (allItemStatuses.every((s: string) => completedStatuses.includes(s))) {
      newOrderStatus = 'completed'
    }
    // If any item is out_for_delivery and order is not completed, set to in_progress
    else if (allItemStatuses.some((s: string) => s === 'out_for_delivery')) {
      newOrderStatus = 'in_progress'
    }

    // Update the order - the afterChange hook will handle delivery code creation
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        items: updatedItems,
        status: newOrderStatus,
      },
    })

    return Response.json({
      success: true,
      message: `Item status updated to ${newStatus}`,
      itemId,
      newStatus,
      orderStatus: newOrderStatus,
    })
  } catch (error) {
    console.error('Error updating item status:', error)
    return Response.json({ error: 'Failed to update item status' }, { status: 500 })
  }
}

/**
 * POST /api/users/:id/incoming-orders/:orderId/mark-all-out-for-delivery
 * Mark all eligible items as out for delivery
 * Note: Delivery code creation is handled by the Orders afterChange hook
 */
export const markAllOutForDelivery: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req
  const userId = routeParams?.id as string
  const orderId = routeParams?.orderId as string

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!userId) {
    return Response.json({ error: 'User ID is required' }, { status: 400 })
  }

  if (!orderId) {
    return Response.json({ error: 'Order ID is required' }, { status: 400 })
  }

  // Check authorization
  if (user.role !== 'admin' && user.id !== userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
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

    const items = order.items as any[]
    const statusLogEntry = {
      status: 'out_for_delivery',
      timestamp: new Date().toISOString(),
      note: 'Item shipped and out for delivery',
    }

    // Update all seller's items that can be marked as out for delivery
    const eligibleStatuses = ['placed', 'new']
    let updatedCount = 0

    const updatedItems = items.map((item: any) => {
      const sellerId = typeof item.seller === 'object' ? item.seller.id : item.seller

      // Only update items belonging to this seller and in eligible status
      if (sellerId === userId && eligibleStatuses.includes(item.shippingStatus)) {
        updatedCount++
        return {
          ...item,
          shippingStatus: 'out_for_delivery',
          statusLogs: [...(item.statusLogs || []), statusLogEntry],
        }
      }
      return item
    })

    if (updatedCount === 0) {
      return Response.json({ error: 'No eligible items to update' }, { status: 400 })
    }

    // Calculate new order status
    const allItemStatuses = updatedItems.map((i: any) => i.shippingStatus)
    let newOrderStatus = order.status

    const completedStatuses = ['delivered', 'returned', 'not_available', 'cancelled']
    if (allItemStatuses.every((s: string) => completedStatuses.includes(s))) {
      newOrderStatus = 'completed'
    } else if (allItemStatuses.some((s: string) => s === 'out_for_delivery')) {
      newOrderStatus = 'in_progress'
    }

    // Update the order - the afterChange hook will handle delivery code creation
    await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        items: updatedItems,
        status: newOrderStatus,
      },
    })

    return Response.json({
      success: true,
      message: `${updatedCount} item(s) marked as out for delivery`,
      updatedCount,
      orderStatus: newOrderStatus,
    })
  } catch (error) {
    console.error('Error marking all items as out for delivery:', error)
    return Response.json({ error: 'Failed to update items' }, { status: 500 })
  }
}
