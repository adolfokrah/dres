import type { Payload } from 'payload'

// Attribute options with optional category restrictions
// If categories is empty/undefined, option is available for all categories with that attribute
interface AttributeOptionData {
  name: string
  slug: string
  categories?: string[] // Category names that can use this option
}

const attributeOptionsData: Record<string, AttributeOptionData[]> = {
  Size: [
    // Clothing sizes (for most clothing categories)
    { name: 'XXS', slug: 'xxs', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear'] },
    { name: 'XS', slug: 'xs', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear'] },
    { name: 'S', slug: 's', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear'] },
    { name: 'M', slug: 'm', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear'] },
    { name: 'L', slug: 'l', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear'] },
    { name: 'XL', slug: 'xl', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear'] },
    { name: 'XXL', slug: 'xxl', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear'] },
    { name: '3XL', slug: '3xl', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear'] },

    // Numeric sizes (for dresses, suits, etc.)
    { name: '36', slug: '36', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '38', slug: '38', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '40', slug: '40', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '42', slug: '42', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '44', slug: '44', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '46', slug: '46', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '48', slug: '48', categories: ['Dresses', 'Suits', 'Blazers'] },

    // Jeans/Pants sizes (Waist x Length)
    { name: 'W28 L30', slug: 'w28-l30', categories: ['Jeans', 'Pants'] },
    { name: 'W28 L32', slug: 'w28-l32', categories: ['Jeans', 'Pants'] },
    { name: 'W30 L30', slug: 'w30-l30', categories: ['Jeans', 'Pants'] },
    { name: 'W30 L32', slug: 'w30-l32', categories: ['Jeans', 'Pants'] },
    { name: 'W30 L34', slug: 'w30-l34', categories: ['Jeans', 'Pants'] },
    { name: 'W32 L30', slug: 'w32-l30', categories: ['Jeans', 'Pants'] },
    { name: 'W32 L32', slug: 'w32-l32', categories: ['Jeans', 'Pants'] },
    { name: 'W32 L34', slug: 'w32-l34', categories: ['Jeans', 'Pants'] },
    { name: 'W34 L30', slug: 'w34-l30', categories: ['Jeans', 'Pants'] },
    { name: 'W34 L32', slug: 'w34-l32', categories: ['Jeans', 'Pants'] },
    { name: 'W34 L34', slug: 'w34-l34', categories: ['Jeans', 'Pants'] },
    { name: 'W36 L30', slug: 'w36-l30', categories: ['Jeans', 'Pants'] },
    { name: 'W36 L32', slug: 'w36-l32', categories: ['Jeans', 'Pants'] },
    { name: 'W36 L34', slug: 'w36-l34', categories: ['Jeans', 'Pants'] },
    { name: 'W38 L30', slug: 'w38-l30', categories: ['Jeans', 'Pants'] },
    { name: 'W38 L32', slug: 'w38-l32', categories: ['Jeans', 'Pants'] },
    { name: 'W38 L34', slug: 'w38-l34', categories: ['Jeans', 'Pants'] },
    { name: 'W40 L30', slug: 'w40-l30', categories: ['Jeans', 'Pants'] },
    { name: 'W40 L32', slug: 'w40-l32', categories: ['Jeans', 'Pants'] },
    { name: 'W40 L34', slug: 'w40-l34', categories: ['Jeans', 'Pants'] },

    // US Shoe sizes
    { name: 'US 5', slug: 'us-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 5.5', slug: 'us-5-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 6', slug: 'us-6', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 6.5', slug: 'us-6-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 7', slug: 'us-7', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 7.5', slug: 'us-7-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 8', slug: 'us-8', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 8.5', slug: 'us-8-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 9', slug: 'us-9', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 9.5', slug: 'us-9-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 10', slug: 'us-10', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 10.5', slug: 'us-10-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 11', slug: 'us-11', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 12', slug: 'us-12', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
    { name: 'US 13', slug: 'us-13', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },

    // Ring sizes
    { name: 'Ring 5', slug: 'ring-5', categories: ['Rings'] },
    { name: 'Ring 6', slug: 'ring-6', categories: ['Rings'] },
    { name: 'Ring 7', slug: 'ring-7', categories: ['Rings'] },
    { name: 'Ring 8', slug: 'ring-8', categories: ['Rings'] },
    { name: 'Ring 9', slug: 'ring-9', categories: ['Rings'] },
    { name: 'Ring 10', slug: 'ring-10', categories: ['Rings'] },

    // Belt sizes
    { name: 'S (28-30")', slug: 'belt-s', categories: ['Belts'] },
    { name: 'M (32-34")', slug: 'belt-m', categories: ['Belts'] },
    { name: 'L (36-38")', slug: 'belt-l', categories: ['Belts'] },
    { name: 'XL (40-42")', slug: 'belt-xl', categories: ['Belts'] },

    // Bracelet sizes
    { name: '6.5" (Small)', slug: 'bracelet-s', categories: ['Bracelets'] },
    { name: '7" (Medium)', slug: 'bracelet-m', categories: ['Bracelets'] },
    { name: '7.5" (Large)', slug: 'bracelet-l', categories: ['Bracelets'] },
    { name: '8" (X-Large)', slug: 'bracelet-xl', categories: ['Bracelets'] },

    // Glove sizes
    { name: 'XS (6-6.5")', slug: 'glove-xs', categories: ['Gloves'] },
    { name: 'S (6.5-7")', slug: 'glove-s', categories: ['Gloves'] },
    { name: 'M (7.5-8")', slug: 'glove-m', categories: ['Gloves'] },
    { name: 'L (8.5-9")', slug: 'glove-l', categories: ['Gloves'] },
    { name: 'XL (9.5-10")', slug: 'glove-xl', categories: ['Gloves'] },

    // Hat sizes
    { name: 'S (54-55cm)', slug: 'hat-s', categories: ['Hats'] },
    { name: 'M (56-57cm)', slug: 'hat-m', categories: ['Hats'] },
    { name: 'L (58-59cm)', slug: 'hat-l', categories: ['Hats'] },
    { name: 'XL (60-61cm)', slug: 'hat-xl', categories: ['Hats'] },

    // One size (accessories)
    { name: 'One Size', slug: 'one-size', categories: ['Scarves', 'Sunglasses', 'Hair Accessories', 'Ties', 'Pocket Squares', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags'] },
  ],
  Color: [
    // Colors available for all clothing and accessories
    { name: 'Black', slug: 'black', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'White', slug: 'white', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Navy', slug: 'navy', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Blue', slug: 'blue', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Red', slug: 'red', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Pink', slug: 'pink', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Green', slug: 'green', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Yellow', slug: 'yellow', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Orange', slug: 'orange', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Purple', slug: 'purple', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Brown', slug: 'brown', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Tan', slug: 'tan', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Beige', slug: 'beige', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Grey', slug: 'grey', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Cream', slug: 'cream', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Gold', slug: 'gold', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches', 'Handbags', 'Clutches', 'Heels', 'Pumps', 'Sandals'] },
    { name: 'Silver', slug: 'silver', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches', 'Handbags', 'Clutches', 'Heels', 'Pumps', 'Sandals'] },
    { name: 'Rose Gold', slug: 'rose-gold', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches', 'Handbags', 'Clutches', 'Heels', 'Pumps', 'Sandals'] },
    { name: 'Burgundy', slug: 'burgundy', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Olive', slug: 'olive', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Coral', slug: 'coral', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Teal', slug: 'teal', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
    { name: 'Multicolor', slug: 'multicolor', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares'] },
  ],
  Material: [
    { name: 'Cotton', slug: 'cotton', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Scarves', 'Hats', 'Gloves', 'Ties', 'Pocket Squares'] },
    { name: 'Leather', slug: 'leather', categories: ['Coats', 'Jackets', 'Pants', 'Skirts', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Belts', 'Gloves'] },
    { name: 'Silk', slug: 'silk', categories: ['Dresses', 'Tops', 'Blouses', 'Skirts', 'Suits', 'Blazers', 'Lingerie', 'Scarves', 'Ties', 'Pocket Squares'] },
    { name: 'Wool', slug: 'wool', categories: ['Coats', 'Jackets', 'Sweaters', 'Cardigans', 'Pants', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Scarves', 'Hats', 'Gloves'] },
    { name: 'Cashmere', slug: 'cashmere', categories: ['Coats', 'Sweaters', 'Cardigans', 'Knitwear', 'Scarves', 'Hats', 'Gloves'] },
    { name: 'Linen', slug: 'linen', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers'] },
    { name: 'Denim', slug: 'denim', categories: ['Jackets', 'Shirts', 'Pants', 'Jeans', 'Shorts', 'Skirts'] },
    { name: 'Polyester', slug: 'polyester', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Activewear'] },
    { name: 'Nylon', slug: 'nylon', categories: ['Coats', 'Jackets', 'Activewear', 'Swimwear', 'Backpacks', 'Travel Bags', 'Lingerie'] },
    { name: 'Suede', slug: 'suede', categories: ['Coats', 'Jackets', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Clutches', 'Belts', 'Gloves'] },
    { name: 'Canvas', slug: 'canvas', categories: ['Sneakers', 'Espadrilles', 'Backpacks', 'Tote Bags', 'Travel Bags', 'Hats'] },
    { name: 'Velvet', slug: 'velvet', categories: ['Dresses', 'Tops', 'Blouses', 'Blazers', 'Heels', 'Pumps', 'Clutches', 'Hair Accessories'] },
    { name: 'Satin', slug: 'satin', categories: ['Dresses', 'Tops', 'Blouses', 'Skirts', 'Lingerie', 'Heels', 'Pumps', 'Sandals', 'Clutches', 'Hair Accessories'] },
    { name: 'Tweed', slug: 'tweed', categories: ['Coats', 'Jackets', 'Suits', 'Blazers', 'Skirts'] },
    { name: 'Faux Leather', slug: 'faux-leather', categories: ['Coats', 'Jackets', 'Pants', 'Skirts', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Wallets', 'Belt Bags', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Belts'] },
    { name: 'Faux Fur', slug: 'faux-fur', categories: ['Coats', 'Jackets', 'Scarves', 'Hats', 'Gloves'] },
    // Jewelry materials
    { name: 'Stainless Steel', slug: 'stainless-steel', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
    { name: 'Gold', slug: 'gold-material', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
    { name: 'Silver', slug: 'silver-material', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
    { name: 'Platinum', slug: 'platinum', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches'] },
    { name: 'Rose Gold', slug: 'rose-gold-material', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
  ],
  Fit: [
    { name: 'Slim Fit', slug: 'slim-fit', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Activewear'] },
    { name: 'Regular Fit', slug: 'regular-fit', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Activewear'] },
    { name: 'Relaxed Fit', slug: 'relaxed-fit', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Activewear'] },
    { name: 'Oversized', slug: 'oversized', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear'] },
    { name: 'Skinny', slug: 'skinny', categories: ['Pants', 'Jeans'] },
    { name: 'Straight', slug: 'straight', categories: ['Pants', 'Jeans'] },
    { name: 'Bootcut', slug: 'bootcut', categories: ['Pants', 'Jeans'] },
    { name: 'Wide Leg', slug: 'wide-leg', categories: ['Pants', 'Jeans', 'Shorts'] },
    { name: 'Cropped', slug: 'cropped', categories: ['Pants', 'Jeans', 'Tops', 'Sweaters', 'Cardigans', 'Jackets'] },
    { name: 'Tailored', slug: 'tailored', categories: ['Suits', 'Blazers', 'Pants', 'Shirts', 'Dresses'] },
  ],
  Length: [
    { name: 'Mini', slug: 'mini', categories: ['Dresses', 'Skirts'] },
    { name: 'Short', slug: 'short', categories: ['Dresses', 'Skirts', 'Shorts'] },
    { name: 'Knee Length', slug: 'knee-length', categories: ['Dresses', 'Skirts', 'Coats'] },
    { name: 'Midi', slug: 'midi', categories: ['Dresses', 'Skirts'] },
    { name: 'Maxi', slug: 'maxi', categories: ['Dresses', 'Skirts'] },
    { name: 'Floor Length', slug: 'floor-length', categories: ['Dresses'] },
    { name: 'Cropped', slug: 'cropped-length', categories: ['Pants', 'Jeans', 'Tops', 'Jackets'] },
    { name: 'Regular', slug: 'regular-length', categories: ['Pants', 'Jeans', 'Coats', 'Jackets', 'Tops'] },
    { name: 'Long', slug: 'long', categories: ['Coats', 'Jackets', 'Dresses', 'Cardigans'] },
    // Necklace lengths
    { name: 'Choker (14-16")', slug: 'choker', categories: ['Necklaces'] },
    { name: 'Princess (17-19")', slug: 'princess', categories: ['Necklaces'] },
    { name: 'Matinee (20-24")', slug: 'matinee', categories: ['Necklaces'] },
    { name: 'Opera (28-36")', slug: 'opera', categories: ['Necklaces'] },
  ],
  Condition: [
    { name: 'New with Tags', slug: 'new-with-tags', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares', 'Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
    { name: 'New without Tags', slug: 'new-without-tags', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares', 'Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
    { name: 'Like New', slug: 'like-new', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares', 'Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
    { name: 'Excellent', slug: 'excellent', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares', 'Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
    { name: 'Very Good', slug: 'very-good', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares', 'Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
    { name: 'Good', slug: 'good', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares', 'Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
    { name: 'Fair', slug: 'fair', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'Belts', 'Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares', 'Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
  ],
  'Heel Height': [
    { name: 'Flat (0-1")', slug: 'flat', categories: ['Heels', 'Pumps', 'Sandals', 'Flats', 'Mules', 'Boots', 'Ankle Boots'] },
    { name: 'Low (1-2")', slug: 'low', categories: ['Heels', 'Pumps', 'Sandals', 'Mules', 'Boots', 'Ankle Boots'] },
    { name: 'Mid (2-3")', slug: 'mid', categories: ['Heels', 'Pumps', 'Sandals', 'Mules', 'Boots', 'Ankle Boots'] },
    { name: 'High (3-4")', slug: 'high', categories: ['Heels', 'Pumps', 'Sandals', 'Mules', 'Boots', 'Ankle Boots'] },
    { name: 'Very High (4"+)', slug: 'very-high', categories: ['Heels', 'Pumps', 'Sandals', 'Mules', 'Boots', 'Ankle Boots'] },
  ],
}

export const seedAttributeOptions = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding attribute options...')

  // Get all attributes for mapping
  const attributesResult = await payload.find({
    collection: 'attributes',
    limit: 100,
  })

  const attributeMap = new Map(attributesResult.docs.map((a) => [a.name, a.id]))

  // Get all categories for mapping
  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 200,
  })

  const categoryMap = new Map(categoriesResult.docs.map((c) => [c.category, c.id]))

  for (const [attributeName, options] of Object.entries(attributeOptionsData)) {
    const attributeId = attributeMap.get(attributeName)

    if (!attributeId) {
      payload.logger.warn(`Attribute "${attributeName}" not found, skipping options...`)
      continue
    }

    for (const option of options) {
      // Check if option already exists
      const existing = await payload.find({
        collection: 'attributeOptions',
        where: {
          and: [
            { attribute: { equals: attributeId } },
            { slug: { equals: option.slug } },
          ],
        },
        limit: 1,
      })

      // Get category IDs for this option
      let categoryIds: string[] = []
      if (option.categories && option.categories.length > 0) {
        categoryIds = option.categories
          .map((catName) => categoryMap.get(catName))
          .filter((id): id is string => id !== undefined)
      }

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'attributeOptions',
          data: {
            name: option.name,
            slug: option.slug,
            attribute: attributeId,
            categories: categoryIds.length > 0 ? categoryIds : undefined,
          },
        })
        payload.logger.info(`Created option: ${attributeName} -> ${option.name}${categoryIds.length > 0 ? ` (${categoryIds.length} categories)` : ''}`)
      } else if (categoryIds.length > 0) {
        // Update existing option with categories
        await payload.update({
          collection: 'attributeOptions',
          id: existing.docs[0].id,
          data: {
            categories: categoryIds,
          },
        })
        payload.logger.info(`Updated option: ${attributeName} -> ${option.name} (${categoryIds.length} categories)`)
      }
    }
  }

  payload.logger.info('Finished seeding attribute options')
}
