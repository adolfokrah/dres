import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

interface DiscountCode {
  id: string
  code: string
  type: 'percentage' | 'fixed' | 'free_shipping'
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  usageCount: number
  maxUses?: number
  maxUsesPerUser?: number
  startsAt?: string
  expiresAt?: string
  active: boolean
  applicableTo: 'all' | 'categories' | 'products' | 'sellers'
  categories?: string[] | { id: string }[]
  products?: string[] | { id: string }[]
  sellers?: string[] | { id: string }[]
  usedBy?: Array<{
    user: string | { id: string }
    usedAt: string
    order?: string | { id: string }
  }>
}

interface CartItem {
  product: string | { id: string }
  price?: number
  quantity?: number
  shippingFee?: number
}

export const applyDiscountCode: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const payload = req.payload

  // Only process if discount code is being applied or removed
  const discountCodeId = data?.discountCode
    ? typeof data.discountCode === 'object'
      ? (data.discountCode as { id: string }).id
      : data.discountCode
    : null

  const previousDiscountCodeId = originalDoc?.discountCode
    ? typeof originalDoc.discountCode === 'object'
      ? (originalDoc.discountCode as { id: string }).id
      : originalDoc.discountCode
    : null

  // If no change in discount code, skip validation but still calculate
  if (discountCodeId === previousDiscountCodeId && !discountCodeId) {
    data.discountAmount = 0
    return data
  }

  // If discount code is removed
  if (!discountCodeId) {
    data.discountAmount = 0
    return data
  }

  const customerId = data?.customer
    ? typeof data.customer === 'object'
      ? (data.customer as { id: string }).id
      : data.customer
    : null

  try {
    // Fetch the discount code
    const discountCode = (await payload.findByID({
      collection: 'discount-codes',
      id: discountCodeId,
      depth: 0,
    })) as DiscountCode

    if (!discountCode) {
      throw new APIError('Invalid discount code', 400)
    }

    // Validate the discount code
    const now = new Date()

    // Check if active
    if (!discountCode.active) {
      throw new APIError('This discount code is no longer active', 400)
    }

    // Check start date
    if (discountCode.startsAt && new Date(discountCode.startsAt) > now) {
      throw new APIError('This discount code is not yet active', 400)
    }

    // Check expiry
    if (discountCode.expiresAt && new Date(discountCode.expiresAt) < now) {
      throw new APIError('This discount code has expired', 400)
    }

    // Check max uses
    if (discountCode.maxUses && discountCode.usageCount >= discountCode.maxUses) {
      throw new APIError('This discount code has reached its maximum usage limit', 400)
    }

    // Check max uses per user
    if (customerId && discountCode.maxUsesPerUser && discountCode.usedBy) {
      const userUsageCount = discountCode.usedBy.filter((usage) => {
        const userId = typeof usage.user === 'object' ? usage.user.id : usage.user
        return userId === customerId
      }).length

      if (userUsageCount >= discountCode.maxUsesPerUser) {
        throw new APIError(
          `You have already used this discount code ${userUsageCount} time(s)`,
          400,
        )
      }
    }

    // Calculate cart subtotal
    const items = (data?.items || []) as CartItem[]
    let subtotal = 0
    let totalShipping = 0

    for (const item of items) {
      const price = item.price || 0
      const quantity = item.quantity || 1
      subtotal += price * quantity
      totalShipping += item.shippingFee || 0
    }

    // Check minimum order amount
    if (discountCode.minOrderAmount && subtotal < discountCode.minOrderAmount) {
      throw new APIError(
        `Minimum order amount of ${discountCode.minOrderAmount} required for this discount code`,
        400,
      )
    }

    // Calculate discount
    let discountAmount = 0

    switch (discountCode.type) {
      case 'percentage':
        discountAmount = (subtotal * discountCode.value) / 100
        // Apply max discount cap if set
        if (discountCode.maxDiscountAmount && discountAmount > discountCode.maxDiscountAmount) {
          discountAmount = discountCode.maxDiscountAmount
        }
        break

      case 'fixed':
        discountAmount = discountCode.value
        // Don't allow discount to exceed subtotal
        if (discountAmount > subtotal) {
          discountAmount = subtotal
        }
        break

      case 'free_shipping':
        discountAmount = totalShipping
        break
    }

    // Round to 2 decimal places
    data.discountAmount = Math.round(discountAmount * 100) / 100

    payload.logger.info(
      `Applied discount code ${discountCode.code}: ${discountAmount} off (type: ${discountCode.type})`,
    )
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    payload.logger.error(`Error applying discount code: ${error}`)
    data.discountCode = null
    data.discountAmount = 0
  }

  return data
}
