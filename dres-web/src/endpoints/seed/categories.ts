import type { Payload } from 'payload'

// Categories with their collection, department, brand and attribute mappings
// variantAttributes are attributes used for product variations (e.g., Size, Color)
// attributes are all attributes including variantAttributes
const categoriesData = [
  // Clothing Categories
  { title: 'Coats', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Burberry', 'Max Mara', 'Moncler', 'Canada Goose', 'The North Face', 'Prada', 'Gucci'], attributes: ['Size', 'Color', 'Material', 'Fit'], variantAttributes: ['Size', 'Color'] },
  { title: 'Jackets', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['The North Face', 'Patagonia', 'Nike', 'Adidas', 'Stone Island', 'Moncler', 'Balmain'], attributes: ['Size', 'Color', 'Material', 'Fit'], variantAttributes: ['Size', 'Color'] },
  { title: 'Dresses', collections: ['Clothing'], departments: ['Women', 'Kids'], brands: ['Dior', 'Valentino', 'Oscar de la Renta', 'Carolina Herrera', 'Reformation', 'Zara', 'H&M', 'Christie Brown', 'Pistis Ghana', 'Lisa Folawiyo'], attributes: ['Size', 'Color', 'Length', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Tops', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Zara', 'H&M', 'Uniqlo', 'COS', 'Acne Studios', 'Theory', 'Vince'], attributes: ['Size', 'Color', 'Material', 'Fit'], variantAttributes: ['Size', 'Color'] },
  { title: 'Shirts', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Ralph Lauren', 'Hugo Boss', 'Tommy Hilfiger', 'Uniqlo', 'Massimo Dutti', 'Paul Smith', 'Steve French', 'Bestow Elan'], attributes: ['Size', 'Color', 'Fit', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Blouses', collections: ['Clothing'], departments: ['Women'], brands: ['Chanel', 'Saint Laurent', 'Equipment', 'Sandro', 'Maje', 'Reformation'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'T-Shirts', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Supreme', 'Off-White', 'Acne Studios', 'A.P.C.', 'Nike', 'Adidas', 'Uniqlo'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Sweaters', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Loro Piana', 'Brunello Cucinelli', 'Acne Studios', 'COS', 'Ralph Lauren', 'Uniqlo'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Cardigans', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Chanel', 'Prada', 'COS', 'Uniqlo', 'J.Crew', 'Everlane'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Pants', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Zara', 'H&M', 'Uniqlo', 'Theory', 'Hugo Boss', 'Massimo Dutti'], attributes: ['Size', 'Color', 'Fit', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Jeans', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ["Levi's", 'Diesel', 'G-Star Raw', 'Citizens of Humanity', 'AG Jeans', 'Frame', 'Mother Denim'], attributes: ['Size', 'Color', 'Fit', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Shorts', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Nike', 'Adidas', "Levi's", 'H&M', 'Zara', 'Gap'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Skirts', collections: ['Clothing'], departments: ['Women', 'Kids'], brands: ['Prada', 'Miu Miu', 'Zara', 'H&M', 'Reformation', 'Sandro', 'Christie Brown', 'Lisa Folawiyo'], attributes: ['Size', 'Color', 'Length', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Suits', collections: ['Clothing'], departments: ['Women', 'Men'], brands: ['Hugo Boss', 'Armani', 'Tom Ford', 'Ralph Lauren', 'Thom Browne', 'Zara', 'Steve French', 'Bestow Elan'], attributes: ['Size', 'Color', 'Fit', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Blazers', collections: ['Clothing'], departments: ['Women', 'Men'], brands: ['Balmain', 'Saint Laurent', 'Theory', 'Massimo Dutti', 'Zara', 'Hugo Boss'], attributes: ['Size', 'Color', 'Fit', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Trench Coats', collections: ['Clothing'], departments: ['Women', 'Men'], brands: ['Burberry', 'Max Mara', 'Aquascutum', 'Zara', 'Massimo Dutti'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Knitwear', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Missoni', 'Acne Studios', 'COS', 'Uniqlo', 'J.Crew', 'Ralph Lauren', 'MaXhosa by Laduma'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Swimwear', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Eres', 'Zimmermann', 'Solid & Striped', 'Vilebrequin', 'Orlebar Brown', 'Speedo'], attributes: ['Size', 'Color'], variantAttributes: ['Size', 'Color'] },
  { title: 'Lingerie', collections: ['Clothing'], departments: ['Women'], brands: ['Agent Provocateur', 'La Perla', "Victoria's Secret", 'Fleur du Mal', 'Chantelle'], attributes: ['Size', 'Color'], variantAttributes: ['Size', 'Color'] },
  { title: 'Activewear', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Lululemon', 'Nike', 'Adidas', 'Gymshark', 'Alo Yoga', 'Under Armour'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },

  // African & Traditional Clothing Categories
  { title: 'Kente', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['GTP', 'ATL', 'Woodin', 'Vlisco', 'Christie Brown', 'Tribal Marks'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'African Print Dresses', collections: ['Clothing'], departments: ['Women', 'Kids'], brands: ['Vlisco', 'Woodin', 'GTP', 'Christie Brown', 'Duaba Serwa', 'Lisa Folawiyo', 'Pistis Ghana', 'Kiki Clothing'], attributes: ['Size', 'Color', 'Length', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'African Print Shirts', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Vlisco', 'Woodin', 'GTP', 'Steve French', 'Orange Culture', 'Bestow Elan', 'Kenneth Ize'], attributes: ['Size', 'Color', 'Fit', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Dashiki', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['GTP', 'Woodin', 'ATL', 'Tribal Marks', 'Casa Afia'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Batakari / Smock', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Batakari', 'Tribal Marks', 'Casa Afia', 'Steve French'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Kaba & Slit', collections: ['Clothing'], departments: ['Women'], brands: ['Christie Brown', 'Pistis Ghana', 'Duaba Serwa', 'Kiki Clothing', 'Afro Mod Trends', 'Casa Afia'], attributes: ['Size', 'Color', 'Length', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Agbada', collections: ['Clothing'], departments: ['Men'], brands: ['Steve French', 'Bestow Elan', 'Orange Culture', 'Kenneth Ize', 'Tribal Marks'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Ankara', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Vlisco', 'Woodin', 'GTP', 'Lisa Folawiyo', 'Maki Oh', 'Duaba Serwa', 'Christie Brown'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'African Print Skirts', collections: ['Clothing'], departments: ['Women', 'Kids'], brands: ['Vlisco', 'Woodin', 'GTP', 'Christie Brown', 'Lisa Folawiyo', 'Duaba Serwa'], attributes: ['Size', 'Color', 'Length', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'African Print Pants', collections: ['Clothing'], departments: ['Women', 'Men', 'Kids'], brands: ['Vlisco', 'Woodin', 'GTP', 'Steve French', 'Orange Culture', 'Osei-Duro'], attributes: ['Size', 'Color', 'Fit', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Boubou / Kaftan', collections: ['Clothing'], departments: ['Women', 'Men'], brands: ['LaFalaise Dion', 'Imane Ayissi', 'Tongoro', 'Maison ARTC', 'Tribal Marks'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'African Beads & Jewelry', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['AAKS', 'Studio 189', 'Tribal Marks', 'Christie Brown'], attributes: ['Color', 'Material', 'Condition'], variantAttributes: ['Color'] },
  { title: 'Raffia Bags', collections: ['Bags'], departments: ['Women'], brands: ['AAKS', 'Studio 189', 'Osei-Duro', 'Sindiso Khumalo'], attributes: ['Color', 'Material', 'Condition'], variantAttributes: ['Color'] },
  { title: 'African Print Accessories', collections: ['Accessories'], departments: ['Women', 'Men', 'Kids'], brands: ['Vlisco', 'Woodin', 'GTP', 'AAKS', 'Christie Brown', 'Studio 189'], attributes: ['Color', 'Material'], variantAttributes: ['Color'] },
  { title: 'Headwraps & Gele', collections: ['Accessories'], departments: ['Women'], brands: ['Vlisco', 'Woodin', 'GTP', 'Lisa Folawiyo', 'Tribal Marks'], attributes: ['Color', 'Material'], variantAttributes: ['Color'] },
  { title: 'African Sandals', collections: ['Shoes'], departments: ['Women', 'Men', 'Kids'], brands: ['Studio 189', 'Osei-Duro', 'Tribal Marks', 'Birkenstock'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },

  // Bags Categories
  { title: 'Handbags', collections: ['Bags'], departments: ['Women'], brands: ['Hermès', 'Chanel', 'Louis Vuitton', 'Gucci', 'Prada', 'Bottega Veneta', 'Celine'], attributes: ['Color', 'Material', 'Condition'], variantAttributes: ['Color'] },
  { title: 'Shoulder Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Gucci', 'Saint Laurent', 'Prada', 'Balenciaga', 'Coach', 'Michael Kors'], attributes: ['Color', 'Material', 'Condition'], variantAttributes: ['Color'] },
  { title: 'Crossbody Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Louis Vuitton', 'Gucci', 'Coach', 'Kate Spade', 'Michael Kors', 'Marc Jacobs'], attributes: ['Color', 'Material', 'Condition'], variantAttributes: ['Color'] },
  { title: 'Tote Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Goyard', 'Louis Vuitton', 'Tory Burch', 'Longchamp', 'Coach', 'Celine'], attributes: ['Color', 'Material', 'Condition'], variantAttributes: ['Color'] },
  { title: 'Clutches', collections: ['Bags'], departments: ['Women'], brands: ['Bottega Veneta', 'Jimmy Choo', 'Alexander McQueen', 'Saint Laurent', 'Judith Leiber'], attributes: ['Color', 'Material', 'Condition'], variantAttributes: ['Color'] },
  { title: 'Backpacks', collections: ['Bags'], departments: ['Women', 'Men', 'Kids'], brands: ['Louis Vuitton', 'Gucci', 'Prada', 'The North Face', 'Fjällräven', 'Herschel'], attributes: ['Color', 'Material', 'Condition'], variantAttributes: ['Color'] },
  { title: 'Travel Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Louis Vuitton', 'Rimowa', 'Tumi', 'Hermès', 'Gucci', 'Prada'], attributes: ['Color', 'Material', 'Condition'], variantAttributes: ['Color'] },
  { title: 'Wallets', collections: ['Bags', 'Accessories'], departments: ['Women', 'Men'], brands: ['Louis Vuitton', 'Gucci', 'Chanel', 'Hermès', 'Prada', 'Bottega Veneta'], attributes: ['Color', 'Material', 'Condition'], variantAttributes: ['Color'] },
  { title: 'Belt Bags', collections: ['Bags'], departments: ['Women', 'Men'], brands: ['Gucci', 'Louis Vuitton', 'Prada', 'Fendi', 'Burberry', 'Balenciaga'], attributes: ['Color', 'Material', 'Condition'], variantAttributes: ['Color'] },

  // Shoes Categories
  { title: 'Sneakers', collections: ['Shoes'], departments: ['Women', 'Men', 'Kids'], brands: ['Nike', 'Adidas', 'New Balance', 'Converse', 'Vans', 'Jordan', 'Puma'], attributes: ['Size', 'Color', 'Condition'], variantAttributes: ['Size', 'Color'] },
  { title: 'Boots', collections: ['Shoes'], departments: ['Women', 'Men', 'Kids'], brands: ['Dr. Martens', 'Timberland', 'UGG', 'Stuart Weitzman', 'Gianvito Rossi', 'Prada'], attributes: ['Size', 'Color', 'Condition', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Ankle Boots', collections: ['Shoes'], departments: ['Women', 'Men'], brands: ['Celine', 'Saint Laurent', 'Acne Studios', 'Dr. Martens', 'Isabel Marant', 'Ganni'], attributes: ['Size', 'Color', 'Condition'], variantAttributes: ['Size', 'Color'] },
  { title: 'Heels', collections: ['Shoes'], departments: ['Women'], brands: ['Christian Louboutin', 'Jimmy Choo', 'Manolo Blahnik', 'Stuart Weitzman', 'Gianvito Rossi'], attributes: ['Size', 'Color', 'Heel Height', 'Condition'], variantAttributes: ['Size', 'Color'] },
  { title: 'Pumps', collections: ['Shoes'], departments: ['Women'], brands: ['Christian Louboutin', 'Jimmy Choo', 'Manolo Blahnik', 'Prada', 'Gucci', 'Saint Laurent'], attributes: ['Size', 'Color', 'Heel Height', 'Condition'], variantAttributes: ['Size', 'Color'] },
  { title: 'Sandals', collections: ['Shoes'], departments: ['Women', 'Men', 'Kids'], brands: ['Birkenstock', 'Hermès', 'Chanel', 'Gucci', 'Valentino', 'Ancient Greek Sandals'], attributes: ['Size', 'Color', 'Condition'], variantAttributes: ['Size', 'Color'] },
  { title: 'Flats', collections: ['Shoes'], departments: ['Women', 'Kids'], brands: ['Chanel', 'Tory Burch', 'Repetto', 'Sam Edelman', "Rothy's", 'Gucci'], attributes: ['Size', 'Color', 'Condition'], variantAttributes: ['Size', 'Color'] },
  { title: 'Loafers', collections: ['Shoes'], departments: ['Women', 'Men'], brands: ['Gucci', "Tod's", "Church's", 'G.H. Bass', 'Prada', 'Salvatore Ferragamo'], attributes: ['Size', 'Color', 'Condition'], variantAttributes: ['Size', 'Color'] },
  { title: 'Mules', collections: ['Shoes'], departments: ['Women'], brands: ['Gucci', 'Bottega Veneta', 'The Row', 'By Far', 'Malone Souliers'], attributes: ['Size', 'Color', 'Condition'], variantAttributes: ['Size', 'Color'] },
  { title: 'Espadrilles', collections: ['Shoes'], departments: ['Women', 'Men'], brands: ['Castañer', 'Chanel', 'Saint Laurent', 'Soludos', 'Tory Burch'], attributes: ['Size', 'Color', 'Condition'], variantAttributes: ['Size', 'Color'] },

  // Accessories Categories
  { title: 'Belts', collections: ['Accessories'], departments: ['Women', 'Men'], brands: ['Gucci', 'Hermès', 'Louis Vuitton', 'Bottega Veneta', 'Salvatore Ferragamo', 'Prada'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Scarves', collections: ['Accessories'], departments: ['Women', 'Men'], brands: ['Hermès', 'Louis Vuitton', 'Gucci', 'Burberry', 'Loro Piana', 'Acne Studios'], attributes: ['Color', 'Material'], variantAttributes: ['Color'] },
  { title: 'Hats', collections: ['Accessories'], departments: ['Women', 'Men', 'Kids'], brands: ['Gucci', 'Prada', 'Jacquemus', 'Maison Michel', 'Lack of Color', 'New Era'], attributes: ['Size', 'Color'], variantAttributes: ['Size', 'Color'] },
  { title: 'Sunglasses', collections: ['Accessories'], departments: ['Women', 'Men', 'Kids'], brands: ['Ray-Ban', 'Oakley', 'Gucci', 'Prada', 'Dior', 'Celine', 'Tom Ford'], attributes: ['Color', 'Condition'], variantAttributes: ['Color'] },
  { title: 'Gloves', collections: ['Accessories'], departments: ['Women', 'Men'], brands: ['Hermès', 'Bottega Veneta', 'Prada', 'Burberry', 'Dents', 'Mulberry'], attributes: ['Size', 'Color', 'Material'], variantAttributes: ['Size', 'Color'] },
  { title: 'Hair Accessories', collections: ['Accessories'], departments: ['Women', 'Kids'], brands: ['Chanel', 'Prada', 'Gucci', 'Alexandre de Paris', 'Jennifer Behr'], attributes: ['Color', 'Material'], variantAttributes: ['Color'] },
  { title: 'Ties', collections: ['Accessories'], departments: ['Men'], brands: ['Hermès', 'Gucci', 'Dior', 'Tom Ford', 'Brioni', 'Salvatore Ferragamo'], attributes: ['Color', 'Material'], variantAttributes: ['Color'] },
  { title: 'Pocket Squares', collections: ['Accessories'], departments: ['Men'], brands: ['Hermès', "Drake's", 'Tom Ford', 'Turnbull & Asser', 'Charvet'], attributes: ['Color', 'Material'], variantAttributes: ['Color'] },

  // Jewelry Categories
  { title: 'Necklaces', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['Cartier', 'Tiffany & Co.', 'Van Cleef & Arpels', 'Bulgari', 'Chanel', 'Dior'], attributes: ['Length', 'Material', 'Condition'], variantAttributes: ['Length'] },
  { title: 'Bracelets', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['Cartier', 'Tiffany & Co.', 'Van Cleef & Arpels', 'Hermès', 'Bulgari', 'David Yurman'], attributes: ['Size', 'Material', 'Condition'], variantAttributes: ['Size'] },
  { title: 'Earrings', collections: ['Jewelry'], departments: ['Women'], brands: ['Cartier', 'Tiffany & Co.', 'Van Cleef & Arpels', 'Chanel', 'Dior', 'Celine'], attributes: ['Material', 'Condition'], variantAttributes: [] },
  { title: 'Rings', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['Cartier', 'Tiffany & Co.', 'Van Cleef & Arpels', 'Bulgari', 'Harry Winston', 'Pomellato'], attributes: ['Size', 'Material', 'Condition'], variantAttributes: ['Size'] },
  { title: 'Brooches', collections: ['Jewelry'], departments: ['Women', 'Men'], brands: ['Chanel', 'Van Cleef & Arpels', 'Cartier', 'Dior', 'Gucci'], attributes: ['Material', 'Condition'], variantAttributes: [] },
  { title: 'Cufflinks', collections: ['Jewelry', 'Accessories'], departments: ['Men'], brands: ['Cartier', 'Montblanc', 'Tom Ford', 'Tiffany & Co.', 'Dunhill'], attributes: ['Material', 'Condition'], variantAttributes: [] },

  // Watch Categories
  { title: 'Luxury Watches', collections: ['Watches'], departments: ['Women', 'Men'], brands: ['Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'Cartier', 'IWC'], attributes: ['Condition', 'Material'], variantAttributes: [] },
  { title: 'Sport Watches', collections: ['Watches'], departments: ['Women', 'Men'], brands: ['Rolex', 'Omega', 'TAG Heuer', 'Breitling', 'Tudor', 'Longines'], attributes: ['Condition', 'Material'], variantAttributes: [] },
  { title: 'Fashion Watches', collections: ['Watches'], departments: ['Women', 'Men'], brands: ['Gucci', 'Chanel', 'Dior', 'Hermès', 'Bulgari', 'Cartier'], attributes: ['Condition', 'Material'], variantAttributes: [] },
]

export const seedCategories = async (payload: Payload): Promise<void> => {
  // Must delete variations first due to foreign key constraint on category
  payload.logger.info('Clearing variations (required before categories)...')

  const existingVariations = await payload.find({
    collection: 'variations',
    limit: 1000,
  })

  for (const doc of existingVariations.docs) {
    await payload.delete({
      collection: 'variations',
      id: doc.id,
    })
  }

  payload.logger.info(`Deleted ${existingVariations.docs.length} variations`)

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
  const attributesResult = await payload.find({
    collection: 'attributes',
    limit: 100,
  })

  const departmentMap = new Map(departmentsResult.docs.map((d) => [d.name, d.id]))
  const collectionMap = new Map(collectionsResult.docs.map((c) => [c.name, c.id]))
  const brandMap = new Map(brandsResult.docs.map((b) => [b.name, b.id]))
  const attributeMap = new Map(attributesResult.docs.map((a) => [a.name, a.id]))

  for (const category of categoriesData) {
    // Get department IDs
    const departmentIds = category.departments
      .map((name) => departmentMap.get(name))
      .filter((id): id is string => id !== undefined)

    // Get collection IDs
    const collectionIds = category.collections
      .map((name) => collectionMap.get(name))
      .filter((id): id is string => id !== undefined)

    // Get brand IDs
    const brandIds = category.brands
      .map((name) => brandMap.get(name))
      .filter((id): id is string => id !== undefined)

    // Get attribute IDs
    const attributeIds = category.attributes
      .map((name) => attributeMap.get(name))
      .filter((id): id is string => id !== undefined)

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
    if (attributeIds.length === 0) {
      payload.logger.warn(`Category "${category.title}" has no valid attributes! Expected: ${category.attributes.join(', ')}`)
    }

    await payload.create({
      collection: 'categories',
      data: {
        category: category.title,
        departments: departmentIds,
        collections: collectionIds,
        brands: brandIds,
        attributes: attributeIds,
      },
    })
    payload.logger.info(`Created category: ${category.title} (${collectionIds.length} collections, ${departmentIds.length} departments, ${brandIds.length} brands, ${attributeIds.length} attributes)`)
    }
  }


