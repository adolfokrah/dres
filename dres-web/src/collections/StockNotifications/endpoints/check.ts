import type { PayloadHandler } from 'payload'

export const checkSubscription: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ isSubscribed: false })
  }

  try {
    const url = new URL(req.url || '', 'http://localhost')
    const skuId = url.searchParams.get('skuId')

    if (!skuId) {
      return Response.json(
        { error: 'Bad Request', message: 'skuId is required' },
        { status: 400 }
      )
    }

    // Check if user has a pending subscription for this SKU
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

    return Response.json({
      isSubscribed: existing.docs.length > 0,
    })
  } catch (error: any) {
    payload.logger.error(`Error checking stock notification subscription: ${error}`)
    return Response.json(
      { error: 'Internal Server Error', message: error.message },
      { status: 500 }
    )
  }
}
