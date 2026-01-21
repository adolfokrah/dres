import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface WelcomeEmailProps {
  firstName?: string
  loginUrl?: string
}

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://dres.app'

export const WelcomeEmail = ({
  firstName = 'there',
  loginUrl = `${baseUrl}/login`,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Preview>Welcome to Dres - Your fashion marketplace awaits</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo */}
          <Section style={logoSection}>
            <Img
              src={`${baseUrl}/logo.png`}
              width="80"
              height="80"
              alt="Dres"
              style={logo}
            />
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={heading}>Welcome to Dres!</Heading>

            <Text style={paragraph}>
              Hi {firstName},
            </Text>

            <Text style={paragraph}>
              We're thrilled to have you join the Dres community! Whether you're here to discover
              unique fashion pieces or share your style with the world, you've come to the right place.
            </Text>

            <Text style={paragraph}>
              Here's what you can do with Dres:
            </Text>

            <Section style={featureList}>
              <Text style={featureItem}>
                <strong>Shop</strong> - Browse curated collections from talented sellers
              </Text>
              <Text style={featureItem}>
                <strong>Sell</strong> - List your items and reach fashion-forward buyers
              </Text>
              <Text style={featureItem}>
                <strong>Connect</strong> - Follow your favorite sellers and get updates
              </Text>
            </Section>

            <Section style={buttonSection}>
              <Button style={button} href={loginUrl}>
                Start Exploring
              </Button>
            </Section>

            <Hr style={hr} />

            <Text style={paragraph}>
              Need help getting started? Check out our{' '}
              <Link href={`${baseUrl}/help`} style={link}>
                Help Center
              </Link>{' '}
              or reply to this email - we're always happy to help!
            </Text>

            <Text style={signoff}>
              Happy shopping,
              <br />
              The Dres Team
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Dres. All rights reserved.
            </Text>
            <Text style={footerLinks}>
              <Link href={`${baseUrl}/privacy`} style={footerLink}>
                Privacy Policy
              </Link>
              {' • '}
              <Link href={`${baseUrl}/terms`} style={footerLink}>
                Terms of Service
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Styles
const main = {
  backgroundColor: '#f6f6f6',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '580px',
}

const logoSection = {
  textAlign: 'center' as const,
  padding: '20px 0',
}

const logo = {
  margin: '0 auto',
}

const content = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  padding: '40px',
}

const heading = {
  color: '#1a1a1a',
  fontSize: '28px',
  fontWeight: '600',
  textAlign: 'center' as const,
  margin: '0 0 30px',
}

const paragraph = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 20px',
}

const featureList = {
  margin: '20px 0 30px',
  padding: '20px',
  backgroundColor: '#fafafa',
  borderRadius: '6px',
}

const featureItem = {
  color: '#4a4a4a',
  fontSize: '15px',
  lineHeight: '24px',
  margin: '0 0 12px',
}

const buttonSection = {
  textAlign: 'center' as const,
  margin: '30px 0',
}

const button = {
  backgroundColor: '#1a1a1a',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
  display: 'inline-block',
}

const hr = {
  borderColor: '#e6e6e6',
  margin: '30px 0',
}

const link = {
  color: '#1a1a1a',
  textDecoration: 'underline',
}

const signoff = {
  color: '#4a4a4a',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '20px 0 0',
}

const footer = {
  textAlign: 'center' as const,
  padding: '20px 0',
}

const footerText = {
  color: '#8c8c8c',
  fontSize: '13px',
  margin: '0 0 10px',
}

const footerLinks = {
  color: '#8c8c8c',
  fontSize: '13px',
  margin: '0',
}

const footerLink = {
  color: '#8c8c8c',
  textDecoration: 'underline',
}

export default WelcomeEmail
