import type { Payload } from 'payload'

// Helper to create proper Lexical paragraph node
const createParagraph = (text: string) => ({
  type: 'paragraph',
  children: [
    {
      type: 'text',
      text,
      format: 0,
      detail: 0,
      mode: 'normal',
      style: '',
      version: 1,
    },
  ],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  textFormat: 0,
  textStyle: '',
})

// Helper to create Lexical heading node
const createHeading = (text: string, tag: 'h1' | 'h2' | 'h3' = 'h2') => ({
  type: 'heading',
  tag,
  children: [
    {
      type: 'text',
      text,
      format: 0,
      detail: 0,
      mode: 'normal',
      style: '',
      version: 1,
    },
  ],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

// Privacy Policy content as Lexical nodes
const privacyPolicyContent = {
  root: {
    type: 'root',
    children: [
      createHeading('Privacy Policy', 'h1'),
      createParagraph('Last updated: January 2026'),
      createHeading('1. Introduction'),
      createParagraph('Welcome to DRES ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.'),
      createHeading('2. Information We Collect'),
      createParagraph('We collect information that you provide directly to us, including: Personal identification information (name, email address, phone number), billing and shipping addresses, payment information (processed securely through our payment providers), profile information and preferences, and communications with us and other users.'),
      createHeading('3. How We Use Your Information'),
      createParagraph('We use the information we collect to: Process and fulfill your orders, communicate with you about your account and transactions, send you marketing communications (with your consent), improve our services and user experience, and detect and prevent fraud.'),
      createHeading('4. Information Sharing'),
      createParagraph('We may share your information with third parties in the following situations: With sellers when you make a purchase, with payment processors to complete transactions, with shipping partners to deliver your orders, and when required by law or to protect our rights.'),
      createHeading('5. Data Security'),
      createParagraph('We implement appropriate technical and organizational security measures to protect your personal information. However, no method of transmission over the Internet is 100% secure, and we cannot guarantee absolute security.'),
      createHeading('6. Your Rights'),
      createParagraph('You have the right to: Access your personal data, correct inaccurate data, request deletion of your data, and opt out of marketing communications.'),
      createHeading('7. Contact Us'),
      createParagraph('If you have any questions about this Privacy Policy, please contact us at privacy@dres.app'),
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
}

// Terms of Service content as Lexical nodes
const termsOfServiceContent = {
  root: {
    type: 'root',
    children: [
      createHeading('Terms of Service', 'h1'),
      createParagraph('Last updated: January 2026'),
      createHeading('1. Acceptance of Terms'),
      createParagraph('By accessing or using DRES, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.'),
      createHeading('2. Description of Service'),
      createParagraph('DRES is an online marketplace that connects buyers and sellers of fashion items, with a focus on African fashion. We provide a platform for users to list, discover, and purchase clothing, accessories, and related products.'),
      createHeading('3. User Accounts'),
      createParagraph('To use certain features of our service, you must create an account. You are responsible for: Maintaining the confidentiality of your account credentials, all activities that occur under your account, providing accurate and complete information, and updating your information as needed.'),
      createHeading('4. Seller Responsibilities'),
      createParagraph('If you sell on DRES, you agree to: Provide accurate descriptions and images of your products, ship items within the specified timeframe, respond to buyer inquiries in a timely manner, comply with all applicable laws and regulations, and honor your listed prices and policies.'),
      createHeading('5. Buyer Responsibilities'),
      createParagraph('As a buyer, you agree to: Provide accurate shipping and payment information, pay for items you purchase, communicate with sellers in good faith, and report any issues through our resolution process.'),
      createHeading('6. Prohibited Activities'),
      createParagraph('You may not: List counterfeit or stolen items, misrepresent products or yourself, engage in fraud or deceptive practices, harass other users, circumvent our payment system, or violate any applicable laws.'),
      createHeading('7. Payments and Fees'),
      createParagraph('Buyers pay the listed price plus applicable shipping and taxes. Sellers pay a commission fee on completed sales. Payment processing is handled by our secure payment partners. Refunds are subject to our refund policy.'),
      createHeading('8. Intellectual Property'),
      createParagraph('DRES and its content are protected by intellectual property laws. Users retain ownership of content they create. By posting content, you grant DRES a license to use it on our platform.'),
      createHeading('9. Limitation of Liability'),
      createParagraph('DRES is not liable for: Disputes between buyers and sellers, quality or authenticity of items sold by third-party sellers, indirect, incidental, or consequential damages, or actions of users on the platform.'),
      createHeading('10. Dispute Resolution'),
      createParagraph('We encourage users to resolve disputes directly. Our support team can assist with mediation. Unresolved disputes may be subject to binding arbitration.'),
      createHeading('11. Changes to Terms'),
      createParagraph('We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the new terms.'),
      createHeading('12. Contact Us'),
      createParagraph('For questions about these Terms of Service, please contact us at legal@dres.app'),
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
}

export const seedLegalPages = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding Legal Pages...')

  try {
    // Delete existing Privacy Policy page if exists
    const existingPrivacy = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'privacy-policy' } },
      limit: 1,
    })

    if (existingPrivacy.docs.length > 0) {
      await payload.delete({
        collection: 'pages',
        id: existingPrivacy.docs[0].id,
      })
      payload.logger.info('Deleted existing Privacy Policy page')
    }

    // Create Privacy Policy page
    await payload.create({
      collection: 'pages',
      data: {
        title: 'Privacy Policy',
        slug: 'privacy-policy',
        _status: 'published',
        publishedAt: new Date().toISOString(),
        hero: {
          type: 'none',
        },
        layout: [
          {
            blockType: 'content',
            columns: [
              {
                size: 'full',
                richText: privacyPolicyContent,
              },
            ],
          },
        ],
        meta: {
          title: 'Privacy Policy | DRES',
          description:
            'Learn how DRES collects, uses, and protects your personal information. Read our privacy policy.',
        },
      },
    })
    payload.logger.info('Created Privacy Policy page')

    // Delete existing Terms of Service page if exists
    const existingTerms = await payload.find({
      collection: 'pages',
      where: { slug: { equals: 'terms-of-service' } },
      limit: 1,
    })

    if (existingTerms.docs.length > 0) {
      await payload.delete({
        collection: 'pages',
        id: existingTerms.docs[0].id,
      })
      payload.logger.info('Deleted existing Terms of Service page')
    }

    // Create Terms of Service page
    await payload.create({
      collection: 'pages',
      data: {
        title: 'Terms of Service',
        slug: 'terms-of-service',
        _status: 'published',
        publishedAt: new Date().toISOString(),
        hero: {
          type: 'none',
        },
        layout: [
          {
            blockType: 'content',
            columns: [
              {
                size: 'full',
                richText: termsOfServiceContent,
              },
            ],
          },
        ],
        meta: {
          title: 'Terms of Service | DRES',
          description:
            'Read the Terms of Service for using DRES marketplace. Learn about your rights and responsibilities.',
        },
      },
    })
    payload.logger.info('Created Terms of Service page')

    payload.logger.info('✅ Legal pages seeded successfully')
  } catch (error) {
    payload.logger.error(`❌ Error seeding legal pages: ${error}`)
    throw error
  }
}
