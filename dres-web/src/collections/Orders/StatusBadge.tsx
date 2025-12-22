'use client'

import React from 'react'

type StatusType = 'shipping' | 'order'

interface StatusBadgeProps {
  status: string
  type?: StatusType
}

const shippingStatusLabels: Record<string, string> = {
  placed: 'Placed',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  return_in_progress: 'Return in Progress',
  returned: 'Returned',
  not_available: 'Not Available',
}

const orderStatusLabels: Record<string, string> = {
  placed: 'Placed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

const getStatusColor = (status: string, type: StatusType): string => {
  if (type === 'order') {
    switch (status) {
      case 'completed':
        return '#22c55e'
      case 'in_progress':
        return '#3b82f6'
      case 'cancelled':
        return '#ef4444'
      case 'placed':
        return '#8b5cf6'
      default:
        return '#6b7280'
    }
  }
  
  // Shipping status colors
  switch (status) {
    case 'delivered':
      return '#22c55e'
    case 'out_for_delivery':
      return '#3b82f6'
    case 'returned':
      return '#ef4444'
    case 'return_in_progress':
      return '#f97316'
    case 'not_available':
      return '#6b7280'
    case 'placed':
    default:
      return '#8b5cf6'
  }
}

const getStatusLabel = (status: string, type: StatusType): string => {
  if (type === 'order') {
    return orderStatusLabels[status] || status
  }
  return shippingStatusLabels[status] || status
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'shipping' }) => {
  const color = getStatusColor(status, type)
  const label = getStatusLabel(status, type)

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 12px',
        backgroundColor: `${color}20`,
        fontSize: '12px',
        fontWeight: 600,
        color: color,
      }}
    >
      <span
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: color,
        }}
      />
      {label}
    </div>
  )
}

export default StatusBadge
