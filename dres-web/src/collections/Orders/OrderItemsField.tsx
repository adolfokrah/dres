'use client'

import React from 'react'
import { useField, SelectInput, FieldLabel } from '@payloadcms/ui'

interface OrderItem {
  productTitle: string
  productImage: string
  variationOptions: Record<string, string> | null
  sellerId: string
  sellerName: string
  price: number
  quantity: number
  shippingStatus: string
}

const shippingStatusOptions = [
  { label: 'Placed', value: 'placed' },
  { label: 'Out for Delivery', value: 'out_for_delivery' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Return in Progress', value: 'return_in_progress' },
  { label: 'Returned', value: 'returned' },
  { label: 'Not Available', value: 'not_available' },
]

type Props = {
  path: string
  field: {
    name: string
    label?: string
  }
}

export const OrderItemsField: React.FC<Props> = ({ path, field }) => {
  const { value, setValue } = useField<OrderItem[]>({ path })

  const items: OrderItem[] = Array.isArray(value) ? value : []

  const handleStatusChange = (index: number, option: { value: string } | null) => {
    if (!option) return
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], shippingStatus: option.value }
    setValue(updatedItems)
  }

  return (
    <div className="field-type">
      <FieldLabel label={field.label || 'Order Items'} />
      
      {items.length === 0 ? (
        <div className="empty-state" style={{ padding: '20px', textAlign: 'center', color: 'var(--theme-elevation-500)' }}>
          No items in this order
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
          {items.map((item, index) => (
            <div
              key={index}
              className="card"
              style={{
                display: 'flex',
                gap: '16px',
                padding: '16px',
                backgroundColor: 'var(--theme-elevation-50)',
                borderRadius: '4px',
                border: '1px solid var(--theme-elevation-150)',
              }}
            >
              {/* Product Image */}
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  backgroundColor: 'var(--theme-elevation-100)',
                  flexShrink: 0,
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
                      fontSize: '11px',
                    }}
                  >
                    No Image
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--theme-elevation-800)' }}>
                    {item.productTitle}
                  </h4>
                  <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--theme-success-500)', whiteSpace: 'nowrap' }}>
                    {item.price.toFixed(2)}
                  </span>
                </div>

                {/* Variation Options */}
                {item.variationOptions && Object.keys(item.variationOptions).length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
                    {Object.entries(item.variationOptions).map(([key, val]) => (
                      <span
                        key={key}
                        className="pill pill--style-light"
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          backgroundColor: 'var(--theme-elevation-100)',
                          borderRadius: '3px',
                          color: 'var(--theme-elevation-600)',
                        }}
                      >
                        {key}: <strong>{val}</strong>
                      </span>
                    ))}
                  </div>
                )}

                {/* Seller & Quantity */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '12px', color: 'var(--theme-elevation-500)', marginBottom: '12px' }}>
                  <span>Seller: <strong style={{ color: 'var(--theme-elevation-700)' }}>{item.sellerName}</strong></span>
                  <span>Qty: <strong style={{ color: 'var(--theme-elevation-700)' }}>{item.quantity}</strong></span>
                </div>

                {/* Shipping Status */}
                <div style={{ maxWidth: '250px' }}>
                  <SelectInput
                    path={`${path}.${index}.shippingStatus`}
                    name={`shippingStatus-${index}`}
                    label="Shipping Status"
                    options={shippingStatusOptions}
                    value={item.shippingStatus}
                    onChange={(option) => handleStatusChange(index, option as { value: string } | null)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default OrderItemsField
