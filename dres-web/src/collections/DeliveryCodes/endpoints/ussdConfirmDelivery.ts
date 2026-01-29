import type { PayloadHandler } from 'payload'

/**
 * POST /api/delivery-codes/ussd
 * UZO USSD endpoint for delivery confirmation
 *
 * Flow:
 * 1. User dials code → "Enter customer phone number"
 * 2. User enters phone → "Enter delivery PIN"
 * 3. User enters PIN → "Delivery Confirmed" or error
 */

// Simple in-memory session store (for production, use Redis)
const sessions: Map<string, { phone?: string; step: number }> = new Map()

// Clean up old sessions every 5 minutes
setInterval(() => {
  sessions.clear()
}, 5 * 60 * 1000)

interface UssdRequest {
  ussdString: string
  msisdn: string
  ussdServiceOp: number | string
  sessionID: string
  network?: string
  code?: string
  country?: string
}

interface UssdResponse {
  message: string
  ussdServiceOp: number // 2 = continue, 17 = end
}

export const ussdConfirmDelivery: PayloadHandler = async (req) => {
  const { payload } = req

  // Parse USSD request
  let body: UssdRequest
  try {
    body = (await req.json?.()) ?? {}
  } catch {
    return Response.json({ message: 'Invalid request', ussdServiceOp: 17 })
  }

  const { ussdString, ussdServiceOp, sessionID } = body

  // Convert ussdServiceOp to string for consistent comparison
  const serviceOp = String(ussdServiceOp)

  // Get or create session
  let session = sessions.get(sessionID) || { step: 0 }

  // Handle based on operation type
  if (serviceOp === '1') {
    // Initiating request - show first menu
    session = { step: 1 }
    sessions.set(sessionID, session)

    return Response.json({
      message: 'DRES Delivery Confirmation\n\nEnter customer phone number:',
      ussdServiceOp: 2, // Continue - wait for input
    } as UssdResponse)
  }

  if (serviceOp === '18') {
    // Continuing request - process user input
    const input = ussdString.trim()

    if (session.step === 1) {
      // Step 1: User entered phone number
      const phone = input.replace(/[\s\-]/g, '').replace(/^\+233/, '0').replace(/^233/, '0')

      if (phone.length < 9) {
        return Response.json({
          message: 'Invalid phone number.\n\nEnter customer phone number:',
          ussdServiceOp: 2,
        } as UssdResponse)
      }

      // Check if there are pending deliveries for this phone
      const deliveryCodes = await payload.find({
        collection: 'delivery-codes' as any,
        where: { phone: { contains: phone } },
        limit: 1,
      })

      if (deliveryCodes.docs.length === 0) {
        sessions.delete(sessionID)
        return Response.json({
          message: 'No pending deliveries found for this phone number.',
          ussdServiceOp: 17, // End session
        } as UssdResponse)
      }

      // Save phone and move to step 2
      session.phone = phone
      session.step = 2
      sessions.set(sessionID, session)

      return Response.json({
        message: 'Enter delivery PIN:',
        ussdServiceOp: 2,
      } as UssdResponse)
    }

    if (session.step === 2 && session.phone) {
      // Step 2: User entered PIN
      const pin = input.trim()

      if (pin.length !== 4) {
        return Response.json({
          message: 'Invalid PIN. Enter 4-digit delivery PIN:',
          ussdServiceOp: 2,
        } as UssdResponse)
      }

      // Find delivery code matching phone AND pin
      const deliveryCodeResult = await payload.find({
        collection: 'delivery-codes' as any,
        where: {
          and: [
            { code: { equals: pin } },
            { phone: { contains: session.phone } },
          ],
        },
        limit: 1,
        depth: 1,
      })

      if (deliveryCodeResult.docs.length === 0) {
        sessions.delete(sessionID)
        return Response.json({
          message: 'Invalid PIN. Delivery not confirmed.',
          ussdServiceOp: 17,
        } as UssdResponse)
      }

      const deliveryCode = deliveryCodeResult.docs[0] as any

      // Get order and confirm delivery
      const orderId = typeof deliveryCode.order === 'object' ? deliveryCode.order.id : deliveryCode.order
      const sellerId = typeof deliveryCode.seller === 'object' ? deliveryCode.seller.id : deliveryCode.seller

      const order = await payload.findByID({
        collection: 'orders',
        id: orderId,
        depth: 1,
      })

      if (!order) {
        sessions.delete(sessionID)
        return Response.json({
          message: 'Order not found.',
          ussdServiceOp: 17,
        } as UssdResponse)
      }

      // Update items to delivered
      const coveredItemIds = (deliveryCode.items || []).map((item: any) => item.itemId)
      const items = order.items as any[]
      const statusLogEntry = {
        status: 'delivered',
        timestamp: new Date().toISOString(),
        note: `Delivery confirmed via USSD PIN ${pin}`,
      }

      let deliveredCount = 0
      const updatedItems = items.map((item: any) => {
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
      const allStatuses = updatedItems.map((i: any) => i.shippingStatus)
      const completedStatuses = ['delivered', 'returned', 'not_available', 'cancelled']
      let newStatus = order.status
      if (allStatuses.every((s: string) => completedStatuses.includes(s))) {
        newStatus = 'completed'
      } else if (allStatuses.some((s: string) => s === 'out_for_delivery' || s === 'delivered')) {
        newStatus = 'in_progress'
      }

      // Update order
      await payload.update({
        collection: 'orders',
        id: orderId,
        data: { items: updatedItems, status: newStatus },
      })

      // Delete delivery code
      await payload.delete({
        collection: 'delivery-codes' as any,
        id: deliveryCode.id,
      })

      // Clean up session
      sessions.delete(sessionID)

      // Get customer info
      const customerName = (order.shippingDetails as any)?.fullName || 'Customer'
      const customerPhone = deliveryCode.phone

      payload.logger.info(`USSD Delivery confirmed: Order ${order.orderId}, ${deliveredCount} items`)

      return Response.json({
        message: `Delivery Confirmed!\n\nOrder: ${order.orderId}\nCustomer: ${customerName}\nPhone: ${customerPhone}\n\n${deliveredCount} item(s) delivered.`,
        ussdServiceOp: 17, // End session
      } as UssdResponse)
    }
  }

  // Unknown state - end session
  payload.logger.warn(`USSD: Unknown state - sessionID=${sessionID}, serviceOp=${serviceOp}, session.step=${session.step}, session.phone=${session.phone}`)
  sessions.delete(sessionID)
  return Response.json({
    message: 'Session expired. Please try again.',
    ussdServiceOp: 17,
  } as UssdResponse)
}
