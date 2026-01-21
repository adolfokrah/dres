import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Section,
  Text,
  Img,
  Font,
} from '@react-email/components'
import { Tailwind } from '@react-email/tailwind'
import * as React from 'react'

interface EmailLayoutProps {
  preview: string
  children: React.ReactNode
}

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://dres.app'

// Deep links for app navigation
const deepLinks = {
  newArrivals: `${baseUrl}/products?filterType=new-arrivals&title=New%20Arrivals`,
  men: `${baseUrl}/products?department=men&title=Men`,
  women: `${baseUrl}/products?department=women&title=Women`,
  kids: `${baseUrl}/products?department=kids&title=Kids`,
  sell: `${baseUrl}/sell`,
}

export const EmailLayout = ({ preview, children }: EmailLayoutProps) => {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Helvetica Neue"
          fallbackFontFamily="Arial"
          fontWeight={400}
          fontStyle="normal"
        />
      </Head>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                primary: '#000000',
                secondary: '#F8F8F8',
                background: '#FFFFFF',
                textPrimary: '#000000',
                textSecondary: '#666666',
                textHint: '#999999',
                border: '#E0E0E0',
                success: '#66BB6A',
                error: '#EF5350',
                warning: '#FFA726',
              },
            },
          },
        }}
      >
        <Body className="bg-[#f6f6f6] font-sans">
          <Container className="mx-auto max-w-[600px] py-5">
            {/* Header */}
            <Section className="bg-white px-6 py-4">
              {/* Logo */}
              <Section className="text-center mb-4">
                <Link href={baseUrl}>
                  <Img
                    src={`${baseUrl}/dres-logo.png`}
                    width="100"
                    height="auto"
                    alt="DRES"
                    className="mx-auto"
                  />
                </Link>
              </Section>

              {/* Navigation Menu */}
              <Section className="text-center py-3">
                <Text className="m-0 text-xs tracking-wider">
                  <Link
                    href={deepLinks.newArrivals}
                    className="text-textPrimary no-underline mx-3 font-medium"
                  >
                    NEW ARRIVALS
                  </Link>
                  <span className="text-textHint">|</span>
                  <Link
                    href={deepLinks.men}
                    className="text-textPrimary no-underline mx-3 font-medium"
                  >
                    MEN
                  </Link>
                  <span className="text-textHint">|</span>
                  <Link
                    href={deepLinks.women}
                    className="text-textPrimary no-underline mx-3 font-medium"
                  >
                    WOMEN
                  </Link>
                  <span className="text-textHint">|</span>
                  <Link
                    href={deepLinks.kids}
                    className="text-textPrimary no-underline mx-3 font-medium"
                  >
                    KIDS
                  </Link>
                  <span className="text-textHint">|</span>
                  <Link
                    href={deepLinks.sell}
                    className="text-textPrimary no-underline mx-3 font-medium"
                  >
                    SELL
                  </Link>
                </Text>
              </Section>
            </Section>

            {/* Main Content */}
            <Section className="bg-white px-8 py-8">{children}</Section>

            {/* Footer */}
            <Section className="bg-secondary px-6 py-8">
              {/* Footer Links */}
              <Text className="text-center text-textHint text-xs m-0 mb-6">
                <Link
                  href={`${baseUrl}/unsubscribe`}
                  className="text-textPrimary underline"
                >
                  Unsubscribe
                </Link>
                <span className="mx-3 text-textHint">|</span>
                <Link
                  href={`${baseUrl}/help`}
                  className="text-textPrimary underline"
                >
                  Help
                </Link>
                <span className="mx-3 text-textHint">|</span>
                <Link
                  href={`${baseUrl}/impressum`}
                  className="text-textPrimary underline"
                >
                  Impressum
                </Link>
              </Text>

              {/* Divider */}
              <Section className="border-t border-border my-4" />

              {/* Privacy Notice */}
              <Text className="text-textHint text-xs leading-5 m-0">
                Dres uses your personal data for direct marketing purposes. If you do not want to
                receive &quot;Marketing communications&quot; with personalised offers, news, and recommendations
                via email, you can click on &quot;unsubscribe&quot; above. To read up on your rights and more
                detailed information on how we use your personal data, please see our{' '}
                <Link
                  href={`${baseUrl}/privacy-policy`}
                  className="text-textPrimary underline"
                >
                  Privacy Policy
                </Link>
                .
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default EmailLayout
