import type { PayloadHandler } from 'payload'

export const subscribe: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json(
      { error: 'Unauthorized', message: 'You must be logged in to subscribe' },
      { status: 401 }
    )
  }

  try {
    const body = await req.json?.()
    const { skuId } = body || {}

    if (!skuId) {
      return Response.json(
        { error: 'Bad Request', message: 'skuId is required' },
        { status: 400 }
      )
    }

    // Verify SKU exists
    const sku = await payload.findByID({
      collection: 'skus',
      id: skuId,
    })

    if (!sku) {
      return Response.json(
        { error: 'Not Found', message: 'SKU not found' },
        { status: 404 }
      )
    }

    // Check if already subscribed
    const existing = await payload.find({
      collection: 'stock-notifications',
      where: {
        and: [
          { user: { equals: user.id } },
          { sku: { equals: skuId } },
        ],
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      return Response.json({
        success: true,
        message: 'Already subscribed to this product',
        alreadySubscribed: true,
      })
    }

    // Create subscription
    const notification = await payload.create({
      collection: 'stock-notifications',
      data: {
        user: user.id,
        sku: skuId,
      },
    })

    return Response.json({
      success: true,
      message: 'Successfully subscribed to stock notification',
      notificationId: notification.id,
    })
  } catch (error: any) {
    payload.logger.error(`Error subscribing to stock notification: ${error}`)
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return Response.json({
        success: true,
        message: 'Already subscribed to this product',
        alreadySubscribed: true,
      })
    }

    return Response.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    )
  }
}
