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
    // Clothing sizes (for most clothing categories including African fashion)
    { name: 'XXS', slug: 'xxs', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Batakari / Smock', 'Kaba & Slit', 'Agbada', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Boubou / Kaftan'] },
    { name: 'XS', slug: 'xs', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Batakari / Smock', 'Kaba & Slit', 'Agbada', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Boubou / Kaftan'] },
    { name: 'S', slug: 's', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Batakari / Smock', 'Kaba & Slit', 'Agbada', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Boubou / Kaftan'] },
    { name: 'M', slug: 'm', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Batakari / Smock', 'Kaba & Slit', 'Agbada', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Boubou / Kaftan'] },
    { name: 'L', slug: 'l', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Batakari / Smock', 'Kaba & Slit', 'Agbada', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Boubou / Kaftan'] },
    { name: 'XL', slug: 'xl', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Batakari / Smock', 'Kaba & Slit', 'Agbada', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Boubou / Kaftan'] },
    { name: '2XL', slug: '2xl', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Batakari / Smock', 'Kaba & Slit', 'Agbada', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Boubou / Kaftan'] },
    { name: '3XL', slug: '3xl', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Batakari / Smock', 'Kaba & Slit', 'Agbada', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Boubou / Kaftan'] },
    { name: '4XL', slug: '4xl', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Batakari / Smock', 'Kaba & Slit', 'Agbada', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Boubou / Kaftan'] },
    { name: '5XL', slug: '5xl', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Batakari / Smock', 'Kaba & Slit', 'Agbada', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Boubou / Kaftan'] },
    { name: '6XL', slug: '6xl', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Batakari / Smock', 'Kaba & Slit', 'Agbada', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Boubou / Kaftan'] },

    // Numeric sizes (for dresses, suits, etc.)
    { name: '36', slug: '36', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '38', slug: '38', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '40', slug: '40', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '42', slug: '42', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '44', slug: '44', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '46', slug: '46', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '48', slug: '48', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '50', slug: '50', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '52', slug: '52', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '54', slug: '54', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '56', slug: '56', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '58', slug: '58', categories: ['Dresses', 'Suits', 'Blazers'] },
    { name: '60', slug: '60', categories: ['Dresses', 'Suits', 'Blazers'] },

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
    { name: 'W42 L30', slug: 'w42-l30', categories: ['Jeans', 'Pants'] },
    { name: 'W42 L32', slug: 'w42-l32', categories: ['Jeans', 'Pants'] },
    { name: 'W42 L34', slug: 'w42-l34', categories: ['Jeans', 'Pants'] },
    { name: 'W44 L30', slug: 'w44-l30', categories: ['Jeans', 'Pants'] },
    { name: 'W44 L32', slug: 'w44-l32', categories: ['Jeans', 'Pants'] },
    { name: 'W44 L34', slug: 'w44-l34', categories: ['Jeans', 'Pants'] },
    { name: 'W46 L30', slug: 'w46-l30', categories: ['Jeans', 'Pants'] },
    { name: 'W46 L32', slug: 'w46-l32', categories: ['Jeans', 'Pants'] },
    { name: 'W46 L34', slug: 'w46-l34', categories: ['Jeans', 'Pants'] },
    { name: 'W48 L30', slug: 'w48-l30', categories: ['Jeans', 'Pants'] },
    { name: 'W48 L32', slug: 'w48-l32', categories: ['Jeans', 'Pants'] },
    { name: 'W48 L34', slug: 'w48-l34', categories: ['Jeans', 'Pants'] },
    { name: 'W50 L30', slug: 'w50-l30', categories: ['Jeans', 'Pants'] },
    { name: 'W50 L32', slug: 'w50-l32', categories: ['Jeans', 'Pants'] },
    { name: 'W50 L34', slug: 'w50-l34', categories: ['Jeans', 'Pants'] },

    // US Shoe sizes
    { name: 'US 5', slug: 'us-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 5.5', slug: 'us-5-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 6', slug: 'us-6', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 6.5', slug: 'us-6-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 7', slug: 'us-7', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 7.5', slug: 'us-7-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 8', slug: 'us-8', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 8.5', slug: 'us-8-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 9', slug: 'us-9', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 9.5', slug: 'us-9-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 10', slug: 'us-10', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 10.5', slug: 'us-10-5', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 11', slug: 'us-11', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 12', slug: 'us-12', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 13', slug: 'us-13', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles', 'African Sandals'] },
    { name: 'US 14', slug: 'us-14', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Sandals', 'Loafers', 'African Sandals'] },
    { name: 'US 15', slug: 'us-15', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Sandals', 'Loafers', 'African Sandals'] },

    // Ring sizes
    { name: 'Ring 4', slug: 'ring-4', categories: ['Rings'] },
    { name: 'Ring 5', slug: 'ring-5', categories: ['Rings'] },
    { name: 'Ring 6', slug: 'ring-6', categories: ['Rings'] },
    { name: 'Ring 7', slug: 'ring-7', categories: ['Rings'] },
    { name: 'Ring 8', slug: 'ring-8', categories: ['Rings'] },
    { name: 'Ring 9', slug: 'ring-9', categories: ['Rings'] },
    { name: 'Ring 10', slug: 'ring-10', categories: ['Rings'] },
    { name: 'Ring 11', slug: 'ring-11', categories: ['Rings'] },
    { name: 'Ring 12', slug: 'ring-12', categories: ['Rings'] },
    { name: 'Ring 13', slug: 'ring-13', categories: ['Rings'] },

    // Belt sizes
    { name: 'S (28-30")', slug: 'belt-s', categories: ['Belts'] },
    { name: 'M (32-34")', slug: 'belt-m', categories: ['Belts'] },
    { name: 'L (36-38")', slug: 'belt-l', categories: ['Belts'] },
    { name: 'XL (40-42")', slug: 'belt-xl', categories: ['Belts'] },
    { name: '2XL (44-46")', slug: 'belt-2xl', categories: ['Belts'] },
    { name: '3XL (48-50")', slug: 'belt-3xl', categories: ['Belts'] },
    { name: '4XL (52-54")', slug: 'belt-4xl', categories: ['Belts'] },

    // Bracelet sizes
    { name: '6" (X-Small)', slug: 'bracelet-xs', categories: ['Bracelets', 'African Beads & Jewelry'] },
    { name: '6.5" (Small)', slug: 'bracelet-s', categories: ['Bracelets', 'African Beads & Jewelry'] },
    { name: '7" (Medium)', slug: 'bracelet-m', categories: ['Bracelets', 'African Beads & Jewelry'] },
    { name: '7.5" (Large)', slug: 'bracelet-l', categories: ['Bracelets', 'African Beads & Jewelry'] },
    { name: '8" (X-Large)', slug: 'bracelet-xl', categories: ['Bracelets', 'African Beads & Jewelry'] },
    { name: '8.5" (2X-Large)', slug: 'bracelet-2xl', categories: ['Bracelets', 'African Beads & Jewelry'] },

    // Glove sizes
    { name: 'XS (6-6.5")', slug: 'glove-xs', categories: ['Gloves'] },
    { name: 'S (6.5-7")', slug: 'glove-s', categories: ['Gloves'] },
    { name: 'M (7.5-8")', slug: 'glove-m', categories: ['Gloves'] },
    { name: 'L (8.5-9")', slug: 'glove-l', categories: ['Gloves'] },
    { name: 'XL (9.5-10")', slug: 'glove-xl', categories: ['Gloves'] },
    { name: '2XL (10.5-11")', slug: 'glove-2xl', categories: ['Gloves'] },

    // Hat sizes
    { name: 'S (54-55cm)', slug: 'hat-s', categories: ['Hats'] },
    { name: 'M (56-57cm)', slug: 'hat-m', categories: ['Hats'] },
    { name: 'L (58-59cm)', slug: 'hat-l', categories: ['Hats'] },
    { name: 'XL (60-61cm)', slug: 'hat-xl', categories: ['Hats'] },
    { name: '2XL (62-63cm)', slug: 'hat-2xl', categories: ['Hats'] },
    { name: '3XL (64-65cm)', slug: 'hat-3xl', categories: ['Hats'] },

    // One size (accessories)
    { name: 'One Size', slug: 'one-size', categories: ['Scarves', 'Sunglasses', 'Hair Accessories', 'Ties', 'Pocket Squares', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Headwraps & Gele', 'African Print Accessories', 'Raffia Bags'] },
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
    { name: 'Cotton', slug: 'cotton', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Jeans', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Lingerie', 'Activewear', 'Scarves', 'Hats', 'Gloves', 'Ties', 'Pocket Squares', 'Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Kaba & Slit', 'Ankara', 'African Print Skirts', 'African Print Pants'] },
    { name: 'Leather', slug: 'leather', categories: ['Coats', 'Jackets', 'Pants', 'Skirts', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Belts', 'Gloves', 'African Sandals'] },
    { name: 'Silk', slug: 'silk', categories: ['Dresses', 'Tops', 'Blouses', 'Skirts', 'Suits', 'Blazers', 'Lingerie', 'Scarves', 'Ties', 'Pocket Squares', 'Headwraps & Gele', 'Boubou / Kaftan'] },
    { name: 'Wool', slug: 'wool', categories: ['Coats', 'Jackets', 'Sweaters', 'Cardigans', 'Pants', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Scarves', 'Hats', 'Gloves'] },
    { name: 'Cashmere', slug: 'cashmere', categories: ['Coats', 'Sweaters', 'Cardigans', 'Knitwear', 'Scarves', 'Hats', 'Gloves'] },
    { name: 'Linen', slug: 'linen', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'African Print Dresses', 'African Print Shirts', 'Boubou / Kaftan', 'Agbada'] },
    { name: 'Denim', slug: 'denim', categories: ['Jackets', 'Shirts', 'Pants', 'Jeans', 'Shorts', 'Skirts'] },
    { name: 'Polyester', slug: 'polyester', categories: ['Coats', 'Jackets', 'Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers', 'Trench Coats', 'Knitwear', 'Swimwear', 'Activewear'] },
    { name: 'Nylon', slug: 'nylon', categories: ['Coats', 'Jackets', 'Activewear', 'Swimwear', 'Backpacks', 'Travel Bags', 'Lingerie'] },
    { name: 'Suede', slug: 'suede', categories: ['Coats', 'Jackets', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Clutches', 'Belts', 'Gloves'] },
    { name: 'Canvas', slug: 'canvas', categories: ['Sneakers', 'Espadrilles', 'Backpacks', 'Tote Bags', 'Travel Bags', 'Hats'] },
    { name: 'Velvet', slug: 'velvet', categories: ['Dresses', 'Tops', 'Blouses', 'Blazers', 'Heels', 'Pumps', 'Clutches', 'Hair Accessories', 'Agbada', 'Boubou / Kaftan'] },
    { name: 'Satin', slug: 'satin', categories: ['Dresses', 'Tops', 'Blouses', 'Skirts', 'Lingerie', 'Heels', 'Pumps', 'Sandals', 'Clutches', 'Hair Accessories', 'Headwraps & Gele'] },
    { name: 'Tweed', slug: 'tweed', categories: ['Coats', 'Jackets', 'Suits', 'Blazers', 'Skirts'] },
    { name: 'Faux Leather', slug: 'faux-leather', categories: ['Coats', 'Jackets', 'Pants', 'Skirts', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Wallets', 'Belt Bags', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Belts'] },
    { name: 'Faux Fur', slug: 'faux-fur', categories: ['Coats', 'Jackets', 'Scarves', 'Hats', 'Gloves'] },
    // African Fabrics
    { name: 'Kente Cloth', slug: 'kente-cloth', categories: ['Kente', 'African Print Dresses', 'African Print Shirts', 'Headwraps & Gele', 'African Print Accessories'] },
    { name: 'Ankara/African Wax', slug: 'ankara-wax', categories: ['African Print Dresses', 'African Print Shirts', 'Dashiki', 'Kaba & Slit', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Headwraps & Gele', 'African Print Accessories'] },
    { name: 'Aso Oke', slug: 'aso-oke-fabric', categories: ['Agbada', 'Kaba & Slit', 'Headwraps & Gele'] },
    { name: 'Batakari/Smock Cloth', slug: 'batakari-cloth', categories: ['Batakari / Smock'] },
    { name: 'Raffia', slug: 'raffia', categories: ['Raffia Bags', 'African Sandals', 'Hats', 'African Print Accessories'] },
    { name: 'Brocade', slug: 'brocade', categories: ['Agbada', 'Boubou / Kaftan', 'Kaba & Slit', 'African Print Dresses'] },
    { name: 'Lace', slug: 'lace', categories: ['African Print Dresses', 'Kaba & Slit', 'Boubou / Kaftan', 'Dresses', 'Tops', 'Blouses', 'Lingerie'] },
    { name: 'Adire (Tie-Dye)', slug: 'adire', categories: ['African Print Dresses', 'African Print Shirts', 'Ankara', 'Headwraps & Gele'] },
    { name: 'Woodin', slug: 'woodin', categories: ['African Print Dresses', 'African Print Shirts', 'Ankara', 'African Print Skirts', 'African Print Pants'] },
    { name: 'Vlisco', slug: 'vlisco', categories: ['African Print Dresses', 'African Print Shirts', 'Kaba & Slit', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Headwraps & Gele'] },
    { name: 'GTP', slug: 'gtp', categories: ['African Print Dresses', 'African Print Shirts', 'Ankara', 'African Print Skirts', 'African Print Pants'] },
    // Jewelry materials
    { name: 'Stainless Steel', slug: 'stainless-steel', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
    { name: 'Gold', slug: 'gold-material', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches', 'African Beads & Jewelry'] },
    { name: 'Silver', slug: 'silver-material', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches', 'African Beads & Jewelry'] },
    { name: 'Platinum', slug: 'platinum', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches'] },
    { name: 'Rose Gold', slug: 'rose-gold-material', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
    // African Jewelry Materials
    { name: 'Beads', slug: 'beads', categories: ['African Beads & Jewelry', 'Necklaces', 'Bracelets', 'Earrings'] },
    { name: 'Cowrie Shells', slug: 'cowrie-shells', categories: ['African Beads & Jewelry', 'Necklaces', 'Bracelets', 'Earrings', 'African Print Accessories'] },
    { name: 'Bone/Horn', slug: 'bone-horn', categories: ['African Beads & Jewelry', 'Necklaces', 'Bracelets', 'Earrings'] },
    { name: 'Brass', slug: 'brass', categories: ['African Beads & Jewelry', 'Necklaces', 'Bracelets', 'Earrings', 'Cufflinks'] },
    { name: 'Wood', slug: 'wood', categories: ['African Beads & Jewelry', 'Necklaces', 'Bracelets', 'Earrings'] },
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
  // African Fashion - Print/Pattern Types
  'Print/Pattern': [
    // Ankara/African Wax Prints
    { name: 'Ankara', slug: 'ankara', categories: ['Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Kaba & Slit', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Headwraps & Gele', 'African Print Accessories'] },
    { name: 'Wax Print', slug: 'wax-print', categories: ['Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Kaba & Slit', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Headwraps & Gele', 'African Print Accessories'] },
    { name: 'Kitenge', slug: 'kitenge', categories: ['African Print Dresses', 'African Print Shirts', 'African Print Skirts', 'African Print Pants'] },
    { name: 'Adinkra', slug: 'adinkra', categories: ['Kente', 'African Print Dresses', 'African Print Shirts', 'Batakari / Smock', 'African Print Accessories'] },
    { name: 'Bogolan/Mud Cloth', slug: 'bogolan', categories: ['African Print Dresses', 'African Print Shirts', 'African Print Accessories', 'Raffia Bags'] },
    { name: 'Shweshwe', slug: 'shweshwe', categories: ['African Print Dresses', 'African Print Shirts', 'African Print Skirts'] },
    { name: 'Aso Oke', slug: 'aso-oke', categories: ['Agbada', 'Kaba & Slit', 'Headwraps & Gele', 'African Print Accessories'] },
    { name: 'Kanga', slug: 'kanga', categories: ['African Print Dresses', 'Headwraps & Gele', 'African Print Accessories'] },
    // General Patterns
    { name: 'Geometric', slug: 'geometric', categories: ['Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Ankara', 'African Print Skirts', 'African Print Pants', 'African Print Accessories'] },
    { name: 'Floral', slug: 'floral', categories: ['African Print Dresses', 'African Print Shirts', 'Ankara', 'African Print Skirts', 'African Print Pants', 'Headwraps & Gele', 'Dresses', 'Tops', 'Blouses', 'Skirts'] },
    { name: 'Abstract', slug: 'abstract', categories: ['African Print Dresses', 'African Print Shirts', 'Ankara', 'African Print Skirts', 'African Print Pants'] },
    { name: 'Animal Print', slug: 'animal-print', categories: ['African Print Dresses', 'African Print Shirts', 'Dresses', 'Tops', 'Blouses', 'Skirts'] },
    { name: 'Tribal', slug: 'tribal', categories: ['Kente', 'African Print Dresses', 'African Print Shirts', 'Dashiki', 'Batakari / Smock', 'African Print Accessories'] },
    { name: 'Striped', slug: 'striped', categories: ['Kente', 'Shirts', 'T-Shirts', 'Dresses', 'Pants'] },
    { name: 'Solid', slug: 'solid', categories: ['Dresses', 'Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Pants', 'Skirts'] },
  ],
  // African Fashion - Weave Types (for Kente and woven fabrics)
  'Weave Type': [
    // Traditional Kente Weaves
    { name: 'Oyokoman', slug: 'oyokoman', categories: ['Kente'] },
    { name: 'Adweneasa', slug: 'adweneasa', categories: ['Kente'] },
    { name: 'Sika Futuro', slug: 'sika-futuro', categories: ['Kente'] },
    { name: 'Akyem', slug: 'akyem', categories: ['Kente'] },
    { name: 'Fawohodie', slug: 'fawohodie', categories: ['Kente'] },
    { name: 'Abusua Ye Dom', slug: 'abusua-ye-dom', categories: ['Kente'] },
    { name: 'Emaa Da', slug: 'emaa-da', categories: ['Kente'] },
    // Northern Ghana Smock Weaves
    { name: 'Dagomba Smock', slug: 'dagomba-smock', categories: ['Batakari / Smock'] },
    { name: 'Gonja Smock', slug: 'gonja-smock', categories: ['Batakari / Smock'] },
    { name: 'Fugu', slug: 'fugu', categories: ['Batakari / Smock'] },
    // General Weave Types
    { name: 'Hand Woven', slug: 'hand-woven', categories: ['Kente', 'Batakari / Smock', 'Raffia Bags', 'African Beads & Jewelry'] },
    { name: 'Machine Woven', slug: 'machine-woven', categories: ['Kente', 'Batakari / Smock'] },
  ],
  // Occasion - when to wear
  'Occasion': [
    // Traditional/Cultural Events
    { name: 'Wedding', slug: 'wedding', categories: ['Kente', 'African Print Dresses', 'Dashiki', 'Kaba & Slit', 'Agbada', 'Boubou / Kaftan', 'Dresses', 'Suits'] },
    { name: 'Naming Ceremony', slug: 'naming-ceremony', categories: ['Kente', 'African Print Dresses', 'Dashiki', 'Kaba & Slit', 'Agbada'] },
    { name: 'Funeral', slug: 'funeral', categories: ['Kente', 'African Print Dresses', 'Kaba & Slit', 'Dresses'] },
    { name: 'Church/Religious', slug: 'church', categories: ['Kente', 'African Print Dresses', 'Kaba & Slit', 'Dresses', 'Suits'] },
    { name: 'Festival', slug: 'festival', categories: ['Kente', 'African Print Dresses', 'Dashiki', 'Batakari / Smock', 'Agbada'] },
    { name: 'Traditional Ceremony', slug: 'traditional-ceremony', categories: ['Kente', 'African Print Dresses', 'Dashiki', 'Kaba & Slit', 'Agbada', 'Boubou / Kaftan'] },
    // Modern Occasions
    { name: 'Casual', slug: 'casual', categories: ['African Print Dresses', 'African Print Shirts', 'Dashiki', 'Ankara', 'African Print Skirts', 'African Print Pants', 'T-Shirts', 'Jeans', 'Shorts', 'Sneakers'] },
    { name: 'Office/Work', slug: 'office', categories: ['African Print Dresses', 'African Print Shirts', 'Kaba & Slit', 'Ankara', 'Shirts', 'Blouses', 'Suits', 'Blazers', 'Pants'] },
    { name: 'Party/Nightout', slug: 'party', categories: ['African Print Dresses', 'Ankara', 'Dresses', 'Heels', 'Clutches'] },
    { name: 'Beach/Resort', slug: 'beach', categories: ['Boubou / Kaftan', 'Swimwear', 'Sandals', 'African Print Accessories'] },
    { name: 'Everyday', slug: 'everyday', categories: ['African Print Dresses', 'African Print Shirts', 'Ankara', 'T-Shirts', 'Jeans', 'Sneakers'] },
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
