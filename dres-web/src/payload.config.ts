import { mongooseAdapter } from '@payloadcms/db-mongodb'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'
import { resendAdapter } from '@payloadcms/email-resend'

// Analytics
import { VariationStats } from './collections/VariationStats'
import { VariationViews } from './collections/VariationViews'

// Catalog
import { Attributes } from './collections/Attributes'
import { AttributeOptions } from './collections/AttributeOptions'
import { Brands } from './collections/Brands'
import { Categories } from './collections/Categories'
import { Collections } from './collections/Collections'
import { Departments } from './collections/Departments'
import { Materials } from './collections/Materials'
import { SKUs } from './collections/SKUs'
import { Styles } from './collections/Styles'
import { Variations } from './collections/Variations'

// Content
import { Media } from './collections/Media'
import { Pages } from './collections/Pages'
import { PostCategories } from './collections/PostCategories'
import { Posts } from './collections/Posts'

// Locations
import { Cities } from './collections/Cities'
import { Countries } from './collections/Countries'
import { Regions } from './collections/Regions'

// Orders
import { Carts } from './collections/Carts'
import { DeliveryCodes } from './collections/DeliveryCodes'
import { DiscountCodes } from './collections/DiscountCodes'
import { Orders } from './collections/Orders'
import { ShippingRates } from './collections/ShippingRates'
import { Transactions } from './collections/Transactions'

// Settings
import { Currencies } from './collections/Currencies'

// Users
import { Favorites } from './collections/Favorites'
import { Follows } from './collections/Follows'
import { Notifications } from './collections/Notifications'
import { Reviews } from './collections/Reviews'
import { StyleBoosts } from './collections/StyleBoosts'
import { UserPoints } from './collections/UserPoints'
import { Users } from './collections/Users'

import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { SiteSettings } from './globals/SiteSettings'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
import { getMenu } from './endpoints/menu'
import { getSiteSettings } from './endpoints/siteSettings'
import { search } from './endpoints/search'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    components: {
      // The `BeforeLogin` component renders a message that you see while logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeLogin: ['@/components/BeforeLogin'],
      // The `BeforeDashboard` component renders the 'welcome' block that you see after logging into your admin panel.
      // Feel free to delete this at any time. Simply remove the line below.
      beforeDashboard: ['@/components/BeforeDashboard'],
    },
    autoRefresh: true,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || '',
  }),
  localization: {
    locales: [
      {
        label: 'English',
        code: 'en',
      },
      {
        label: 'Français',
        code: 'fr',
      },
      {
        label: 'Deutsch',
        code: 'de',
      },
      {
        label: 'Español',
        code: 'es',
      },
      {
        label: 'Italiano',
        code: 'it',
      },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [
    // Analytics
    VariationStats,
    VariationViews,
    // Catalog
    Attributes,
    AttributeOptions,
    Brands,
    Categories,
    Collections,
    Departments,
    Materials,
    SKUs,
    Styles,
    Variations,
    // Content
    Media,
    Pages,
    PostCategories,
    Posts,
    // Locations
    Cities,
    Countries,
    Regions,
    // Orders
    Carts,
    DeliveryCodes,
    DiscountCodes,
    Orders,
    ShippingRates,
    Transactions,
    // Settings
    Currencies,
    // Users
    Favorites,
    Follows,
    Notifications,
    Reviews,
    StyleBoosts,
    UserPoints,
    Users,
  ],
  cors: [getServerSideURL()].filter(Boolean),
  endpoints: [
    {
      path: '/menu',
      method: 'get',
      handler: getMenu,
    },
    {
      path: '/site-settings',
      method: 'get',
      handler: getSiteSettings,
    },
    {
      path: '/search-items',
      method: 'get',
      handler: search,
    },
  ],
  globals: [Header, Footer, SiteSettings],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${process.env.CRON_SECRET}`
      },
    },
    tasks: [],
  },
  email: resendAdapter({
    defaultFromAddress: 'onboarding@resend.dev', // Use Resend's test address until domain is verified
    defaultFromName: 'Dres',
    apiKey: process.env.RESEND_API_KEY || '',
  })
})
