import type { Payload } from 'payload'
import path from 'path'
import fs from 'fs'

const SEED_IMAGES_DIR = path.resolve(process.cwd(), 'public/seed-images/men-home-page')

/**
 * Helper to upload an image from the seed-images folder
 */
async function uploadImage(
  payload: Payload,
  relativePath: string,
  altText: string
): Promise<string> {
  const fullPath = path.join(SEED_IMAGES_DIR, relativePath)
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Image not found: ${fullPath}`)
  }

  const fileBuffer = fs.readFileSync(fullPath)
  const fileName = path.basename(relativePath)
  const mimeType = fileName.endsWith('.png') ? 'image/png' : 'image/jpeg'

  const media = await payload.create({
    collection: 'media',
    data: {
      alt: altText,
      mediaFolder: 'pages', // Web page images go to 'pages' folder
    },
    file: {
      data: fileBuffer,
      mimetype: mimeType,
      name: fileName,
      size: fileBuffer.length,
    },
  })

  return media.id
}

/**
 * Get collection ID by name
 */
async function getCollectionId(payload: Payload, name: string): Promise<string | null> {
  const result = await payload.find({
    collection: 'collections',
    where: { name: { equals: name } },
    limit: 1,
  })
  return result.docs.length > 0 ? result.docs[0].id : null
}

/**
 * Get category ID by name (uses 'category' field)
 */
async function getCategoryId(payload: Payload, name: string): Promise<string | null> {
  const result = await payload.find({
    collection: 'categories',
    where: { category: { equals: name } },
    limit: 1,
  })
  return result.docs.length > 0 ? result.docs[0].id : null
}

/**
 * Get department ID by name
 */
async function getDepartmentId(payload: Payload, name: string): Promise<string | null> {
  const result = await payload.find({
    collection: 'departments',
    where: { name: { equals: name } },
    limit: 1,
  })
  return result.docs.length > 0 ? result.docs[0].id : null
}

export const seedMenHomePage = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding Men Home Page...')

  // Check if page already exists
  const existingPage = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home' } },
    limit: 1,
  })

  if (existingPage.docs.length > 0) {
    // Delete existing page
    await payload.delete({
      collection: 'pages',
      id: existingPage.docs[0].id,
    })
    payload.logger.info('Deleted existing men-home page')
  }

  // Get department ID for men
  const menDepartmentId = await getDepartmentId(payload, 'Men')
  if (!menDepartmentId) {
    throw new Error('Men department not found. Please seed departments first.')
  }

  payload.logger.info('Uploading images...')

  // Upload essential collections images
  const clothingImageId = await uploadImage(payload, 'essential-collections/clothing.png', 'Men Clothing')
  const shoesImageId = await uploadImage(payload, 'essential-collections/shoes.png', 'Men Shoes')
  const bagsImageId = await uploadImage(payload, 'essential-collections/bags.png', 'Men Bags')
  const accessoriesImageId = await uploadImage(payload, 'essential-collections/accesories.png', 'Men Accessories')
  const jewelryImageId = await uploadImage(payload, 'essential-collections/Jewelry.png', 'Men Jewelry')
  const watchesImageId = await uploadImage(payload, 'essential-collections/watches.png', 'Men Watches')

  // Upload top categories images
  const shirtsImageId = await uploadImage(payload, 'shop-by-category/shirts.png', 'Shirts')
  const tshirtsImageId = await uploadImage(payload, 'shop-by-category/t shirt.png', 'T-Shirts')
  const jeansImageId = await uploadImage(payload, 'shop-by-category/jeans.png', 'Jeans')
  const sneakersImageId = await uploadImage(payload, 'shop-by-category/sneakers.png', 'Sneakers')
  const suitsImageId = await uploadImage(payload, 'shop-by-category/suits.png', 'Suits')
  const africanPrintShirtsImageId = await uploadImage(payload, 'shop-by-category/African Print Shirts.png', 'African Print Shirts')
  const agbadaImageId = await uploadImage(payload, 'shop-by-category/Agbada.png', 'Agbada')
  const dashikiImageId = await uploadImage(payload, 'shop-by-category/Dashiki.png', 'Dashiki')
  const kenteImageId = await uploadImage(payload, 'shop-by-category/kente.png', 'Kente')
  const smockImageId = await uploadImage(payload, 'shop-by-category/smock.png', 'Batakari / Smock')

  // Upload best of accessories images
  const beltsImageId = await uploadImage(payload, 'best-of-accesories/belts.png', 'Belts')
  const sunglassesImageId = await uploadImage(payload, 'best-of-accesories/Sunglasses.png', 'Sunglasses')
  const hatsImageId = await uploadImage(payload, 'best-of-accesories/hats.png', 'Hats')
  const tiesImageId = await uploadImage(payload, 'best-of-accesories/tiers.png', 'Ties')
  const headwrapImageId = await uploadImage(payload, 'best-of-accesories/headwrap.png', 'Headwrap')

  // Upload update preferences image
  const updatePreferencesImageId = await uploadImage(payload, 'update-preferences/woman.jpg', 'Women Fashion')

  payload.logger.info('Getting collection and category IDs...')

  // Get collection IDs
  const clothingCollectionId = await getCollectionId(payload, 'Clothing')
  const shoesCollectionId = await getCollectionId(payload, 'Shoes')
  const bagsCollectionId = await getCollectionId(payload, 'Bags')
  const accessoriesCollectionId = await getCollectionId(payload, 'Accessories')
  const jewelryCollectionId = await getCollectionId(payload, 'Jewelry')
  const watchesCollectionId = await getCollectionId(payload, 'Watches')

  // Get category IDs for top categories
  const shirtsCategoryId = await getCategoryId(payload, 'Shirts')
  const tshirtsCategoryId = await getCategoryId(payload, 'T-Shirts')
  const jeansCategoryId = await getCategoryId(payload, 'Jeans')
  const sneakersCategoryId = await getCategoryId(payload, 'Sneakers')
  const suitsCategoryId = await getCategoryId(payload, 'Suits')
  const africanPrintShirtsCategoryId = await getCategoryId(payload, 'African Print Shirts')
  const agbadaCategoryId = await getCategoryId(payload, 'Agbada')
  const dashikiCategoryId = await getCategoryId(payload, 'Dashiki')
  const kenteCategoryId = await getCategoryId(payload, 'Kente')
  const smockCategoryId = await getCategoryId(payload, 'Batakari / Smock')

  // Get category IDs for accessories
  const beltsCategoryId = await getCategoryId(payload, 'Belts')
  const sunglassesCategoryId = await getCategoryId(payload, 'Sunglasses')
  const hatsCategoryId = await getCategoryId(payload, 'Hats')
  const tiesCategoryId = await getCategoryId(payload, 'Ties')
  const africanBeadsCategoryId = await getCategoryId(payload, 'Headwraps & Gele')

  payload.logger.info('Creating Men Home Page...')

  // Create the page with all blocks
  const page = await payload.create({
    collection: 'pages',
    data: {
      title: 'Men Home',
      slug: 'home',
      _status: 'published',
      publishedAt: new Date().toISOString(),
      hero: {
        type: 'none',
      },
      layout: [
        // 1. Promo Banner
        {
          blockType: 'promoBanner',
          title: 'First Time?',
          description: 'Shop: 10% off with code WELCOME. Sell: No fees to start.*',
          actionLink: {
            type: 'custom',
            label: 'Get started',
            url: '/discover/products?department=men',
          },
          backgroundColor: 'light',
        },

        // 2. Essential Collections
        {
          blockType: 'featuredGrid',
          title: 'Essential Collections',
          columns: '3',
          aspectRatio: 'portrait',
          items: [
            {
              image: clothingImageId,
              label: 'CLOTHING',
              link: `/discover/products?department=men&collection=${clothingCollectionId}&title=Clothing`,
            },
            {
              image: shoesImageId,
              label: 'SHOES',
              link: `/discover/products?department=men&collection=${shoesCollectionId}&title=Shoes`,
            },
            {
              image: bagsImageId,
              label: 'BAGS',
              link: `/discover/products?department=men&collection=${bagsCollectionId}&title=Bags`,
            },
            {
              image: accessoriesImageId,
              label: 'ACCESSORIES',
              link: `/discover/products?department=men&collection=${accessoriesCollectionId}&title=Accessories`,
            },
            {
              image: jewelryImageId,
              label: 'JEWELRY',
              link: `/discover/products?department=men&collection=${jewelryCollectionId}&title=Jewelry`,
            },
            {
              image: watchesImageId,
              label: 'WATCHES',
              link: `/discover/products?department=men&collection=${watchesCollectionId}&title=Watches`,
            },
          ],
        },

        // 3. New Arrivals
        {
          blockType: 'productArchive',
          title: 'New Arrivals',
          queryType: 'new-arrivals',
          department: 'men',
          showSeeAll: true,
          seeAllText: 'See all',
          limit: 8,
        },

        // 4. Now Trending
        {
          blockType: 'productArchive',
          title: 'Now Trending',
          queryType: 'trending',
          department: 'men',
          showSeeAll: true,
          seeAllText: 'See all',
          limit: 8,
        },

        // 5. Top Categories (10 best men categories)
        {
          blockType: 'featuredGrid',
          title: 'Top Categories',
          columns: '3',
          aspectRatio: 'portrait',
          items: [
            {
              image: shirtsImageId,
              label: 'SHIRTS',
              link: `/discover/products?department=men&category=${shirtsCategoryId}&title=Shirts`,
            },
            {
              image: tshirtsImageId,
              label: 'T-SHIRTS',
              link: `/discover/products?department=men&category=${tshirtsCategoryId}&title=T-Shirts`,
            },
            {
              image: jeansImageId,
              label: 'JEANS',
              link: `/discover/products?department=men&category=${jeansCategoryId}&title=Jeans`,
            },
            {
              image: sneakersImageId,
              label: 'SNEAKERS',
              link: `/discover/products?department=men&category=${sneakersCategoryId}&title=Sneakers`,
            },
            {
              image: suitsImageId,
              label: 'SUITS',
              link: `/discover/products?department=men&category=${suitsCategoryId}&title=Suits`,
            },
            {
              image: africanPrintShirtsImageId,
              label: 'AFRICAN PRINT SHIRTS',
              link: `/discover/products?department=men&category=${africanPrintShirtsCategoryId}&title=African Print Shirts`,
            },
            {
              image: agbadaImageId,
              label: 'AGBADA',
              link: `/discover/products?department=men&category=${agbadaCategoryId}&title=Agbada`,
            },
            {
              image: dashikiImageId,
              label: 'DASHIKI',
              link: `/discover/products?department=men&category=${dashikiCategoryId}&title=Dashiki`,
            },
            {
              image: kenteImageId,
              label: 'KENTE',
              link: `/discover/products?department=men&category=${kenteCategoryId}&title=Kente`,
            },
            {
              image: smockImageId,
              label: 'BATAKARI / SMOCK',
              link: `/discover/products?department=men&category=${smockCategoryId}&title=Batakari %2F Smock`,
            },
          ],
        },

        // 6. We Love
        {
          blockType: 'productArchive',
          title: 'We Love',
          queryType: 'featured',
          department: 'men',
          showSeeAll: true,
          seeAllText: 'See all',
          limit: 8,
        },

        // 7. Best of Accessories
        {
          blockType: 'featuredGrid',
          title: 'Best of Accessories',
          columns: '3',
          aspectRatio: 'portrait',
          items: [
            {
              image: beltsImageId,
              label: 'BELTS',
              link: `/discover/products?department=men&category=${beltsCategoryId}&title=Belts`,
            },
            {
              image: sunglassesImageId,
              label: 'SUNGLASSES',
              link: `/discover/products?department=men&category=${sunglassesCategoryId}&title=Sunglasses`,
            },
            {
              image: hatsImageId,
              label: 'HATS',
              link: `/discover/products?department=men&category=${hatsCategoryId}&title=Hats`,
            },
            {
              image: tiesImageId,
              label: 'TIES',
              link: `/discover/products?department=men&category=${tiesCategoryId}&title=Ties`,
            },
            {
              image: headwrapImageId,
              label: 'AFRICAN BEADS & JEWELRY',
              link: `/discover/products?department=men&category=${africanBeadsCategoryId}&title=African Beads %26 Jewelry`,
            },
          ],
        },

        // 8. Recently Viewed
        {
          blockType: 'productArchive',
          title: 'Recently Viewed',
          queryType: 'recently-viewed',
          department: 'men',
          showSeeAll: false,
          limit: 8,
        },

        // 9. Update Preferences CTA
        {
          blockType: 'cta',
          style: 'image',
          image: updatePreferencesImageId,
          title: 'Interested in Womenswear?',
          buttonText: 'Update preferences',
          buttonLink: '/preferences',
        },
      ],
    },
  })

  payload.logger.info(`✅ Men Home Page created with ID: ${page.id}`)
}
