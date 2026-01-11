import type { PayloadHandler, PayloadRequest } from 'payload'

/**
 * POST /api/variations/record-view
 * 
 * Records a variation view for trending algorithm.
 * - If user is logged in, adds them to the users array of the variation-view
 * - Creates a new variation-view if one doesn't exist for this variation
 * - Does NOT record views when seller views their own product
 * 
 * Body:
 * - variationId: string (required)
 */
export const recordView: PayloadHandler = async (req: PayloadRequest) => {
  const { payload, user } = req

  try {
    const body = await req.json?.()
    
    if (!body?.variationId) {
      return Response.json(
        { error: 'variationId is required' },
        { status: 400 }
      )
    }

    const { variationId } = body

    // Verify variation exists and get style info to check seller
    const variation = await payload.findByID({
      collection: 'variations',
      id: variationId,
      depth: 1, // Get style info
    })

    if (!variation) {
      return Response.json(
        { error: 'Variation not found' },
        { status: 404 }
      )
    }

    // Check if the logged-in user is the seller of this product
    // If so, don't record the view (seller viewing own product)
    if (user?.id) {
      const style = variation.style
      let sellerId: string | null = null
      
      if (style && typeof style === 'object' && 'seller' in style) {
        const seller = (style as { seller?: string | { id: string } }).seller
        sellerId = typeof seller === 'object' ? seller?.id : seller
      }
      
      if (sellerId && sellerId === user.id) {
        return Response.json({
          success: true,
          message: 'View not recorded - seller viewing own product',
          skipped: true,
        })
      }
    }

    // Check if a variation-view record already exists for this variation
    const existingViewRecord = await payload.find({
      collection: 'variation-views',
      where: {
        variation: { equals: variationId },
      },
      limit: 1,
      depth: 0,
    })

    if (existingViewRecord.docs.length > 0) {
      const viewRecord = existingViewRecord.docs[0]
      
      // If user is logged in, add them to the users array (if not already there)
      if (user?.id) {
        const existingUsers = (viewRecord.users as string[]) || []
        
        if (!existingUsers.includes(user.id)) {
          // Add user to the array
          await payload.update({
            collection: 'variation-views',
            id: viewRecord.id,
            data: {
              users: [...existingUsers, user.id],
            },
          })
          
          return Response.json({
            success: true,
            message: 'User added to view record',
          })
        } else {
          return Response.json({
            success: true,
            message: 'User already in view record',
            duplicate: true,
          })
        }
      }
      
      // Anonymous view - just acknowledge (record already exists)
      return Response.json({
        success: true,
        message: 'View record exists',
      })
    }

    // No existing record - create a new one
    await payload.create({
      collection: 'variation-views',
      data: {
        variation: variationId,
        users: user?.id ? [user.id] : [],
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
