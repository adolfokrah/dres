import type { PayloadHandler } from 'payload'

interface AddressInput {
  label?: string
  fullName: string
  phone: string
  address?: string
  country?: string
  region?: string
  city?: string
  postalCode?: string
  deliveryNotes?: string
  isDefault?: boolean
}

/**
 * POST /api/users/addresses
 * Add a new shipping address to the current user
 */
export const addAddress: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    // Parse request body
    const body = await req.json?.() as AddressInput | undefined

    if (!body) {
      return Response.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!body.fullName || !body.phone) {
      return Response.json(
        { error: 'fullName and phone are required' },
        { status: 400 }
      )
    }

    // Get current user data with addresses
    const currentUser = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
    })

    const currentAddresses = (currentUser.addresses || []) as AddressInput[]

    // Create new address object
    const newAddress: AddressInput = {
      label: body.label || 'Home',
      fullName: body.fullName,
      phone: body.phone,
      address: body.address,
      country: body.country,
      region: body.region,
      city: body.city,
      postalCode: body.postalCode,
      deliveryNotes: body.deliveryNotes,
      isDefault: body.isDefault ?? currentAddresses.length === 0, // First address is default
    }

    // If new address is default, unset default on all other addresses
    let updatedAddresses: AddressInput[]
    if (newAddress.isDefault) {
      updatedAddresses = currentAddresses.map(addr => ({
        ...addr,
        isDefault: false,
      }))
    } else {
      updatedAddresses = [...currentAddresses]
    }

    // Add the new address
    updatedAddresses.push(newAddress)

    // Update user with new addresses array
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        addresses: updatedAddresses,
      },
    })

    // Return updated addresses
    const updatedUser = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 1, // Populate country, region, city
    })

    return Response.json({
      success: true,
      addresses: updatedUser.addresses || [],
    })
  } catch (error: any) {
    payload.logger.error(`Error adding address: ${error}`)
    return Response.json(
      {
        error: 'Failed to add address',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/addresses/:index
 * Delete a shipping address by index
 */
export const deleteAddress: PayloadHandler = async (req) => {
  const { payload, user } = req
  const { index } = req.routeParams || {}

  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const addressIndex = parseInt(index as string, 10)
    
    if (isNaN(addressIndex) || addressIndex < 0) {
      return Response.json(
        { error: 'Invalid address index' },
        { status: 400 }
      )
    }

    // Get current user data with addresses
    const currentUser = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
    })

    const currentAddresses = (currentUser.addresses || []) as AddressInput[]

    if (addressIndex >= currentAddresses.length) {
      return Response.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    // Remove the address at the specified index
    const deletedAddress = currentAddresses[addressIndex]
    const updatedAddresses = currentAddresses.filter((_, i) => i !== addressIndex)

    // If deleted address was default, make first remaining address default
    if (deletedAddress.isDefault && updatedAddresses.length > 0) {
      updatedAddresses[0].isDefault = true
    }

    // Update user with new addresses array
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        addresses: updatedAddresses,
      },
    })

    // Return updated addresses
    const updatedUser = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 1,
    })

    return Response.json({
      success: true,
      addresses: updatedUser.addresses || [],
    })
  } catch (error: any) {
    payload.logger.error(`Error deleting address: ${error}`)
    return Response.json(
      {
        error: 'Failed to delete address',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/addresses/:index/default
 * Set a shipping address as default
 */
export const setDefaultAddress: PayloadHandler = async (req) => {
  const { payload, user } = req
  const { index } = req.routeParams || {}

  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const addressIndex = parseInt(index as string, 10)
    
    if (isNaN(addressIndex) || addressIndex < 0) {
      return Response.json(
        { error: 'Invalid address index' },
        { status: 400 }
      )
    }

    // Get current user data with addresses
    const currentUser = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
    })

    const currentAddresses = (currentUser.addresses || []) as AddressInput[]

    if (addressIndex >= currentAddresses.length) {
      return Response.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    // Update all addresses: set selected as default, unset others
    const updatedAddresses = currentAddresses.map((addr, i) => ({
      ...addr,
      isDefault: i === addressIndex,
    }))

    // Update user with new addresses array
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        addresses: updatedAddresses,
      },
    })

    // Return updated addresses
    const updatedUser = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 1,
    })

    return Response.json({
      success: true,
      addresses: updatedUser.addresses || [],
    })
  } catch (error: any) {
    payload.logger.error(`Error setting default address: ${error}`)
    return Response.json(
      {
        error: 'Failed to set default address',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/addresses/:index
 * Update a shipping address by index
 */
export const updateAddress: PayloadHandler = async (req) => {
  const { payload, user } = req
  const { index } = req.routeParams || {}

  if (!user) {
    return Response.json(
      { error: 'Authentication required' },
      { status: 401 }
    )
  }

  try {
    const addressIndex = parseInt(index as string, 10)
    
    if (isNaN(addressIndex) || addressIndex < 0) {
      return Response.json(
        { error: 'Invalid address index' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await req.json?.() as AddressInput | undefined

    if (!body) {
      return Response.json(
        { error: 'Request body is required' },
        { status: 400 }
      )
    }

    // Get current user data with addresses
    const currentUser = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 0,
    })

    const currentAddresses = (currentUser.addresses || []) as AddressInput[]

    if (addressIndex >= currentAddresses.length) {
      return Response.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    // Update the address at the specified index
    const updatedAddress: AddressInput = {
      label: body.label ?? currentAddresses[addressIndex].label,
      fullName: body.fullName ?? currentAddresses[addressIndex].fullName,
      phone: body.phone ?? currentAddresses[addressIndex].phone,
      address: body.address ?? currentAddresses[addressIndex].address,
      country: body.country ?? currentAddresses[addressIndex].country,
      region: body.region ?? currentAddresses[addressIndex].region,
      city: body.city ?? currentAddresses[addressIndex].city,
      postalCode: body.postalCode ?? currentAddresses[addressIndex].postalCode,
      deliveryNotes: body.deliveryNotes ?? currentAddresses[addressIndex].deliveryNotes,
      isDefault: body.isDefault ?? currentAddresses[addressIndex].isDefault,
    }

    // If this address is being set as default, unset others
    let updatedAddresses: AddressInput[]
    if (updatedAddress.isDefault && !currentAddresses[addressIndex].isDefault) {
      updatedAddresses = currentAddresses.map((addr, i) => ({
        ...addr,
        isDefault: i === addressIndex,
      }))
      updatedAddresses[addressIndex] = updatedAddress
    } else {
      updatedAddresses = [...currentAddresses]
      updatedAddresses[addressIndex] = updatedAddress
    }

    // Update user with new addresses array
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        addresses: updatedAddresses,
      },
    })

    // Return updated addresses
    const updatedUser = await payload.findByID({
      collection: 'users',
      id: user.id,
      depth: 1,
    })

    return Response.json({
      success: true,
      addresses: updatedUser.addresses || [],
    })
  } catch (error: any) {
    payload.logger.error(`Error updating address: ${error}`)
    return Response.json(
      {
        error: 'Failed to update address',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
