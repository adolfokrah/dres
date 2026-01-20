type ShippingStatus =
  | 'placed'
  | 'cancelled'
  | 'out_for_delivery'
  | 'delivered'
  | 'return_in_progress'
  | 'returned'
  | 'disputed'
  | 'not_available'

export interface OrderItemInput {
  seller?: string
  price?: number
  originalPrice?: number
  shippingFee?: number
  buyerProtection?: boolean
  buyerProtectionFee?: number
  shippingStatus?: ShippingStatus
  quantity?: number
  variationTitle?: string
}

export interface OrderOptions {
  discountAmount?: number
  pointsDiscount?: number
  status?: string
  orderId?: string
}

/**
 * Creates a mock order item with sensible defaults
 */
export function createOrderItem(input: OrderItemInput, index = 0) {
  return {
    id: `item-${index}`,
    seller: input.seller ?? `seller-${index}`,
    variationTitle: input.variationTitle ?? `Test Item ${index + 1}`,
    price: input.price ?? 100,
    originalPrice: input.originalPrice ?? (input.price ?? 100) * 1.2,
    quantity: input.quantity ?? 1,
    shippingFee: input.shippingFee ?? 0,
    buyerProtection: input.buyerProtection ?? false,
    buyerProtectionFee: input.buyerProtectionFee ?? 0,
    shippingStatus: input.shippingStatus ?? 'placed',
  }
}

/**
 * Creates a mock order with items and options
 */
export function createOrder(
  items: OrderItemInput[],
  options: OrderOptions = {},
) {
  const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return {
    id: `order-${uniqueId}`,
    orderId: options.orderId ?? `ORD-TEST-${uniqueId}`,
    status: options.status ?? 'placed',
    items: items.map((item, idx) => createOrderItem(item, idx)),
    discountAmount: options.discountAmount ?? 0,
    pointsDiscount: options.pointsDiscount ?? 0,
  }
}

/**
 * Creates a delivered order (all items delivered)
 */
export function createDeliveredOrder(
  items: Omit<OrderItemInput, 'shippingStatus'>[],
  options: OrderOptions = {},
) {
  return createOrder(
    items.map(item => ({ ...item, shippingStatus: 'delivered' as const })),
    { ...options, status: 'delivered' },
  )
}

/**
 * Creates a returned order (all items returned)
 */
export function createReturnedOrder(
  items: Omit<OrderItemInput, 'shippingStatus'>[],
  options: OrderOptions = {},
) {
  return createOrder(
    items.map(item => ({ ...item, shippingStatus: 'returned' as const })),
    options,
  )
}
