import {
  Button,
  Column,
  Hr,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://dres.app'
const appDeepLinkUrl = 'https://dres.app'

export interface OrderItem {
  id: string
  variationTitle: string
  variationImage?: string | null
  skuTitle?: string | null
  price: number
  quantity: number
  shippingFee: number
  buyerProtectionFee?: number
}

export interface ShippingDetails {
  fullName?: string | null
  phone?: string | null
  address?: string | null
  city?: string | null
  region?: string | null
  postalCode?: string | null
  country?: string | null
}

export interface OrderPlacedEmailProps {
  customerName: string
  id: string // Document ID for linking
  orderId: string // Human-readable order ID for display
  orderDate: string
  items: OrderItem[]
  shippingDetails: ShippingDetails
  subtotal: number
  totalShipping: number
  totalBuyerProtection: number
  discountAmount?: number
  discountCode?: string | null
  pointsRedeemed?: number
  pointsValue?: number
  grandTotal: number
  currencySymbol: string
}

const OrderItemRow = ({
  item,
  currencySymbol,
}: {
  item: OrderItem
  currencySymbol: string
}) => {
  const imageUrl = item.variationImage
    ? item.variationImage.startsWith('http')
      ? item.variationImage
      : `${baseUrl}${item.variationImage}`
    : `${baseUrl}/placeholder.png`

  const itemTotal = item.price * item.quantity

  return (
    <Row style={{ marginBottom: '16px' }}>
      <Column style={{ width: '80px', verticalAlign: 'top' }}>
        <Img
          src={imageUrl}
          width="70"
          height="70"
          alt={item.variationTitle}
          style={{
            borderRadius: '4px',
            objectFit: 'cover',
            border: '1px solid #E0E0E0',
          }}
        />
      </Column>
      <Column style={{ paddingLeft: '12px', verticalAlign: 'top' }}>
        <Text
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: '#000000',
            lineHeight: '20px',
          }}
        >
          {item.variationTitle}
        </Text>
        {item.skuTitle && (
          <Text
            style={{
              margin: '4px 0 0 0',
              fontSize: '12px',
              color: '#666666',
              lineHeight: '16px',
            }}
          >
            {item.skuTitle}
          </Text>
        )}
        <Text
          style={{
            margin: '4px 0 0 0',
            fontSize: '12px',
            color: '#666666',
            lineHeight: '16px',
          }}
        >
          Qty: {item.quantity}
        </Text>
      </Column>
      <Column style={{ width: '100px', textAlign: 'right', verticalAlign: 'top' }}>
        <Text
          style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 600,
            color: '#000000',
            lineHeight: '20px',
          }}
        >
          {currencySymbol} {itemTotal.toFixed(2)}
        </Text>
      </Column>
    </Row>
  )
}

// Default props for email preview
const defaultProps: OrderPlacedEmailProps = {
  customerName: 'Sarah',
  id: '123456789',
  orderId: 'ORD-2026-001234',
  orderDate: new Date().toISOString(),
  items: [
    {
      id: '1',
      variationTitle: 'Vintage Denim Jacket',
      variationImage: null,
      skuTitle: 'Blue / Size M',
      price: 85.0,
      quantity: 1,
      shippingFee: 12.0,
    },
    {
      id: '2',
      variationTitle: 'Classic White Sneakers',
      variationImage: null,
      skuTitle: 'White / Size 40',
      price: 120.0,
      quantity: 1,
      shippingFee: 8.0,
    },
  ],
  shippingDetails: {
    fullName: 'Sarah Johnson',
    phone: '+233 20 123 4567',
    address: '15 Independence Avenue',
    city: 'Accra',
    region: 'Greater Accra',
    postalCode: 'GA-123',
    country: 'Ghana',
  },
  subtotal: 205.0,
  totalShipping: 20.0,
  totalBuyerProtection: 16.0,
  discountAmount: 20.5,
  discountCode: 'WELCOME10',
  pointsRedeemed: 0,
  pointsValue: 0,
  grandTotal: 220.5,
  currencySymbol: 'GHS',
}

