import {
  Button,
  Column,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

// Use base URL for assets (images), but app deep link URL for clickable links
const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://dres.app'
// Always use dres.app (without www) for deep links to match app's universal link config
const appDeepLinkUrl = 'https://dres.app'

// Product type from filtered endpoint
export interface FilteredProduct {
  id: string
  thumbnail: string | null
  title: string
  slug: string
  category: string | null
  brand: string | null
  sellingPrice: number
  compareAtPrice?: number
  currency: { code: string; symbol: string } | null
}

// Product card component for email
interface ProductCardProps {
  product: FilteredProduct
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { thumbnail, brand, title, sellingPrice, compareAtPrice, currency, slug } = product
  const currencySymbol = currency?.symbol || currency?.code || 'GHS'
  const imageUrl = thumbnail
    ? thumbnail.startsWith('http')
      ? thumbnail
      : `${baseUrl}${thumbnail}`
    : `${baseUrl}/placeholder.png`

  return (
    <Link href={`${appDeepLinkUrl}/products/${slug}`} style={{ textDecoration: 'none' }}>
      <div style={{ border: '1px solid #000000', backgroundColor: '#ffffff', height: '100%' }}>
        {/* Fixed height image container */}
        <div style={{ width: '100%', height: '150px', overflow: 'hidden', backgroundColor: '#f5f5f5' }}>
          <Img
            src={imageUrl}
            width="150"
            height="150"
            alt={title}
            style={{ display: 'block', width: '100%', height: '150px', objectFit: 'contain' }}
          />
        </div>
        {/* Fixed height content area */}
        <div style={{ padding: '12px', height: '110px' }}>
          <Text
            style={{
              margin: 0,
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#000000',
              lineHeight: '14px',
            }}
          >
            {brand || 'DRES'}
          </Text>
          <Text
            style={{
              margin: '4px 0',
              fontSize: '12px',
              color: '#000000',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: '16px',
            }}
          >
            {title}
          </Text>
          <Text style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#000000', lineHeight: '18px' }}>
            {currencySymbol} {sellingPrice.toFixed(2)}
          </Text>
          {compareAtPrice && compareAtPrice > sellingPrice ? (
            <Text
              style={{
                margin: '2px 0 0 0',
                fontSize: '11px',
                color: '#EF5350',
                textDecoration: 'line-through',
                lineHeight: '14px',
              }}
            >
              {currencySymbol} {compareAtPrice.toFixed(2)}
            </Text>
          ) : (
            <Text style={{ margin: '2px 0 0 0', fontSize: '11px', lineHeight: '14px' }}>&nbsp;</Text>
          )}
        </div>
      </div>
    </Link>
  )
}

interface WelcomeEmailProps {
  saleProducts?: FilteredProduct[]
}

export const WelcomeEmail = ({ saleProducts = [] }: WelcomeEmailProps) => {
  // Show section if we have at least 3 products (one row)
  const showSaleSection = saleProducts.length >= 3
  // Show second row only if we have 6+ products
  const showSecondRow = saleProducts.length >= 6

  return (
    <>
      <Preview>Welcome to Dres - Your fashion marketplace awaits</Preview>
      <EmailLayout preview="Welcome to Dres - Your fashion marketplace awaits">
        {/* Hero Banner */}
        <Section className="mb-6">
          <Img
            src="https://www.dres.app/api/media/file/image.png"
            width="100%"
            alt="Welcome to Dres"
            className="w-full"
          />
        </Section>

        <Text className="text-textSecondary text-base leading-7 m-0 mb-4 text-center">
          Welcome to Dres, your new favorite fashion marketplace. Discover unique
          pieces from sellers around the world, or start selling your own style.
          The more you browse, the better we get at showing you exactly what you love!
        </Text>

        {/* CTA Buttons */}
        <Section className="text-center mb-4">
          <Button
            href={`${appDeepLinkUrl}/products?department=women&title=Women`}
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              padding: '12px 0',
              textDecoration: 'none',
              display: 'inline-block',
              width: '220px',
              textAlign: 'center',
            }}
          >
            SHOP WOMENSWEAR
          </Button>
        </Section>

        <Section className="text-center mb-4">
          <Button
            href={`${appDeepLinkUrl}/products?department=men&title=Men`}
            style={{
              backgroundColor: '#000000',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '14px',
              padding: '12px 0',
              textDecoration: 'none',
              display: 'inline-block',
              width: '220px',
              textAlign: 'center',
            }}
          >
            SHOP MENSWEAR
          </Button>
        </Section>

        {/* On Sale Products Section */}
        {showSaleSection && (
          <Section className="mt-8">
            <Text
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: '#000000',
                margin: '0 0 16px 0',
                textAlign: 'center',
              }}
            >
              On Sale Now
            </Text>

            {/* Product Grid - First row (always shown if section is visible) */}
            <Row style={{ marginBottom: showSecondRow ? '12px' : '0', tableLayout: 'fixed', width: '100%' }}>
              <Column style={{ width: '33.33%', paddingRight: '4px', verticalAlign: 'top' }}>
                <ProductCard product={saleProducts[0]} />
              </Column>
              <Column style={{ width: '33.33%', paddingLeft: '4px', paddingRight: '4px', verticalAlign: 'top' }}>
                <ProductCard product={saleProducts[1]} />
              </Column>
              <Column style={{ width: '33.33%', paddingLeft: '4px', verticalAlign: 'top' }}>
                <ProductCard product={saleProducts[2]} />
              </Column>
            </Row>

            {/* Second row - only shown if 6+ products */}
            {showSecondRow && (
              <Row style={{ tableLayout: 'fixed', width: '100%' }}>
                <Column style={{ width: '33.33%', paddingRight: '4px', verticalAlign: 'top' }}>
                  <ProductCard product={saleProducts[3]} />
                </Column>
                <Column style={{ width: '33.33%', paddingLeft: '4px', paddingRight: '4px', verticalAlign: 'top' }}>
                  <ProductCard product={saleProducts[4]} />
                </Column>
                <Column style={{ width: '33.33%', paddingLeft: '4px', verticalAlign: 'top' }}>
                  <ProductCard product={saleProducts[5]} />
                </Column>
              </Row>
            )}

            {/* See More Button */}
            <Section className="text-center mt-6">
              <Button
                href={`${appDeepLinkUrl}/products?filterType=on-sale&title=On%20Sale`}
                style={{
                  backgroundColor: '#ffffff',
                  color: '#000000',
                  fontWeight: 600,
                  fontSize: '14px',
                  padding: '12px 0',
                  textDecoration: 'none',
                  display: 'inline-block',
                  width: '220px',
                  textAlign: 'center',
                  border: '2px solid #000000',
                }}
              >
                SEE MORE
              </Button>
            </Section>
          </Section>
        )}

        {/* Make Some Money Section */}
        <Section className="mt-8 mb-6">
          <Img
            src="https://www.dres.app/api/media/file/image-1.png"
            width="100%"
            alt="Make Some Money"
            className="w-full"
          />
        </Section>

        <Text className="text-textSecondary text-base leading-7 m-0 mb-4 text-center">
          Turn your closet into cash. Selling on Dres is simple — snap a few photos,
          set your price, and reach buyers who love your style. Start listing today
          and watch your wardrobe work for you.
        </Text>

        <Section className="text-center mb-4">
          <Button
            href={`${appDeepLinkUrl}/sell`}
            style={{
              backgroundColor: '#ffffff',
              color: '#000000',
              fontWeight: 600,
              fontSize: '14px',
              padding: '12px 0',
              textDecoration: 'none',
              display: 'inline-block',
              width: '220px',
              textAlign: 'center',
              border: '2px solid #000000',
            }}
          >
            LET&apos;S GO
          </Button>
        </Section>
      </EmailLayout>
    </>
  )
}

export default WelcomeEmail
