import type { PayloadHandler, PayloadRequest } from 'payload'

/**
 * POST /api/variations/record-view
 * 
 * Records a variation view for trending algorithm.
 * IP address is automatically captured from the request.
 * 
 * Body:
 * - variationId: string (required)
 * - source: 'search' | 'category' | 'home' | 'recommendation' | 'direct' | 'share'
 */
export const recordView: PayloadHandler = async (req: PayloadRequest) => {
  const { payload, user } = req

  // Get IP address from request headers
  const forwarded = req.headers.get('x-forwarded-for')
  const ipAddress = forwarded 
    ? forwarded.split(',')[0].trim() 
    : req.headers.get('x-real-ip') || 'unknown'

  try {
    const body = await req.json?.()
    
    if (!body?.variationId) {
      return Response.json(
        { error: 'variationId is required' },
        { status: 400 }
      )
    }

    const { variationId, source } = body

    // Verify variation exists
    const variation = await payload.findByID({
      collection: 'variations',
      id: variationId,
    })

    if (!variation) {
      return Response.json(
        { error: 'Variation not found' },
        { status: 404 }
      )
    }

    // Check for duplicate view (within last 30 minutes)
    const thirtyMinutesAgo = new Date()
    thirtyMinutesAgo.setMinutes(thirtyMinutesAgo.getMinutes() - 30)

    const existingView = await payload.find({
      collection: 'variation-views',
      where: {
        variation: { equals: variationId },
        viewedAt: { greater_than: thirtyMinutesAgo.toISOString() },
        ...(user 
          ? { user: { equals: user.id } }
          : { ipAddress: { equals: ipAddress } }
        ),
      },
      limit: 1,
    })

    if (existingView.docs.length > 0) {
      return Response.json({
        success: true,
        message: 'View already recorded recently',
        duplicate: true,
      })
    }

    // Record the view
    await payload.create({
      collection: 'variation-views',
      data: {
        variation: variationId,
        user: user?.id || null,
        ipAddress,
        source: source || 'direct',
        viewedAt: new Date().toISOString(),
      },
    })

    return Response.json({
      success: true,
      message: 'View recorded',
    })
  } catch (error) {
    console.error('Error recording variation view:', error)
    return Response.json(
      { error: 'Failed to record view' },
      { status: 500 }
    )
  }
}
