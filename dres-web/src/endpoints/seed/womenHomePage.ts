import type { Payload } from 'payload'
import path from 'path'
import fs from 'fs'

const SEED_IMAGES_DIR = path.resolve(process.cwd(), 'public/seed-images/women-home-page')

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

export const seedWomenHomePage = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding Women Home Page...')

  // Check if page already exists
  const existingPage = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'home-women' } },
    limit: 1,
  })

  if (existingPage.docs.length > 0) {
    // Delete existing page
    await payload.delete({
      collection: 'pages',
      id: existingPage.docs[0].id,
    })
    payload.logger.info('Deleted existing women-home page')
  }

  // Get department ID for women
  const womenDepartmentId = await getDepartmentId(payload, 'Women')
  if (!womenDepartmentId) {
    throw new Error('Women department not found. Please seed departments first.')
  }

  payload.logger.info('Uploading images...')

  // Upload essential collections images (5 - no Jewelry for women, already a collection)
  const clothingImageId = await uploadImage(payload, 'essential-collections/clothing.png', 'Women Clothing')
  const shoesImageId = await uploadImage(payload, 'essential-collections/shoes.png', 'Women Shoes')
  const bagsImageId = await uploadImage(payload, 'essential-collections/bags.png', 'Women Bags')
  const accessoriesImageId = await uploadImage(payload, 'essential-collections/accesories.png', 'Women Accessories')
  const watchesImageId = await uploadImage(payload, 'essential-collections/watches.png', 'Women Watches')

  // Upload top categories images (10 categories)
  const dressesImageId = await uploadImage(payload, 'shop-by-category/dresses.png', 'Dresses')
  const africanPrintDressesImageId = await uploadImage(payload, 'shop-by-category/african print dres.png', 'African Print Dresses')
  const jeansImageId = await uploadImage(payload, 'shop-by-category/jeans.png', 'Jeans')
  const skirtsImageId = await uploadImage(payload, 'shop-by-category/skirts.png', 'Skirts')
  const blousesImageId = await uploadImage(payload, 'shop-by-category/Blouses.png', 'Blouses')
  const topsImageId = await uploadImage(payload, 'shop-by-category/tops.png', 'Tops')
  const heelsImageId = await uploadImage(payload, 'shop-by-category/heels.png', 'Heels')
  const sandalsImageId = await uploadImage(payload, 'shop-by-category/sandals.png', 'Sandals')
  const handbagsImageId = await uploadImage(payload, 'shop-by-category/handbags.png', 'Handbags')
  const wigsImageId = await uploadImage(payload, 'shop-by-category/wig.png', 'Wigs')

  // Upload best of accessories images (5 accessories)
  const wigsAccImageId = await uploadImage(payload, 'best-of-accesories/wigs.png', 'Wigs')
  const beadsImageId = await uploadImage(payload, 'best-of-accesories/beads.png', 'African Beads & Jewelry')
  const sunglassesImageId = await uploadImage(payload, 'best-of-accesories/sun-glasses.png', 'Sunglasses')
  const beltsImageId = await uploadImage(payload, 'best-of-accesories/belts.png', 'Belts')
  const scarvesImageId = await uploadImage(payload, 'best-of-accesories/scarves.png', 'Scarves')

  // Upload update preferences image
  const updatePreferencesImageId = await uploadImage(payload, 'update-preferences/men.jpeg', 'Men Fashion')

  payload.logger.info('Getting collection and category IDs...')

  // Get collection IDs
  const clothingCollectionId = await getCollectionId(payload, 'Clothing')
  const shoesCollectionId = await getCollectionId(payload, 'Shoes')
  const bagsCollectionId = await getCollectionId(payload, 'Bags')
  const accessoriesCollectionId = await getCollectionId(payload, 'Accessories')
  const watchesCollectionId = await getCollectionId(payload, 'Watches')

  // Get category IDs for top categories
  const dressesCategoryId = await getCategoryId(payload, 'Dresses')
  const africanPrintDressesCategoryId = await getCategoryId(payload, 'African Print Dresses')
  const jeansCategoryId = await getCategoryId(payload, 'Jeans')
  const skirtsCategoryId = await getCategoryId(payload, 'Skirts')
  const blousesCategoryId = await getCategoryId(payload, 'Blouses')
  const topsCategoryId = await getCategoryId(payload, 'Tops')
  const heelsCategoryId = await getCategoryId(payload, 'Heels')
  const sandalsCategoryId = await getCategoryId(payload, 'Sandals')
  const handbagsCategoryId = await getCategoryId(payload, 'Handbags')
  const wigsCategoryId = await getCategoryId(payload, 'Wigs')

  // Get category IDs for accessories
  const beadsCategoryId = await getCategoryId(payload, 'African Beads & Jewelry')
  const sunglassesCategoryId = await getCategoryId(payload, 'Sunglasses')
  const beltsCategoryId = await getCategoryId(payload, 'Belts')
  const scarvesCategoryId = await getCategoryId(payload, 'Scarves')

  payload.logger.info('Creating Women Home Page...')

  // Create the page with all blocks
  const page = await payload.create({
    collection: 'pages',
    data: {
      title: 'Women Home',
      slug: 'home-women',
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
            url: '/discover/products?department=women',
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
              link: `/discover/products?department=women&collection=${clothingCollectionId}&title=Clothing`,
            },
            {
              image: shoesImageId,
              label: 'SHOES',
              link: `/discover/products?department=women&collection=${shoesCollectionId}&title=Shoes`,
            },
            {
              image: bagsImageId,
              label: 'BAGS',
              link: `/discover/products?department=women&collection=${bagsCollectionId}&title=Bags`,
            },
            {
              image: accessoriesImageId,
              label: 'ACCESSORIES',
              link: `/discover/products?department=women&collection=${accessoriesCollectionId}&title=Accessories`,
            },
            {
              image: watchesImageId,
              label: 'WATCHES',
              link: `/discover/products?department=women&collection=${watchesCollectionId}&title=Watches`,
            },
          ],
        },

        // 3. New Arrivals
        {
          blockType: 'productArchive',
          title: 'New Arrivals',
          queryType: 'new-arrivals',
          department: 'women',
          showSeeAll: true,
          seeAllText: 'See all',
          limit: 8,
        },

        // 4. Now Trending
        {
          blockType: 'productArchive',
          title: 'Now Trending',
          queryType: 'trending',
          department: 'women',
          showSeeAll: true,
          seeAllText: 'See all',
          limit: 8,
        },

        // 5. Top Categories (10 best women categories)
        {
          blockType: 'featuredGrid',
          title: 'Top Categories',
          columns: '3',
          aspectRatio: 'portrait',
          items: [
            {
              image: dressesImageId,
              label: 'DRESSES',
              link: `/discover/products?department=women&category=${dressesCategoryId}&title=Dresses`,
            },
            {
              image: africanPrintDressesImageId,
              label: 'AFRICAN PRINT DRESSES',
              link: `/discover/products?department=women&category=${africanPrintDressesCategoryId}&title=African Print Dresses`,
            },
            {
              image: jeansImageId,
              label: 'JEANS',
              link: `/discover/products?department=women&category=${jeansCategoryId}&title=Jeans`,
            },
            {
              image: skirtsImageId,
              label: 'SKIRTS',
              link: `/discover/products?department=women&category=${skirtsCategoryId}&title=Skirts`,
            },
            {
              image: blousesImageId,
              label: 'BLOUSES',
              link: `/discover/products?department=women&category=${blousesCategoryId}&title=Blouses`,
            },
            {
              image: topsImageId,
              label: 'TOPS',
              link: `/discover/products?department=women&category=${topsCategoryId}&title=Tops`,
            },
            {
              image: heelsImageId,
              label: 'HEELS',
              link: `/discover/products?department=women&category=${heelsCategoryId}&title=Heels`,
            },
            {
              image: sandalsImageId,
              label: 'SANDALS',
              link: `/discover/products?department=women&category=${sandalsCategoryId}&title=Sandals`,
            },
            {
              image: handbagsImageId,
              label: 'HANDBAGS',
              link: `/discover/products?department=women&category=${handbagsCategoryId}&title=Handbags`,
            },
            {
              image: wigsImageId,
              label: 'WIGS',
              link: `/discover/products?department=women&category=${wigsCategoryId}&title=Wigs`,
            },
          ],
        },

        // 6. We Love
        {
          blockType: 'productArchive',
          title: 'We Love',
          queryType: 'featured',
          department: 'women',
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
              image: wigsAccImageId,
              label: 'WIGS',
              link: `/discover/products?department=women&category=${wigsCategoryId}&title=Wigs`,
            },
            {
              image: beadsImageId,
              label: 'AFRICAN BEADS & JEWELRY',
              link: `/discover/products?department=women&category=${beadsCategoryId}&title=African Beads %26 Jewelry`,
            },
            {
              image: sunglassesImageId,
              label: 'SUNGLASSES',
              link: `/discover/products?department=women&category=${sunglassesCategoryId}&title=Sunglasses`,
            },
            {
              image: beltsImageId,
              label: 'BELTS',
              link: `/discover/products?department=women&category=${beltsCategoryId}&title=Belts`,
            },
            {
              image: scarvesImageId,
              label: 'SCARVES',
              link: `/discover/products?department=women&category=${scarvesCategoryId}&title=Scarves`,
            },
          ],
        },

        // 8. Recently Viewed
        {
          blockType: 'productArchive',
          title: 'Recently Viewed',
          queryType: 'recently-viewed',
          department: 'women',
          showSeeAll: false,
          limit: 8,
        },

        // 9. Update Preferences CTA
        {
          blockType: 'cta',
          style: 'image',
          image: updatePreferencesImageId,
          title: 'Interested in Menswear?',
          buttonText: 'Update preferences',
          buttonLink: '/preferences',
        },
      ],
    },
  })

  payload.logger.info(`✅ Women Home Page created with ID: ${page.id}`)
}
