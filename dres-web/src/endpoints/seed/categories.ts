import type { Payload } from 'payload'

// Categories with their collection, department and brand mappings
const categoriesData = [
  // Clothing Categories
  { title: 'Coats', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Burberry', 'Max Mara', 'Moncler', 'Canada Goose', 'The North Face', 'Prada', 'Gucci'] },
  { title: 'Jackets', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['The North Face', 'Patagonia', 'Nike', 'Adidas', 'Stone Island', 'Moncler', 'Balmain'] },
  { title: 'Dresses', collections: ['Clothing'], departments: ['Women', 'Kids'], brands: ['Dior', 'Valentino', 'Oscar de la Renta', 'Carolina Herrera', 'Reformation', 'Zara', 'H&M'] },
  { title: 'Tops', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Zara', 'H&M', 'Uniqlo', 'COS', 'Acne Studios', 'Theory', 'Vince'] },
  { title: 'Shirts', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Ralph Lauren', 'Hugo Boss', 'Tommy Hilfiger', 'Uniqlo', 'Massimo Dutti', 'Paul Smith'] },
  { title: 'Blouses', collections: ['Clothing'], departments: ['Women'], brands: ['Chanel', 'Saint Laurent', 'Equipment', 'Sandro', 'Maje', 'Reformation'] },
  { title: 'T-Shirts', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Supreme', 'Off-White', 'Acne Studios', 'A.P.C.', 'Nike', 'Adidas', 'Uniqlo'] },
  { title: 'Sweaters', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Loro Piana', 'Brunello Cucinelli', 'Acne Studios', 'COS', 'Ralph Lauren', 'Uniqlo'] },
  { title: 'Cardigans', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Chanel', 'Prada', 'COS', 'Uniqlo', 'J.Crew', 'Everlane'] },
  { title: 'Pants', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Zara', 'H&M', 'Uniqlo', 'Theory', 'Hugo Boss', 'Massimo Dutti'] },
  { title: 'Jeans', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ["Levi's", 'Diesel', 'G-Star Raw', 'Citizens of Humanity', 'AG Jeans', 'Frame', 'Mother Denim'] },
  { title: 'Shorts', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Nike', 'Adidas', "Levi's", 'H&M', 'Zara', 'Gap'] },
  { title: 'Skirts', collections: ['Clothing'], departments: ['Women', 'Kids'], brands: ['Prada', 'Miu Miu', 'Zara', 'H&M', 'Reformation', 'Sandro'] },
  { title: 'Suits', collections: ['Clothing'], departments: ['Women', 'Men'], brands: ['Hugo Boss', 'Armani', 'Tom Ford', 'Ralph Lauren', 'Thom Browne', 'Zara'] },
  { title: 'Blazers', collections: ['Clothing'], departments: ['Women', 'Men'], brands: ['Balmain', 'Saint Laurent', 'Theory', 'Massimo Dutti', 'Zara', 'Hugo Boss'] },
  { title: 'Trench Coats', collections: ['Clothing'], departments: ['Women', 'Men'], brands: ['Burberry', 'Max Mara', 'Aquascutum', 'Zara', 'Massimo Dutti'] },
  { title: 'Knitwear', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Missoni', 'Acne Studios', 'COS', 'Uniqlo', 'J.Crew', 'Ralph Lauren'] },
  { title: 'Swimwear', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Eres', 'Zimmermann', 'Solid & Striped', 'Vilebrequin', 'Orlebar Brown', 'Speedo'] },
  { title: 'Lingerie', collections: ['Clothing'], departments: ['Women'], brands: ['Agent Provocateur', 'La Perla', "Victoria's Secret", 'Fleur du Mal', 'Chantelle'] },
  { title: 'Activewear', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Lululemon', 'Nike', 'Adidas', 'Gymshark', 'Alo Yoga', 'Under Armour'] },

  // Bags Categories
  { title: 'Handbags', collections: ['Bags'], departments: ['Women'], brands: ['Hermès', 'Chanel', 'Louis Vuitton', 'Gucci', 'Prada', 'Bottega Veneta', 'Celine'] },
  { title: 'Shoulder Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Gucci', 'Saint Laurent', 'Prada', 'Balenciaga', 'Coach', 'Michael Kors'] },
  { title: 'Crossbody Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Louis Vuitton', 'Gucci', 'Coach', 'Kate Spade', 'Michael Kors', 'Marc Jacobs'] },
  { title: 'Tote Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Goyard', 'Louis Vuitton', 'Tory Burch', 'Longchamp', 'Coach', 'Celine'] },
  { title: 'Clutches', collections: ['Bags'], departments: ['Women'], brands: ['Bottega Veneta', 'Jimmy Choo', 'Alexander McQueen', 'Saint Laurent', 'Judith Leiber'] },
  { title: 'Backpacks', collections: ['Bags'], departments: ['Women', 'Men', 'Kids'], brands: ['Louis Vuitton', 'Gucci', 'Prada', 'The North Face', 'Fjällräven', 'Herschel'] },
  { title: 'Travel Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Louis Vuitton', 'Rimowa', 'Tumi', 'Hermès', 'Gucci', 'Prada'] },
  { title: 'Wallets', collections: ['Bags', 'Accessories'], departments: ['Women', 'Men'], brands: ['Louis Vuitton', 'Gucci', 'Chanel', 'Hermès', 'Prada', 'Bottega Veneta'] },
  { title: 'Belt Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Gucci', 'Louis Vuitton', 'Prada', 'Fendi', 'Burberry', 'Balenciaga'] },

  // Shoes Categories
  { title: 'Sneakers', collections: ['Shoes'], departments: ['Women', 'Men', 'Kids'], brands: ['Nike', 'Adidas', 'New Balance', 'Converse', 'Vans', 'Jordan', 'Puma'] },
  { title: 'Boots', collections: ['Shoes'], departments: ['Women', 'Men', 'Kids'], brands: ['Dr. Martens', 'Timberland', 'UGG', 'Stuart Weitzman', 'Gianvito Rossi', 'Prada'] },
  { title: 'Ankle Boots', collections: ['Shoes'], departments: ['Women', 'Men'], brands: ['Celine', 'Saint Laurent', 'Acne Studios', 'Dr. Martens', 'Isabel Marant', 'Ganni'] },
  { title: 'Heels', collections: ['Shoes'], departments: ['Women'], brands: ['Christian Louboutin', 'Jimmy Choo', 'Manolo Blahnik', 'Stuart Weitzman', 'Gianvito Rossi'] },
  { title: 'Pumps', collections: ['Shoes'], departments: ['Women'], brands: ['Christian Louboutin', 'Jimmy Choo', 'Manolo Blahnik', 'Prada', 'Gucci', 'Saint Laurent'] },
  { title: 'Sandals', collections: ['Shoes'], departments: ['Women', 'Men', 'Kids'], brands: ['Birkenstock', 'Hermès', 'Chanel', 'Gucci', 'Valentino', 'Ancient Greek Sandals'] },
  { title: 'Flats', collections: ['Shoes'], departments: ['Women', 'Kids'], brands: ['Chanel', 'Tory Burch', 'Repetto', 'Sam Edelman', "Rothy's", 'Gucci'] },
  { title: 'Loafers', collections: ['Shoes'], departments: ['Women', 'Men'], brands: ['Gucci', "Tod's", "Church's", 'G.H. Bass', 'Prada', 'Salvatore Ferragamo'] },
  { title: 'Mules', collections: ['Shoes'], departments: ['Women'], brands: ['Gucci', 'Bottega Veneta', 'The Row', 'By Far', 'Malone Souliers'] },
  { title: 'Espadrilles', collections: ['Shoes'], departments: ['Women', 'Men'], brands: ['Castañer', 'Chanel', 'Saint Laurent', 'Soludos', 'Tory Burch'] },

  // Accessories Categories
  { title: 'Belts', collections: ['Accessories'], departments: ['Women', 'Men'], brands: ['Gucci', 'Hermès', 'Louis Vuitton', 'Bottega Veneta', 'Salvatore Ferragamo', 'Prada'] },
  { title: 'Scarves', collections: ['Accessories'], departments: ['Women', 'Men'], brands: ['Hermès', 'Louis Vuitton', 'Gucci', 'Burberry', 'Loro Piana', 'Acne Studios'] },
  { title: 'Hats', collections: ['Accessories'], departments: ['Women', 'Men', 'Kids'], brands: ['Gucci', 'Prada', 'Jacquemus', 'Maison Michel', 'Lack of Color', 'New Era'] },
  { title: 'Sunglasses', collections: ['Accessories'], departments: ['Women', 'Men', 'Kids'], brands: ['Ray-Ban', 'Oakley', 'Gucci', 'Prada', 'Dior', 'Celine', 'Tom Ford'] },
  { title: 'Gloves', collections: ['Accessories'], departments: ['Women', 'Men'], brands: ['Hermès', 'Bottega Veneta', 'Prada', 'Burberry', 'Dents', 'Mulberry'] },
  { title: 'Hair Accessories', collections: ['Accessories'], departments: ['Women', 'Kids'], brands: ['Chanel', 'Prada', 'Gucci', 'Alexandre de Paris', 'Jennifer Behr'] },
  { title: 'Ties', collections: ['Accessories'], departments: ['Men'], brands: ['Hermès', 'Gucci', 'Dior', 'Tom Ford', 'Brioni', 'Salvatore Ferragamo'] },
  { title: 'Pocket Squares', collections: ['Accessories'], departments: ['Men'], brands: ['Hermès', "Drake's", 'Tom Ford', 'Turnbull & Asser', 'Charvet'] },

  // Jewelry Categories
  { title: 'Necklaces', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['Cartier', 'Tiffany & Co.', 'Van Cleef & Arpels', 'Bulgari', 'Chanel', 'Dior'] },
  { title: 'Bracelets', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['Cartier', 'Tiffany & Co.', 'Van Cleef & Arpels', 'Hermès', 'Bulgari', 'David Yurman'] },
  { title: 'Earrings', collections: ['Jewelry'], departments: ['Women'], brands: ['Cartier', 'Tiffany & Co.', 'Van Cleef & Arpels', 'Chanel', 'Dior', 'Celine'] },
  { title: 'Rings', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['Cartier', 'Tiffany & Co.', 'Van Cleef & Arpels', 'Bulgari', 'Harry Winston', 'Pomellato'] },
  { title: 'Brooches', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['Chanel', 'Van Cleef & Arpels', 'Cartier', 'Dior', 'Gucci'] },
  { title: 'Cufflinks', collections: ['Jewelry', 'Accessories'], departments: ['Men'], brands: ['Cartier', 'Montblanc', 'Tom Ford', 'Tiffany & Co.', 'Dunhill'] },

  // Watch Categories
  { title: 'Luxury Watches', collections: ['Watches'], departments: ['Women', 'Men'], brands: ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'Cartier', 'IWC'] },
  { title: 'Sport Watches', collections: ['Watches'], departments: ['Women', 'Men'], brands: ['Rolex', 'Omega', 'TAG Heuer', 'Breitling', 'Tudor', 'Longines'] },
  { title: 'Fashion Watches', collections: ['Watches'], departments: ['Women', 'Men'], brands: ['Gucci', 'Chanel', 'Dior', 'Hermès', 'Bulgari', 'Cartier'] },
]

export const seedCategories = async (payload: Payload): Promise<void> => {
  payload.logger.info('Clearing categories...')

  // Delete all existing categories
  const existingCategories = await payload.find({
    collection: 'categories',
    limit: 1000,
  })

  for (const doc of existingCategories.docs) {
    await payload.delete({
      collection: 'categories',
      id: doc.id,
    })
  }

  payload.logger.info(`Deleted ${existingCategories.docs.length} categories`)
  payload.logger.info('Seeding categories with relationships...')

  // First, get all departments, collections and brands for mapping
  const departmentsResult = await payload.find({
    collection: 'departments',
    limit: 100,
  })
  const collectionsResult = await payload.find({
    collection: 'collections',
    limit: 100,
  })
  const brandsResult = await payload.find({
    collection: 'brands',
    limit: 500,
  })

  const departmentMap = new Map(departmentsResult.docs.map((d) => [d.name, d.id]))
  const collectionMap = new Map(collectionsResult.docs.map((c) => [c.name, c.id]))
  const brandMap = new Map(brandsResult.docs.map((b) => [b.name, b.id]))

  for (const category of categoriesData) {
    // Get department IDs
    const departmentIds = category.departments
      .map((name) => departmentMap.get(name))
      .filter((id): id is number => id !== undefined)

    // Get collection IDs
    const collectionIds = category.collections
      .map((name) => collectionMap.get(name))
      .filter((id): id is number => id !== undefined)

    // Get brand IDs
    const brandIds = category.brands
      .map((name) => brandMap.get(name))
      .filter((id): id is number => id !== undefined)

    // Validate that all relationships were found
    if (departmentIds.length === 0) {
      payload.logger.warn(`Category "${category.title}" has no valid departments! Expected: ${category.departments.join(', ')}`)
    }
    if (collectionIds.length === 0) {
      payload.logger.warn(`Category "${category.title}" has no valid collections! Expected: ${category.collections.join(', ')}`)
    }
    if (brandIds.length === 0) {
      const missingBrands = category.brands.filter((name) => !brandMap.has(name))
      payload.logger.warn(`Category "${category.title}" has no valid brands! Missing: ${missingBrands.join(', ')}`)
    }

    await payload.create({
      collection: 'categories',
      data: {
        title: category.title,
        departments: departmentIds,
        collections: collectionIds,
        brands: brandIds,
      },
    })
    payload.logger.info(`Created category: ${category.title} (${collectionIds.length} collections, ${departmentIds.length} departments, ${brandIds.length} brands)`)
    }
  }


