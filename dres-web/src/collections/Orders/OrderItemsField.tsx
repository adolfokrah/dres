'use client'

import React, { useState } from 'react'
import { useField, SelectInput, FieldLabel } from '@payloadcms/ui'
import { StatusBadge } from './StatusBadge'

interface StatusLog {
  status: string
  timestamp: string
}

interface OrderItem {
  productTitle: string
  productImage: string
  variationOptions: Record<string, string> | null
  sellerId: string
  sellerName: string
  price: number
  originalPrice: number
  quantity: number
  shippingFee?: number
  buyerProtection?: boolean
  buyerProtectionFee?: number
  shippingStatus: string
  statusLogs?: StatusLog[]
}

const shippingStatusOptions = [
  { label: 'Placed', value: 'placed' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Return in Progress', value: 'return_in_progress' },
  { label: 'Returned', value: 'returned' },
  { label: 'Not Available', value: 'not_available' },
]

const getStatusLabel = (status: string): string => {
  const option = shippingStatusOptions.find((opt) => opt.value === status)
  return option?.label || status
}

const getStatusColor = (status: string): string => {
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
    default:
      return '#8b5cf6'
  }
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

type Props = {
  path: string
  field: {
    name: string
    label?: string
  }
}

export const OrderItemsField: React.FC<Props> = ({ path, field }) => {
  const { value, setValue } = useField<OrderItem[]>({ path })
  const [expandedLogs, setExpandedLogs] = useState<Record<number, boolean>>({})

  const items: OrderItem[] = Array.isArray(value) ? value : []

  const toggleLogs = (index: number) => {
    setExpandedLogs((prev) => ({ ...prev, [index]: !prev[index] }))
  }

  const handleStatusChange = (index: number, option: { value: string } | null) => {
    if (!option) return
    const updatedItems = [...items]
    const currentItem = updatedItems[index]

    if (currentItem.shippingStatus !== option.value) {
      const newLog: StatusLog = {
        status: option.value,
        timestamp: new Date().toISOString(),
      }

      updatedItems[index] = {
        ...currentItem,
        shippingStatus: option.value,
        statusLogs: [...(currentItem.statusLogs || []), newLog],
      }
      setValue(updatedItems)
    }
  }

  const calculateItemTotal = (item: OrderItem) => {
    const productTotal = item.price * item.quantity
    const shipping = item.shippingFee || 0
    const protection = item.buyerProtectionFee || 0
    return productTotal + shipping + protection
  }

  return (
    <div className="field-type">
      <FieldLabel label={field.label || 'Order Items'} />

      {items.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: 'var(--theme-elevation-400)',
            backgroundColor: 'var(--theme-elevation-50)',
            border: '1px dashed var(--theme-elevation-200)',
          }}
        >
          No items in this order
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '12px' }}>
          {items.map((item, index) => (
            <div
              key={index}
              style={{
                backgroundColor: 'var(--theme-elevation-50)',
                border: '1px solid var(--theme-elevation-100)',
              }}
            >
              {/* Main Content */}
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'flex', gap: '20px' }}>
                  {/* Product Image */}
                  <div
                    style={{
                      width: '100px',
                      height: '100px',
                      overflow: 'hidden',
                      backgroundColor: 'var(--theme-elevation-100)',
                      flexShrink: 0,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    }}
                  >
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productTitle}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--theme-elevation-400)',
                          fontSize: '12px',
                        }}
                      >
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title & Price Row */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '16px',
                        marginBottom: '12px',
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <h3
                          style={{
                            margin: 0,
                            fontSize: '16px',
                            fontWeight: 600,
                            color: 'var(--theme-elevation-900)',
                            lineHeight: 1.3,
                          }}
                        >
                          {item.productTitle}
                        </h3>
                        <div
                          style={{
                            fontSize: '13px',
                            color: 'var(--theme-elevation-500)',
                            marginTop: '4px',
                          }}
                        >
                          by {item.sellerName}
                        </div>
                      </div>

                      {/* Price Block */}
                      <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: '20px',
                            fontWeight: 700,
                            color: 'var(--theme-success-500)',
                          }}
                        >
                          {calculateItemTotal(item).toFixed(2)}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--theme-elevation-400)' }}>
                          Total
                        </div>
                      </div>
                    </div>

                    {/* Variation Options */}
                    {item.variationOptions && Object.keys(item.variationOptions).length > 0 && (
                      <div
                        style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}
                      >
                        {Object.entries(item.variationOptions).map(([key, val]) => (
                          <span
                            key={key}
                            style={{
                              fontSize: '12px',
                              padding: '4px 10px',
                              backgroundColor: 'var(--theme-elevation-100)',
                              color: 'var(--theme-elevation-700)',
                            }}
                          >
                            <span style={{ color: 'var(--theme-elevation-500)' }}>{key}:</span>{' '}
                            <strong>{val}</strong>
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price Breakdown */}
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                        gap: '8px',
                        padding: '12px',
                        backgroundColor: 'var(--theme-elevation-100)',
                        fontSize: '12px',
                      }}
                    >
                      {item.originalPrice && item.originalPrice !== item.price && (
                        <div>
                          <div style={{ color: 'var(--theme-elevation-500)', marginBottom: '2px' }}>
                            Original Price
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--theme-elevation-600)' }}>
                            {item.originalPrice.toFixed(2)} × {item.quantity} = {(item.originalPrice * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      )}
                      <div>
                        <div style={{ color: 'var(--theme-elevation-500)', marginBottom: '2px' }}>
                          Selling Price
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--theme-elevation-800)' }}>
                          {item.price.toFixed(2)} × {item.quantity} = {(item.price * item.quantity).toFixed(2)}
                        </div>
                      </div>
                      {item.shippingFee !== undefined && item.shippingFee > 0 && (
                        <div>
                          <div style={{ color: 'var(--theme-elevation-500)', marginBottom: '2px' }}>
                            Shipping
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--theme-elevation-800)' }}>
                            {item.shippingFee.toFixed(2)}
                          </div>
                        </div>
                      )}
                      {item.buyerProtection && item.buyerProtectionFee !== undefined && item.buyerProtectionFee > 0 && (
                        <div>
                          <div style={{ color: 'var(--theme-elevation-500)', marginBottom: '2px' }}>
                            Buyer Protection Fee
                          </div>
                          <div style={{ fontWeight: 600, color: 'var(--theme-elevation-800)' }}>
                            {item.buyerProtectionFee.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Section */}
              <div
                style={{
                  padding: '16px 20px',
                  backgroundColor: 'var(--theme-elevation-100)',
                  borderTop: '1px solid var(--theme-elevation-150)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                  <div style={{ minWidth: '200px', maxWidth: '250px' }}>
                    <SelectInput
                      path={`${path}.${index}.shippingStatus`}
                      name={`shippingStatus-${index}`}
                      options={shippingStatusOptions}
                      value={item.shippingStatus}
                      onChange={(option) =>
                        handleStatusChange(index, option as { value: string } | null)
                      }
                    />
                  </div>

                  {/* Current Status Badge */}
                  <StatusBadge status={item.shippingStatus} type="shipping" />
                </div>

                {item.statusLogs && item.statusLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => toggleLogs(index)}
                    style={{
                      background: 'transparent',
                      border: '1px solid var(--theme-elevation-300)',
                      color: 'var(--theme-elevation-600)',
                      cursor: 'pointer',
                      fontSize: '12px',
                      padding: '6px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      transition: 'all 0.2s',
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
                    </svg>
                    {expandedLogs[index] ? 'Hide' : 'Show'} Journey ({item.statusLogs.length})
                  </button>
                )}
              </div>

              {/* Journey Timeline */}
              {expandedLogs[index] && item.statusLogs && item.statusLogs.length > 0 && (
                <div
                  style={{
                    padding: '20px',
                    backgroundColor: 'var(--theme-elevation-0)',
                    borderTop: '1px solid var(--theme-elevation-150)',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: 'var(--theme-elevation-700)',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                    Status Journey
                  </div>

                  <div style={{ position: 'relative', paddingLeft: '24px' }}>
                    {/* Timeline line */}
                    <div
                      style={{
                        position: 'absolute',
                        left: '7px',
                        top: '8px',
                        bottom: '8px',
                        width: '2px',
                        background:
                          'linear-gradient(to bottom, var(--theme-elevation-200), var(--theme-success-500))',
                      }}
                    />

                    {item.statusLogs.map((log, logIndex) => {
                      const isLast = logIndex === item.statusLogs!.length - 1
                      return (
                        <div
                          key={logIndex}
                          style={{
                            position: 'relative',
                            paddingBottom: isLast ? 0 : '16px',
                          }}
                        >
                          {/* Timeline dot */}
                          <div
                            style={{
                              position: 'absolute',
                              left: '-20px',
                              top: '4px',
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: isLast
                                ? getStatusColor(log.status)
                                : 'var(--theme-elevation-300)',
                              border: '2px solid var(--theme-elevation-0)',
                              boxShadow: isLast ? `0 0 0 3px ${getStatusColor(log.status)}30` : 'none',
                            }}
                          />
                          <div
                            style={{
                              fontSize: '13px',
                              fontWeight: isLast ? 600 : 500,
                              color: isLast
                                ? 'var(--theme-elevation-900)'
                                : 'var(--theme-elevation-600)',
                            }}
                          >
                            {getStatusLabel(log.status)}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              color: 'var(--theme-elevation-500)',
                              marginTop: '2px',
                            }}
                          >
                            {formatDate(log.timestamp)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrderItemsField
