import { mongooseAdapter } from '@payloadcms/db-mongodb'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Attributes } from './collections/Attributes'
import { AttributeOptions } from './collections/AttributeOptions'
import { ProductBoosts } from './collections/Boosts'
import { Brands } from './collections/Brands'
import { Carts } from './collections/Carts'
import { Categories } from './collections/Categories'
import { Cities } from './collections/Cities'
import { Countries } from './collections/Countries'
import { Currencies } from './collections/Currencies'
import { Collections } from './collections/Collections'
import { Departments } from './collections/Departments'
import { DiscountCodes } from './collections/DiscountCodes'
import { Favorites } from './collections/Favorites'
import { Follows } from './collections/Follows'
import { Materials } from './collections/Materials'
import { Media } from './collections/Media'
import { Notifications } from './collections/Notifications'
import { Orders } from './collections/Orders'
import { Pages } from './collections/Pages'
import { PostCategories } from './collections/PostCategories'
import { Posts } from './collections/Posts'
import { Products } from './collections/Products'
import { ProductStats } from './collections/ProductStats'
import { Regions } from './collections/Regions'
import { Reviews } from './collections/Reviews'
import { ShippingRates } from './collections/ShippingRates'
import { Transactions } from './collections/Transactions'
import { Users } from './collections/Users'
import { Footer } from './Footer/config'
import { Header } from './Header/config'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { getServerSideURL } from './utilities/getURL'
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
  collections: [Pages, Posts, PostCategories, Media, Attributes, AttributeOptions, ProductBoosts, Brands, Carts, Categories, Cities, Collections, Countries, Currencies, Departments, DiscountCodes, Favorites, Follows, Materials, Notifications, Orders, Regions, ProductStats, Reviews, ShippingRates, Transactions, Users, Products],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [Header, Footer],
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
})
