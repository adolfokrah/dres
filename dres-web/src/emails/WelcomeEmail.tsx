import {
  Button,
  Img,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'
import { EmailLayout } from './components/EmailLayout'

const baseUrl = process.env.NEXT_PUBLIC_SERVER_URL || 'https://dres.app'

export const WelcomeEmail = () => {
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
            href={`${baseUrl}/products?department=women&title=Women`}
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
            href={`${baseUrl}/products?department=men&title=Men`}
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
            href={`${baseUrl}/sell`}
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
