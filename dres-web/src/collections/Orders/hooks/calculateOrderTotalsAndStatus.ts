import type { CollectionBeforeChangeHook } from 'payload'

// Generate unique order ID: ORD-YYYYMMDD-XXXXXX-XXXX
const generateOrderId = (): string => {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = crypto.randomUUID().split('-')[0].toUpperCase()
  return `ORD-${dateStr}-${timestamp}-${random}`
}

interface OrderItem {
  quantity?: number
  price?: number
  shippingStatus?: string
}

export const calculateOrderTotalsAndStatus: CollectionBeforeChangeHook = ({ data, operation }) => {
  // Generate order ID on create
  if (operation === 'create' && !data?.orderId) {
    data.orderId = generateOrderId()
  }

  // Calculate totals from items
  if (data?.items && Array.isArray(data.items)) {
    data.totalItems = data.items.reduce((total: number, item: OrderItem) => {
      return total + (item.quantity || 0)
    }, 0)

    data.totalAmount = data.items.reduce((total: number, item: OrderItem) => {
      const quantity = item.quantity || 0
      const price = item.price || 0
      return total + quantity * price
    }, 0)

    // Auto-update order status based on item statuses
    const itemStatuses = data.items.map((item: OrderItem) => item.shippingStatus)

    if (itemStatuses.length > 0) {
      const allPlaced = itemStatuses.every((status) => status === 'placed')
      const allCancelled = itemStatuses.every(
        (status) => status === 'returned' || status === 'not_available',
      )
      const allFinished = itemStatuses.every(
        (status) => status === 'delivered' || status === 'returned' || status === 'not_available',
      )
      const hasOutForDelivery = itemStatuses.some((status) => status === 'out_for_delivery')
      const hasReturnInProgress = itemStatuses.some((status) => status === 'return_in_progress')

      if (allPlaced) {
        // All items are still placed - order is placed
        data.status = 'placed'
      } else if (allCancelled) {
        // All items returned or not available - order is cancelled (full refund)
        data.status = 'cancelled'
      } else if (allFinished) {
        // All items are either delivered, returned, or not available - order is completed
        data.status = 'completed'
      } else if (hasOutForDelivery || hasReturnInProgress) {
        // Some items are in transit - order is in progress
        data.status = 'in_progress'
      } else {
        // Mixed statuses - order is in progress
        data.status = 'in_progress'
      }
    }
  }

  return data
}
