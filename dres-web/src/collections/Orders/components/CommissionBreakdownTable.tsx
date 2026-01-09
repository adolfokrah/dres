'use client'

import React from 'react'
import { useDocumentInfo } from '@payloadcms/ui'

const getCurrencySymbol = (currency?: string) => {
  switch (currency?.toUpperCase()) {
    case 'GHS':
      return '₵'
    case 'USD':
      return '$'
    case 'EUR':
      return '€'
    case 'GBP':
      return '£'
    case 'NGN':
      return '₦'
    default:
      return '₵'
  }
}

export const CommissionBreakdownTable: React.FC = () => {
  const { initialData } = useDocumentInfo()
  
  const doc = initialData as any
  const breakdown = doc?.commissionBreakdown || {}
  const currency = doc?.currency || 'GHS'
  const currencySymbol = getCurrencySymbol(currency)
  
  const formatCurrency = (amount: number) => {
    return `${currencySymbol}${amount.toFixed(2)}`
  }
  
  const totalTransactionFees = breakdown.totalTransactionFees || 0
  const totalPaystackFees = breakdown.totalPaystackFees || 0
  const totalBuyerProtectionFees = breakdown.totalBuyerProtectionFees || 0
  const discountAmount = breakdown.discountAmount || 0
  const pointsDiscount = breakdown.pointsDiscount || 0
  const totalCommission = breakdown.totalCommission || 0

  // Calculate BP costs from items if not stored (for backwards compatibility)
  let buyerProtectionCosts = breakdown.buyerProtectionCosts || 0
  if (buyerProtectionCosts === 0 && doc?.items) {
    for (const item of doc.items) {
      const isReturned = item.shippingStatus === 'returned' || item.shippingStatus === 'not_available'
      if (item.buyerProtection && isReturned) {
        const shippingFee = item.shippingFee || 0
        buyerProtectionCosts += shippingFee + 2 // shipping + 2 transfer fees
      }
    }
  }

  return (
    <div style={{ 
      marginBottom: '24px',
      border: '1px solid var(--theme-elevation-150)',
      borderRadius: '4px',
      overflow: 'hidden',
    }}>
      <table style={{ 
        width: '100%', 
        borderCollapse: 'collapse',
        fontSize: '14px',
      }}>
        <thead>
          <tr style={{ 
            backgroundColor: 'var(--theme-elevation-50)',
            borderBottom: '1px solid var(--theme-elevation-150)',
          }}>
            <th style={{ 
              padding: '12px 16px', 
              textAlign: 'left',
              fontWeight: '600',
              color: 'var(--theme-text)',
            }} colSpan={2}>
              Commission Breakdown
            </th>
          </tr>
        </thead>
        <tbody>
          <tr style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
            <td style={{ 
              padding: '10px 16px', 
              color: 'var(--theme-elevation-800)',
            }}>
              Total Transaction Fees
            </td>
            <td style={{ 
              padding: '10px 16px', 
              textAlign: 'right',
              fontFamily: 'monospace',
            }}>
              {formatCurrency(totalTransactionFees)}
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
            <td style={{ 
              padding: '10px 16px', 
              color: 'var(--theme-elevation-800)',
            }}>
              Total Paystack Fees
            </td>
            <td style={{ 
              padding: '10px 16px', 
              textAlign: 'right',
              fontFamily: 'monospace',
              color: '#ef4444',
            }}>
              -{formatCurrency(Math.abs(totalPaystackFees))}
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
            <td style={{ 
              padding: '10px 16px', 
              color: 'var(--theme-elevation-800)',
            }}>
              Total Buyer Protection Fees
            </td>
            <td style={{ 
              padding: '10px 16px', 
              textAlign: 'right',
              fontFamily: 'monospace',
              color: '#22c55e',
            }}>
              +{formatCurrency(totalBuyerProtectionFees)}
            </td>
          </tr>
          {buyerProtectionCosts > 0 && (
            <tr style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
              <td style={{ 
                padding: '10px 16px', 
                color: 'var(--theme-elevation-800)',
                paddingLeft: '32px',
                fontSize: '13px',
              }}>
                Refund Costs Covered
              </td>
              <td style={{ 
                padding: '10px 16px', 
                textAlign: 'right',
                fontFamily: 'monospace',
                color: '#ef4444',
                fontSize: '13px',
              }}>
                -{formatCurrency(buyerProtectionCosts)}
              </td>
            </tr>
          )}
          <tr style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
            <td style={{ 
              padding: '10px 16px', 
              color: 'var(--theme-elevation-800)',
            }}>
              Discount Amount
            </td>
            <td style={{ 
              padding: '10px 16px', 
              textAlign: 'right',
              fontFamily: 'monospace',
              color: '#ef4444',
            }}>
              -{formatCurrency(Math.abs(discountAmount))}
            </td>
          </tr>
          <tr style={{ borderBottom: '1px solid var(--theme-elevation-100)' }}>
            <td style={{ 
              padding: '10px 16px', 
              color: 'var(--theme-elevation-800)',
            }}>
              Points Discount
            </td>
            <td style={{ 
              padding: '10px 16px', 
              textAlign: 'right',
              fontFamily: 'monospace',
              color: '#ef4444',
            }}>
              -{formatCurrency(Math.abs(pointsDiscount))}
            </td>
          </tr>
          <tr style={{ 
            backgroundColor: 'var(--theme-elevation-50)',
            borderTop: '2px solid var(--theme-elevation-200)',
          }}>
            <td style={{ 
              padding: '12px 16px', 
              fontWeight: '700',
              color: 'var(--theme-text)',
            }}>
              Total Commission
            </td>
            <td style={{ 
              padding: '12px 16px', 
              textAlign: 'right',
              fontWeight: '700',
              fontFamily: 'monospace',
              fontSize: '16px',
              color: totalCommission >= 0 ? '#22c55e' : '#ef4444',
            }}>
              {formatCurrency(totalCommission)}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default CommissionBreakdownTable