export const OrderPlacedEmail = ({
  customerName = defaultProps.customerName,
  id = defaultProps.id,
  orderId = defaultProps.orderId,
  orderDate = defaultProps.orderDate,
  items = defaultProps.items,
  shippingDetails = defaultProps.shippingDetails,
  subtotal = defaultProps.subtotal,
  totalShipping = defaultProps.totalShipping,
  totalBuyerProtection = defaultProps.totalBuyerProtection,
  discountAmount = defaultProps.discountAmount,
  discountCode = defaultProps.discountCode,
  pointsRedeemed = defaultProps.pointsRedeemed,
  pointsValue = defaultProps.pointsValue,
  grandTotal = defaultProps.grandTotal,
  currencySymbol = defaultProps.currencySymbol,
}: Partial<OrderPlacedEmailProps> = {}) => {
  const formattedDate = new Date(orderDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const hasDiscount = (discountAmount ?? 0) > 0
  const hasPointsRedeemed = (pointsRedeemed ?? 0) > 0 && (pointsValue ?? 0) > 0

  return (
    <>
      <Preview>Your DRES order #{orderId} has been placed</Preview>
      <EmailLayout preview={`Your DRES order #${orderId} has been placed`}>
        {/* Greeting */}
        <Text
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#000000',
            margin: '0 0 8px 0',
            textAlign: 'center',
          }}
        >
          Order Confirmed!
        </Text>
        <Text
          style={{
            fontSize: '14px',
            color: '#666666',
            margin: '0 0 24px 0',
            textAlign: 'center',
          }}
        >
          Thank you for your order, {customerName}
        </Text>

        {/* Order Info Box */}
        <Section
          style={{
            backgroundColor: '#F8F8F8',
            padding: '16px',
            marginBottom: '24px',
            borderRadius: '4px',
          }}
        >
          <Row>
            <Column>
              <Text style={{ margin: 0, fontSize: '12px', color: '#666666' }}>Order Number</Text>
              <Text style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: '#000000' }}>
                #{orderId}
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ margin: 0, fontSize: '12px', color: '#666666' }}>Order Date</Text>
              <Text style={{ margin: '4px 0 0 0', fontSize: '14px', fontWeight: 600, color: '#000000' }}>
                {formattedDate}
              </Text>
            </Column>
          </Row>
        </Section>

        {/* Order Items */}
        <Text
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#000000',
            margin: '0 0 16px 0',
          }}
        >
          Order Items
        </Text>

        {items.map((item) => (
          <OrderItemRow key={item.id} item={item} currencySymbol={currencySymbol} />
        ))}

        <Hr style={{ borderColor: '#E0E0E0', margin: '24px 0' }} />

        {/* Order Summary */}
        <Text
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#000000',
            margin: '0 0 16px 0',
          }}
        >
          Order Summary
        </Text>

        <Row style={{ marginBottom: '8px' }}>
          <Column>
            <Text style={{ margin: 0, fontSize: '14px', color: '#666666' }}>Subtotal</Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text style={{ margin: 0, fontSize: '14px', color: '#000000' }}>
              {currencySymbol} {subtotal.toFixed(2)}
            </Text>
          </Column>
        </Row>

        <Row style={{ marginBottom: '8px' }}>
          <Column>
            <Text style={{ margin: 0, fontSize: '14px', color: '#666666' }}>Shipping</Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text style={{ margin: 0, fontSize: '14px', color: '#000000' }}>
              {totalShipping > 0 ? `${currencySymbol} ${totalShipping.toFixed(2)}` : 'Free'}
            </Text>
          </Column>
        </Row>

        {totalBuyerProtection > 0 && (
          <Row style={{ marginBottom: '8px' }}>
            <Column>
              <Text style={{ margin: 0, fontSize: '14px', color: '#666666' }}>Buyer Protection</Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ margin: 0, fontSize: '14px', color: '#000000' }}>
                {currencySymbol} {totalBuyerProtection.toFixed(2)}
              </Text>
            </Column>
          </Row>
        )}

        {hasDiscount && (
          <Row style={{ marginBottom: '8px' }}>
            <Column>
              <Text style={{ margin: 0, fontSize: '14px', color: '#66BB6A' }}>
                Discount {discountCode ? `(${discountCode})` : ''}
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ margin: 0, fontSize: '14px', color: '#66BB6A' }}>
                -{currencySymbol} {(discountAmount ?? 0).toFixed(2)}
              </Text>
            </Column>
          </Row>
        )}

        {hasPointsRedeemed && (
          <Row style={{ marginBottom: '8px' }}>
            <Column>
              <Text style={{ margin: 0, fontSize: '14px', color: '#66BB6A' }}>
                Points Redeemed ({pointsRedeemed ?? 0} pts)
              </Text>
            </Column>
            <Column style={{ textAlign: 'right' }}>
              <Text style={{ margin: 0, fontSize: '14px', color: '#66BB6A' }}>
                -{currencySymbol} {(pointsValue ?? 0).toFixed(2)}
              </Text>
            </Column>
          </Row>
        )}

        <Hr style={{ borderColor: '#E0E0E0', margin: '16px 0' }} />

        <Row>
          <Column>
            <Text style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#000000' }}>
              Total
            </Text>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <Text style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#000000' }}>
              {currencySymbol} {grandTotal.toFixed(2)}
            </Text>
          </Column>
        </Row>

        <Hr style={{ borderColor: '#E0E0E0', margin: '24px 0' }} />

        {/* Shipping Address */}
        <Text
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#000000',
            margin: '0 0 12px 0',
          }}
        >
          Shipping Address
        </Text>

        <Section
          style={{
            backgroundColor: '#F8F8F8',
            padding: '16px',
            borderRadius: '4px',
            marginBottom: '24px',
          }}
        >
          {shippingDetails.fullName && (
            <Text style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#000000' }}>
              {shippingDetails.fullName}
            </Text>
          )}
          {shippingDetails.phone && (
            <Text style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#666666' }}>
              {shippingDetails.phone}
            </Text>
          )}
          {shippingDetails.address && (
            <Text style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#000000' }}>
              {shippingDetails.address}
            </Text>
          )}
          <Text style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#000000' }}>
            {[shippingDetails.city, shippingDetails.region, shippingDetails.postalCode]
              .filter(Boolean)
              .join(', ')}
          </Text>
          {shippingDetails.country && (
            <Text style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#000000' }}>
              {shippingDetails.country}
            </Text>
          )}
        </Section>

        {/* CTA Button */}
        <Section className="text-center">
          <Button
            href={`${appDeepLinkUrl}/orders/${id}`}
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              padding: '14px 0',
              textDecoration: 'none',
              display: 'inline-block',
              width: '220px',
              textAlign: 'center',
            }}
          >
            VIEW ORDER
          </Button>
        </Section>

        {/* Help Text */}
        <Text
          style={{
            fontSize: '12px',
            color: '#999999',
            margin: '24px 0 0 0',
            textAlign: 'center',
            lineHeight: '18px',
          }}
        >
          Need help with your order?{' '}
          <Link href={`${baseUrl}/help`} style={{ color: '#000000', textDecoration: 'underline' }}>
            Contact Support
          </Link>
        </Text>
      </EmailLayout>
    </>
  )
}

export default OrderPlacedEmail
