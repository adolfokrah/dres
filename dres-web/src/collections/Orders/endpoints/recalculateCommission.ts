import type { PayloadHandler } from 'payload'
import { calculateCommissionForOrder } from '../hooks/calculateCommissionForOrder'

/**
 * POST /api/orders/:id/recalculate-commission
 * Manually recalculate commission for an order (admin only)
 */
export const recalculateCommission: PayloadHandler = async (req) => {
  const { payload, user, routeParams } = req

  if (!user || user.role !== 'admin') {
    return Response.json(
      { error: 'Admin access required' },
      { status: 403 }
    )
  }

  const orderId = routeParams?.id as string

  if (!orderId) {
    return Response.json(
      { error: 'Order ID is required' },
      { status: 400 }
    )
  }

  try {
    await calculateCommissionForOrder(payload, orderId)

    // Fetch updated order
    const order = await payload.findByID({
      collection: 'orders',
      id: orderId,
      depth: 0,
    })

    return Response.json({
      success: true,
      commissionBreakdown: order?.commissionBreakdown || null,
    })
  } catch (error: any) {
    payload.logger.error(`Error recalculating commission: ${error}`)
    return Response.json(
      { error: 'Failed to recalculate commission' },
      { status: 500 }
    )
  }
}
