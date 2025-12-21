import type { Payload } from 'payload'

// Categories with their collection, department, brand and variant types mappings
const categoriesData = [
  // Clothing Categories
  { title: 'Coats', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Burberry', 'Max Mara', 'Moncler', 'Canada Goose', 'The North Face', 'Prada', 'Gucci'], variantTypes: ['Size', 'Color'] },
  { title: 'Jackets', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['The North Face', 'Patagonia', 'Nike', 'Adidas', 'Stone Island', 'Moncler', 'Balmain'], variantTypes: ['Size', 'Color'] },
  { title: 'Dresses', collections: ['Clothing'], departments: ['Women', 'Kids'], brands: ['Dior', 'Valentino', 'Oscar de la Renta', 'Carolina Herrera', 'Reformation', 'Zara', 'H&M'], variantTypes: ['Size', 'Color', 'Length'] },
  { title: 'Tops', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Zara', 'H&M', 'Uniqlo', 'COS', 'Acne Studios', 'Theory', 'Vince'], variantTypes: ['Size', 'Color'] },
  { title: 'Shirts', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Ralph Lauren', 'Hugo Boss', 'Tommy Hilfiger', 'Uniqlo', 'Massimo Dutti', 'Paul Smith'], variantTypes: ['Size', 'Color', 'Fit'] },
  { title: 'Blouses', collections: ['Clothing'], departments: ['Women'], brands: ['Chanel', 'Saint Laurent', 'Equipment', 'Sandro', 'Maje', 'Reformation'], variantTypes: ['Size', 'Color'] },
  { title: 'T-Shirts', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Supreme', 'Off-White', 'Acne Studios', 'A.P.C.', 'Nike', 'Adidas', 'Uniqlo'], variantTypes: ['Size', 'Color'] },
  { title: 'Sweaters', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Loro Piana', 'Brunello Cucinelli', 'Acne Studios', 'COS', 'Ralph Lauren', 'Uniqlo'], variantTypes: ['Size', 'Color', 'Material'] },
  { title: 'Cardigans', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Chanel', 'Prada', 'COS', 'Uniqlo', 'J.Crew', 'Everlane'], variantTypes: ['Size', 'Color'] },
  { title: 'Pants', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Zara', 'H&M', 'Uniqlo', 'Theory', 'Hugo Boss', 'Massimo Dutti'], variantTypes: ['Size', 'Color', 'Fit'] },
  { title: 'Jeans', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ["Levi's", 'Diesel', 'G-Star Raw', 'Citizens of Humanity', 'AG Jeans', 'Frame', 'Mother Denim'], variantTypes: ['Size', 'Color', 'Fit'] },
  { title: 'Shorts', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Nike', 'Adidas', "Levi's", 'H&M', 'Zara', 'Gap'], variantTypes: ['Size', 'Color'] },
  { title: 'Skirts', collections: ['Clothing'], departments: ['Women', 'Kids'], brands: ['Prada', 'Miu Miu', 'Zara', 'H&M', 'Reformation', 'Sandro'], variantTypes: ['Size', 'Color', 'Length'] },
  { title: 'Suits', collections: ['Clothing'], departments: ['Women', 'Men'], brands: ['Hugo Boss', 'Armani', 'Tom Ford', 'Ralph Lauren', 'Thom Browne', 'Zara'], variantTypes: ['Size', 'Color', 'Fit'] },
  { title: 'Blazers', collections: ['Clothing'], departments: ['Women', 'Men'], brands: ['Balmain', 'Saint Laurent', 'Theory', 'Massimo Dutti', 'Zara', 'Hugo Boss'], variantTypes: ['Size', 'Color', 'Fit'] },
  { title: 'Trench Coats', collections: ['Clothing'], departments: ['Women', 'Men'], brands: ['Burberry', 'Max Mara', 'Aquascutum', 'Zara', 'Massimo Dutti'], variantTypes: ['Size', 'Color'] },
  { title: 'Knitwear', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Missoni', 'Acne Studios', 'COS', 'Uniqlo', 'J.Crew', 'Ralph Lauren'], variantTypes: ['Size', 'Color', 'Material'] },
  { title: 'Swimwear', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Eres', 'Zimmermann', 'Solid & Striped', 'Vilebrequin', 'Orlebar Brown', 'Speedo'], variantTypes: ['Size', 'Color'] },
  { title: 'Lingerie', collections: ['Clothing'], departments: ['Women'], brands: ['Agent Provocateur', 'La Perla', "Victoria's Secret", 'Fleur du Mal', 'Chantelle'], variantTypes: ['Size', 'Color'] },
  { title: 'Activewear', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Lululemon', 'Nike', 'Adidas', 'Gymshark', 'Alo Yoga', 'Under Armour'], variantTypes: ['Size', 'Color'] },

  // Bags Categories
  { title: 'Handbags', collections: ['Bags'], departments: ['Women'], brands: ['Hermès', 'Chanel', 'Louis Vuitton', 'Gucci', 'Prada', 'Bottega Veneta', 'Celine'], variantTypes: ['Color', 'Material', 'Condition'] },
  { title: 'Shoulder Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Gucci', 'Saint Laurent', 'Prada', 'Balenciaga', 'Coach', 'Michael Kors'], variantTypes: ['Color', 'Material', 'Condition'] },
  { title: 'Crossbody Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Louis Vuitton', 'Gucci', 'Coach', 'Kate Spade', 'Michael Kors', 'Marc Jacobs'], variantTypes: ['Color', 'Material', 'Condition'] },
  { title: 'Tote Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Goyard', 'Louis Vuitton', 'Tory Burch', 'Longchamp', 'Coach', 'Celine'], variantTypes: ['Color', 'Material', 'Condition'] },
  { title: 'Clutches', collections: ['Bags'], departments: ['Women'], brands: ['Bottega Veneta', 'Jimmy Choo', 'Alexander McQueen', 'Saint Laurent', 'Judith Leiber'], variantTypes: ['Color', 'Material', 'Condition'] },
  { title: 'Backpacks', collections: ['Bags'], departments: ['Women', 'Men', 'Kids'], brands: ['Louis Vuitton', 'Gucci', 'Prada', 'The North Face', 'Fjällräven', 'Herschel'], variantTypes: ['Color', 'Material', 'Condition'] },
  { title: 'Travel Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Louis Vuitton', 'Rimowa', 'Tumi', 'Hermès', 'Gucci', 'Prada'], variantTypes: ['Color', 'Material', 'Condition'] },
  { title: 'Wallets', collections: ['Bags', 'Accessories'], departments: ['Women', 'Men'], brands: ['Louis Vuitton', 'Gucci', 'Chanel', 'Hermès', 'Prada', 'Bottega Veneta'], variantTypes: ['Color', 'Material', 'Condition'] },
  { title: 'Belt Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Gucci', 'Louis Vuitton', 'Prada', 'Fendi', 'Burberry', 'Balenciaga'], variantTypes: ['Color', 'Material', 'Condition'] },

  // Shoes Categories
  { title: 'Sneakers', collections: ['Shoes'], departments: ['Women', 'Men', 'Kids'], brands: ['Nike', 'Adidas', 'New Balance', 'Converse', 'Vans', 'Jordan', 'Puma'], variantTypes: ['Size', 'Color', 'Condition'] },
  { title: 'Boots', collections: ['Shoes'], departments: ['Women', 'Men', 'Kids'], brands: ['Dr. Martens', 'Timberland', 'UGG', 'Stuart Weitzman', 'Gianvito Rossi', 'Prada'], variantTypes: ['Size', 'Color', 'Condition'] },
  { title: 'Ankle Boots', collections: ['Shoes'], departments: ['Women', 'Men'], brands: ['Celine', 'Saint Laurent', 'Acne Studios', 'Dr. Martens', 'Isabel Marant', 'Ganni'], variantTypes: ['Size', 'Color', 'Condition'] },
  { title: 'Heels', collections: ['Shoes'], departments: ['Women'], brands: ['Christian Louboutin', 'Jimmy Choo', 'Manolo Blahnik', 'Stuart Weitzman', 'Gianvito Rossi'], variantTypes: ['Size', 'Color', 'Heel Height', 'Condition'] },
  { title: 'Pumps', collections: ['Shoes'], departments: ['Women'], brands: ['Christian Louboutin', 'Jimmy Choo', 'Manolo Blahnik', 'Prada', 'Gucci', 'Saint Laurent'], variantTypes: ['Size', 'Color', 'Heel Height', 'Condition'] },
  { title: 'Sandals', collections: ['Shoes'], departments: ['Women', 'Men', 'Kids'], brands: ['Birkenstock', 'Hermès', 'Chanel', 'Gucci', 'Valentino', 'Ancient Greek Sandals'], variantTypes: ['Size', 'Color', 'Condition'] },
  { title: 'Flats', collections: ['Shoes'], departments: ['Women', 'Kids'], brands: ['Chanel', 'Tory Burch', 'Repetto', 'Sam Edelman', "Rothy's", 'Gucci'], variantTypes: ['Size', 'Color', 'Condition'] },
  { title: 'Loafers', collections: ['Shoes'], departments: ['Women', 'Men'], brands: ['Gucci', "Tod's", "Church's", 'G.H. Bass', 'Prada', 'Salvatore Ferragamo'], variantTypes: ['Size', 'Color', 'Condition'] },
  { title: 'Mules', collections: ['Shoes'], departments: ['Women'], brands: ['Gucci', 'Bottega Veneta', 'The Row', 'By Far', 'Malone Souliers'], variantTypes: ['Size', 'Color', 'Condition'] },
  { title: 'Espadrilles', collections: ['Shoes'], departments: ['Women', 'Men'], brands: ['Castañer', 'Chanel', 'Saint Laurent', 'Soludos', 'Tory Burch'], variantTypes: ['Size', 'Color', 'Condition'] },

  // Accessories Categories
  { title: 'Belts', collections: ['Accessories'], departments: ['Women', 'Men'], brands: ['Gucci', 'Hermès', 'Louis Vuitton', 'Bottega Veneta', 'Salvatore Ferragamo', 'Prada'], variantTypes: ['Size', 'Color', 'Material'] },
  { title: 'Scarves', collections: ['Accessories'], departments: ['Women', 'Men'], brands: ['Hermès', 'Louis Vuitton', 'Gucci', 'Burberry', 'Loro Piana', 'Acne Studios'], variantTypes: ['Color', 'Material'] },
  { title: 'Hats', collections: ['Accessories'], departments: ['Women', 'Men', 'Kids'], brands: ['Gucci', 'Prada', 'Jacquemus', 'Maison Michel', 'Lack of Color', 'New Era'], variantTypes: ['Size', 'Color'] },
  { title: 'Sunglasses', collections: ['Accessories'], departments: ['Women', 'Men', 'Kids'], brands: ['Ray-Ban', 'Oakley', 'Gucci', 'Prada', 'Dior', 'Celine', 'Tom Ford'], variantTypes: ['Color', 'Condition'] },
  { title: 'Gloves', collections: ['Accessories'], departments: ['Women', 'Men'], brands: ['Hermès', 'Bottega Veneta', 'Prada', 'Burberry', 'Dents', 'Mulberry'], variantTypes: ['Size', 'Color', 'Material'] },
  { title: 'Hair Accessories', collections: ['Accessories'], departments: ['Women', 'Kids'], brands: ['Chanel', 'Prada', 'Gucci', 'Alexandre de Paris', 'Jennifer Behr'], variantTypes: ['Color', 'Material'] },
  { title: 'Ties', collections: ['Accessories'], departments: ['Men'], brands: ['Hermès', 'Gucci', 'Dior', 'Tom Ford', 'Brioni', 'Salvatore Ferragamo'], variantTypes: ['Color', 'Material'] },
  { title: 'Pocket Squares', collections: ['Accessories'], departments: ['Men'], brands: ['Hermès', "Drake's", 'Tom Ford', 'Turnbull & Asser', 'Charvet'], variantTypes: ['Color', 'Material'] },

  // Jewelry Categories
  { title: 'Necklaces', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['Cartier', 'Tiffany & Co.', 'Van Cleef & Arpels', 'Bulgari', 'Chanel', 'Dior'], variantTypes: ['Length', 'Material', 'Condition'] },
  { title: 'Bracelets', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['Cartier', 'Tiffany & Co.', 'Van Cleef & Arpels', 'Hermès', 'Bulgari', 'David Yurman'], variantTypes: ['Size', 'Material', 'Condition'] },
  { title: 'Earrings', collections: ['Jewelry'], departments: ['Women'], brands: ['Cartier', 'Tiffany & Co.', 'Van Cleef & Arpels', 'Chanel', 'Dior', 'Celine'], variantTypes: ['Material', 'Condition'] },
  { title: 'Rings', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['Cartier', 'Tiffany & Co.', 'Van Cleef & Arpels', 'Bulgari', 'Harry Winston', 'Pomellato'], variantTypes: ['Size', 'Material', 'Condition'] },
  { title: 'Brooches', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['Chanel', 'Van Cleef & Arpels', 'Cartier', 'Dior', 'Gucci'], variantTypes: ['Material', 'Condition'] },
  { title: 'Cufflinks', collections: ['Jewelry', 'Accessories'], departments: ['Men'], brands: ['Cartier', 'Montblanc', 'Tom Ford', 'Tiffany & Co.', 'Dunhill'], variantTypes: ['Material', 'Condition'] },

  // Watch Categories
  { title: 'Luxury Watches', collections: ['Watches'], departments: ['Women', 'Men'], brands: ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'Cartier', 'IWC'], variantTypes: ['Condition', 'Material'] },
  { title: 'Sport Watches', collections: ['Watches'], departments: ['Women', 'Men'], brands: ['Rolex', 'Omega', 'TAG Heuer', 'Breitling', 'Tudor', 'Longines'], variantTypes: ['Condition', 'Material'] },
  { title: 'Fashion Watches', collections: ['Watches'], departments: ['Women', 'Men'], brands: ['Gucci', 'Chanel', 'Dior', 'Hermès', 'Bulgari', 'Cartier'], variantTypes: ['Condition', 'Material'] },
]

export const seedCategories = async (payload: Payload): Promise<void> => {
  // Must delete products first due to foreign key constraint on category
  payload.logger.info('Clearing products (required before categories)...')

  const existingProducts = await payload.find({
    collection: 'products',
    limit: 1000,
  })

  for (const doc of existingProducts.docs) {
    await payload.delete({
      collection: 'products',
      id: doc.id,
    })
  }

  payload.logger.info(`Deleted ${existingProducts.docs.length} products`)

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
  const variantTypesResult = await payload.find({
    collection: 'variantTypes',
    limit: 100,
  })

  const departmentMap = new Map(departmentsResult.docs.map((d) => [d.name, d.id]))
  const collectionMap = new Map(collectionsResult.docs.map((c) => [c.name, c.id]))
  const brandMap = new Map(brandsResult.docs.map((b) => [b.name, b.id]))
  const variantTypeMap = new Map(variantTypesResult.docs.map((v) => [v.name, v.id]))

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

    // Get variant type IDs
    const variantTypeIds = category.variantTypes
      .map((name) => variantTypeMap.get(name))
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
    if (variantTypeIds.length === 0) {
      payload.logger.warn(`Category "${category.title}" has no valid variant types! Expected: ${category.variantTypes.join(', ')}`)
    }

    await payload.create({
      collection: 'categories',
      data: {
        title: category.title,
        departments: departmentIds,
        collections: collectionIds,
        brands: brandIds,
        variantTypes: variantTypeIds,
      },
    })
    payload.logger.info(`Created category: ${category.title} (${collectionIds.length} collections, ${departmentIds.length} departments, ${brandIds.length} brands, ${variantTypeIds.length} variant types)`)
    }
  }


