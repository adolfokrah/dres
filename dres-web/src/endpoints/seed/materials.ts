import type { Payload } from 'payload'

// Materials organized by category type
const materialsData = [
  // Clothing materials
  { name: 'Cotton', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Knitwear', 'Activewear'] },
  { name: 'Leather', categories: ['Coats', 'Jackets', 'Skirts', 'Pants', 'Blazers', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Belts', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules'] },
  { name: 'Silk', categories: ['Dresses', 'Tops', 'Blouses', 'Shirts', 'Skirts', 'Scarves', 'Ties', 'Pocket Squares', 'Lingerie'] },
  { name: 'Wool', categories: ['Coats', 'Jackets', 'Sweaters', 'Cardigans', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Scarves', 'Hats', 'Gloves'] },
  { name: 'Linen', categories: ['Dresses', 'Tops', 'Shirts', 'Blouses', 'Pants', 'Shorts', 'Suits', 'Blazers'] },
  { name: 'Denim', categories: ['Jackets', 'Jeans', 'Shorts', 'Skirts', 'Dresses'] },
  { name: 'Polyester', categories: ['Dresses', 'Tops', 'Shirts', 'Blouses', 'Pants', 'Skirts', 'Activewear', 'Swimwear'] },
  { name: 'Nylon', categories: ['Jackets', 'Activewear', 'Swimwear', 'Backpacks', 'Travel Bags', 'Belt Bags'] },
  { name: 'Cashmere', categories: ['Sweaters', 'Cardigans', 'Coats', 'Scarves', 'Knitwear'] },
  { name: 'Velvet', categories: ['Dresses', 'Tops', 'Blazers', 'Skirts', 'Heels', 'Pumps', 'Loafers'] },
  { name: 'Satin', categories: ['Dresses', 'Tops', 'Blouses', 'Skirts', 'Lingerie', 'Heels', 'Pumps'] },
  { name: 'Chiffon', categories: ['Dresses', 'Tops', 'Blouses', 'Skirts', 'Scarves'] },
  { name: 'Suede', categories: ['Jackets', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Loafers', 'Mules', 'Handbags', 'Clutches', 'Belts'] },
  { name: 'Canvas', categories: ['Jackets', 'Sneakers', 'Tote Bags', 'Backpacks', 'Espadrilles'] },
  { name: 'Tweed', categories: ['Jackets', 'Coats', 'Blazers', 'Skirts', 'Suits'] },
  { name: 'Jersey', categories: ['Dresses', 'Tops', 'T-Shirts', 'Activewear'] },
  { name: 'Fleece', categories: ['Jackets', 'Sweaters', 'Activewear'] },
  { name: 'Corduroy', categories: ['Jackets', 'Pants', 'Skirts', 'Blazers'] },
  { name: 'Rayon', categories: ['Dresses', 'Tops', 'Blouses', 'Skirts'] },
  { name: 'Spandex', categories: ['Activewear', 'Swimwear', 'Lingerie'] },
  { name: 'Viscose', categories: ['Dresses', 'Tops', 'Blouses', 'Skirts'] },
  
  // Bag materials
  { name: 'Faux Leather', categories: ['Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Wallets', 'Belt Bags', 'Belts'] },
  { name: 'Patent Leather', categories: ['Handbags', 'Clutches', 'Heels', 'Pumps', 'Loafers', 'Belts'] },
  { name: 'Faux Fur', categories: ['Coats', 'Jackets', 'Handbags', 'Clutches'] },
  
  // Shoe materials
  { name: 'Rubber', categories: ['Sneakers', 'Boots', 'Sandals', 'Flats', 'Espadrilles'] },
  { name: 'Mesh', categories: ['Sneakers', 'Activewear'] },
  
  // Jewelry & Watch materials
  { name: 'Gold', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Fashion Watches'] },
  { name: 'Silver', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks'] },
  { name: 'Platinum', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings'] },
  { name: 'Stainless Steel', categories: ['Necklaces', 'Bracelets', 'Rings', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
  { name: 'Titanium', categories: ['Rings', 'Luxury Watches', 'Sport Watches'] },
  { name: 'Rose Gold', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Luxury Watches', 'Fashion Watches'] },
  { name: 'White Gold', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings'] },
  { name: 'Pearl', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Brooches'] },
  { name: 'Diamond', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches'] },
  
  // Accessory materials
  { name: 'Lace', categories: ['Dresses', 'Tops', 'Blouses', 'Lingerie'] },
  { name: 'Sequin', categories: ['Dresses', 'Tops', 'Skirts', 'Clutches'] },
  { name: 'Metallic', categories: ['Dresses', 'Tops', 'Heels', 'Clutches', 'Handbags'] },
  
  // Natural materials
  { name: 'Bamboo', categories: ['Handbags', 'Clutches'] },
  { name: 'Hemp', categories: ['Tops', 'Pants', 'Tote Bags', 'Backpacks'] },
  { name: 'Jute', categories: ['Tote Bags', 'Espadrilles'] },
  { name: 'Straw', categories: ['Hats', 'Tote Bags', 'Clutches'] },
  
  // Synthetic materials
  { name: 'Acrylic', categories: ['Sweaters', 'Cardigans', 'Knitwear', 'Hats', 'Scarves'] },
  { name: 'PVC', categories: ['Handbags', 'Tote Bags', 'Heels', 'Sandals'] },
  { name: 'Plastic', categories: ['Sunglasses', 'Hair Accessories'] },
]

export const seedMaterials = async (payload: Payload): Promise<void> => {
  payload.logger.info('Clearing materials...')

  // Delete all existing materials
  const existingMaterials = await payload.find({
    collection: 'materials',
    limit: 1000,
  })

  for (const doc of existingMaterials.docs) {
    await payload.delete({
      collection: 'materials',
      id: doc.id,
    })
  }

  payload.logger.info(`Deleted ${existingMaterials.docs.length} materials`)
  payload.logger.info('Seeding materials with category relationships...')

  // Get all categories for mapping
  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 500,
  })

  const categoryMap = new Map(categoriesResult.docs.map((c) => [c.title, c.id]))

  for (const material of materialsData) {
    // Get category IDs
    const categoryIds = material.categories
      .map((title) => categoryMap.get(title))
      .filter((id): id is number => id !== undefined)

    if (categoryIds.length === 0) {
      payload.logger.warn(`Material "${material.name}" has no valid categories!`)
    }

    await payload.create({
      collection: 'materials',
      data: {
        name: material.name,
        categories: categoryIds,
      },
    })
    payload.logger.info(`Created material: ${material.name} (${categoryIds.length} categories)`)
  }

  payload.logger.info(`Materials seeding complete! (${materialsData.length} materials)`)
}
