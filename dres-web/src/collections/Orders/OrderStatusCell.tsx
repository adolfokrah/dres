'use client'

import React from 'react'
import { StatusBadge } from './StatusBadge'

interface OrderStatusCellProps {
  cellData: string
}

export const OrderStatusCell: React.FC<OrderStatusCellProps> = ({ cellData }) => {
  return <StatusBadge status={cellData || 'placed'} type="order" />
}

export default OrderStatusCell
