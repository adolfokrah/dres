import type { Payload } from 'payload'

// Variant options with their type and category mappings
// Empty categories array [] means the option applies to ALL categories
const variantOptionsData: {
  variantType: string
  label: string
  categories: string[]
}[] = [
  // ============ SIZE OPTIONS ============
  // General clothing sizes
  { variantType: 'Size', label: 'XXS', categories: ['Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Dresses', 'Coats', 'Jackets', 'Suits', 'Blazers', 'Knitwear', 'Activewear', 'Swimwear', 'Lingerie'] },
  { variantType: 'Size', label: 'XS', categories: ['Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Dresses', 'Coats', 'Jackets', 'Suits', 'Blazers', 'Knitwear', 'Activewear', 'Swimwear', 'Lingerie'] },
  { variantType: 'Size', label: 'S', categories: ['Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Dresses', 'Coats', 'Jackets', 'Suits', 'Blazers', 'Knitwear', 'Activewear', 'Swimwear', 'Lingerie'] },
  { variantType: 'Size', label: 'M', categories: ['Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Dresses', 'Coats', 'Jackets', 'Suits', 'Blazers', 'Knitwear', 'Activewear', 'Swimwear', 'Lingerie'] },
  { variantType: 'Size', label: 'L', categories: ['Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Dresses', 'Coats', 'Jackets', 'Suits', 'Blazers', 'Knitwear', 'Activewear', 'Swimwear', 'Lingerie'] },
  { variantType: 'Size', label: 'XL', categories: ['Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Dresses', 'Coats', 'Jackets', 'Suits', 'Blazers', 'Knitwear', 'Activewear', 'Swimwear', 'Lingerie'] },
  { variantType: 'Size', label: 'XXL', categories: ['Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Dresses', 'Coats', 'Jackets', 'Suits', 'Blazers', 'Knitwear', 'Activewear', 'Swimwear', 'Lingerie'] },
  { variantType: 'Size', label: '3XL', categories: ['Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Sweaters', 'Cardigans', 'Dresses', 'Coats', 'Jackets', 'Suits', 'Blazers', 'Knitwear', 'Activewear'] },

  // Pants/Jeans sizes (waist x length combinations)
  { variantType: 'Size', label: 'W26 L30', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W26 L32', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W28 L30', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W28 L32', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W28 L34', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W29 L30', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W29 L32', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W29 L34', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W30 L30', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W30 L32', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W30 L34', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W31 L30', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W31 L32', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W31 L34', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W32 L30', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W32 L32', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W32 L34', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W33 L30', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W33 L32', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W33 L34', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W34 L30', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W34 L32', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W34 L34', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W36 L30', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W36 L32', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W36 L34', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W38 L30', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W38 L32', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W38 L34', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W40 L32', categories: ['Pants', 'Jeans'] },
  { variantType: 'Size', label: 'W40 L34', categories: ['Pants', 'Jeans'] },

  // Shorts sizes (waist only)
  { variantType: 'Size', label: 'W26', categories: ['Shorts'] },
  { variantType: 'Size', label: 'W28', categories: ['Shorts'] },
  { variantType: 'Size', label: 'W30', categories: ['Shorts'] },
  { variantType: 'Size', label: 'W32', categories: ['Shorts'] },
  { variantType: 'Size', label: 'W34', categories: ['Shorts'] },
  { variantType: 'Size', label: 'W36', categories: ['Shorts'] },
  { variantType: 'Size', label: 'W38', categories: ['Shorts'] },
  { variantType: 'Size', label: 'W40', categories: ['Shorts'] },

  // UK Sizes
  { variantType: 'Size', label: 'UK 6', categories: ['Skirts', 'Dresses'] },
  { variantType: 'Size', label: 'UK 8', categories: ['Skirts', 'Dresses'] },
  { variantType: 'Size', label: 'UK 10', categories: ['Skirts', 'Dresses'] },
  { variantType: 'Size', label: 'UK 12', categories: ['Skirts', 'Dresses'] },
  { variantType: 'Size', label: 'UK 14', categories: ['Skirts', 'Dresses'] },
  { variantType: 'Size', label: 'UK 16', categories: ['Skirts', 'Dresses'] },

  // Shoe sizes (EU)
  { variantType: 'Size', label: 'EU 35', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
  { variantType: 'Size', label: 'EU 36', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
  { variantType: 'Size', label: 'EU 37', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
  { variantType: 'Size', label: 'EU 38', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
  { variantType: 'Size', label: 'EU 39', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
  { variantType: 'Size', label: 'EU 40', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
  { variantType: 'Size', label: 'EU 41', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Heels', 'Pumps', 'Sandals', 'Flats', 'Loafers', 'Mules', 'Espadrilles'] },
  { variantType: 'Size', label: 'EU 42', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Sandals', 'Loafers', 'Espadrilles'] },
  { variantType: 'Size', label: 'EU 43', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Sandals', 'Loafers', 'Espadrilles'] },
  { variantType: 'Size', label: 'EU 44', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Sandals', 'Loafers', 'Espadrilles'] },
  { variantType: 'Size', label: 'EU 45', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Sandals', 'Loafers', 'Espadrilles'] },
  { variantType: 'Size', label: 'EU 46', categories: ['Sneakers', 'Boots', 'Ankle Boots', 'Sandals', 'Loafers'] },

  // Bag sizes
  { variantType: 'Size', label: 'Mini Bag', categories: ['Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Backpacks'] },
  { variantType: 'Size', label: 'Small Bag', categories: ['Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Backpacks', 'Travel Bags'] },
  { variantType: 'Size', label: 'Medium Bag', categories: ['Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Backpacks', 'Travel Bags'] },
  { variantType: 'Size', label: 'Large Bag', categories: ['Handbags', 'Shoulder Bags', 'Tote Bags', 'Backpacks', 'Travel Bags'] },
  { variantType: 'Size', label: 'Oversized Bag', categories: ['Tote Bags', 'Travel Bags'] },

  // Belt sizes
  { variantType: 'Size', label: '75cm', categories: ['Belts'] },
  { variantType: 'Size', label: '80cm', categories: ['Belts'] },
  { variantType: 'Size', label: '85cm', categories: ['Belts'] },
  { variantType: 'Size', label: '90cm', categories: ['Belts'] },
  { variantType: 'Size', label: '95cm', categories: ['Belts'] },
  { variantType: 'Size', label: '100cm', categories: ['Belts'] },
  { variantType: 'Size', label: '105cm', categories: ['Belts'] },
  { variantType: 'Size', label: '110cm', categories: ['Belts'] },

  // Ring sizes
  { variantType: 'Size', label: 'Ring 48', categories: ['Rings'] },
  { variantType: 'Size', label: 'Ring 50', categories: ['Rings'] },
  { variantType: 'Size', label: 'Ring 52', categories: ['Rings'] },
  { variantType: 'Size', label: 'Ring 54', categories: ['Rings'] },
  { variantType: 'Size', label: 'Ring 56', categories: ['Rings'] },
  { variantType: 'Size', label: 'Ring 58', categories: ['Rings'] },
  { variantType: 'Size', label: 'Ring 60', categories: ['Rings'] },

  // Bracelet sizes
  { variantType: 'Size', label: '16cm', categories: ['Bracelets'] },
  { variantType: 'Size', label: '17cm', categories: ['Bracelets'] },
  { variantType: 'Size', label: '18cm', categories: ['Bracelets'] },
  { variantType: 'Size', label: '19cm', categories: ['Bracelets'] },
  { variantType: 'Size', label: '20cm', categories: ['Bracelets'] },
  { variantType: 'Size', label: '21cm', categories: ['Bracelets'] },

  // Watch sizes
  { variantType: 'Size', label: '36mm', categories: ['Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
  { variantType: 'Size', label: '38mm', categories: ['Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
  { variantType: 'Size', label: '40mm', categories: ['Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
  { variantType: 'Size', label: '41mm', categories: ['Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
  { variantType: 'Size', label: '42mm', categories: ['Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
  { variantType: 'Size', label: '44mm', categories: ['Luxury Watches', 'Sport Watches', 'Fashion Watches'] },
  { variantType: 'Size', label: '45mm', categories: ['Luxury Watches', 'Sport Watches', 'Fashion Watches'] },

  // One size
  { variantType: 'Size', label: 'One Size', categories: ['Scarves', 'Hats', 'Sunglasses', 'Gloves', 'Hair Accessories', 'Ties', 'Pocket Squares', 'Clutches', 'Wallets', 'Belt Bags', 'Necklaces', 'Earrings', 'Brooches', 'Cufflinks'] },

  // ============ COLOR OPTIONS ============
  // Neutrals
  { variantType: 'Color', label: 'Black', categories: [] },
  { variantType: 'Color', label: 'White', categories: [] },
  { variantType: 'Color', label: 'Navy', categories: [] },
  { variantType: 'Color', label: 'Grey', categories: [] },
  { variantType: 'Color', label: 'Beige', categories: [] },
  { variantType: 'Color', label: 'Brown', categories: [] },
  { variantType: 'Color', label: 'Tan', categories: [] },
  { variantType: 'Color', label: 'Camel', categories: [] },
  { variantType: 'Color', label: 'Cream', categories: [] },
  { variantType: 'Color', label: 'Ivory', categories: [] },

  // Bold colors
  { variantType: 'Color', label: 'Red', categories: [] },
  { variantType: 'Color', label: 'Burgundy', categories: [] },
  { variantType: 'Color', label: 'Pink', categories: [] },
  { variantType: 'Color', label: 'Fuchsia', categories: [] },
  { variantType: 'Color', label: 'Orange', categories: [] },
  { variantType: 'Color', label: 'Coral', categories: [] },
  { variantType: 'Color', label: 'Yellow', categories: [] },
  { variantType: 'Color', label: 'Mustard', categories: [] },

  // Cool colors
  { variantType: 'Color', label: 'Blue', categories: [] },
  { variantType: 'Color', label: 'Light Blue', categories: [] },
  { variantType: 'Color', label: 'Royal Blue', categories: [] },
  { variantType: 'Color', label: 'Teal', categories: [] },
  { variantType: 'Color', label: 'Turquoise', categories: [] },
  { variantType: 'Color', label: 'Green', categories: [] },
  { variantType: 'Color', label: 'Olive', categories: [] },
  { variantType: 'Color', label: 'Khaki', categories: [] },
  { variantType: 'Color', label: 'Mint', categories: [] },
  { variantType: 'Color', label: 'Sage', categories: [] },

  // Purples
  { variantType: 'Color', label: 'Purple', categories: [] },
  { variantType: 'Color', label: 'Lavender', categories: [] },
  { variantType: 'Color', label: 'Lilac', categories: [] },
  { variantType: 'Color', label: 'Plum', categories: [] },

  // Metallics
  { variantType: 'Color', label: 'Gold', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Fashion Watches', 'Heels', 'Pumps', 'Sandals', 'Clutches', 'Handbags'] },
  { variantType: 'Color', label: 'Silver', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Cufflinks', 'Luxury Watches', 'Sport Watches', 'Fashion Watches', 'Heels', 'Pumps', 'Sandals', 'Clutches', 'Handbags'] },
  { variantType: 'Color', label: 'Rose Gold', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Luxury Watches', 'Fashion Watches', 'Clutches', 'Handbags'] },

  // Patterns
  { variantType: 'Color', label: 'Multi', categories: [] },
  { variantType: 'Color', label: 'Print', categories: [] },
  { variantType: 'Color', label: 'Stripe', categories: [] },
  { variantType: 'Color', label: 'Check', categories: [] },
  { variantType: 'Color', label: 'Floral', categories: [] },
  { variantType: 'Color', label: 'Animal Print', categories: [] },

  // ============ MATERIAL OPTIONS ============
  // Fabrics
  { variantType: 'Material', label: 'Cotton', categories: ['Tops', 'Shirts', 'Blouses', 'T-Shirts', 'Dresses', 'Pants', 'Shorts', 'Skirts'] },
  { variantType: 'Material', label: 'Linen', categories: ['Tops', 'Shirts', 'Blouses', 'Dresses', 'Pants', 'Shorts', 'Skirts', 'Suits', 'Blazers'] },
  { variantType: 'Material', label: 'Silk', categories: ['Tops', 'Blouses', 'Dresses', 'Scarves', 'Ties', 'Pocket Squares', 'Lingerie'] },
  { variantType: 'Material', label: 'Wool', categories: ['Sweaters', 'Cardigans', 'Coats', 'Jackets', 'Suits', 'Blazers', 'Knitwear', 'Scarves', 'Trench Coats'] },
  { variantType: 'Material', label: 'Cashmere', categories: ['Sweaters', 'Cardigans', 'Scarves', 'Knitwear', 'Coats'] },
  { variantType: 'Material', label: 'Denim', categories: ['Jeans', 'Jackets', 'Shorts', 'Skirts'] },
  { variantType: 'Material', label: 'Velvet', categories: ['Dresses', 'Blazers', 'Tops', 'Heels', 'Pumps', 'Clutches'] },
  { variantType: 'Material', label: 'Satin', categories: ['Dresses', 'Blouses', 'Lingerie', 'Heels', 'Pumps', 'Clutches'] },
  { variantType: 'Material', label: 'Chiffon', categories: ['Dresses', 'Blouses', 'Tops', 'Scarves'] },
  { variantType: 'Material', label: 'Tweed', categories: ['Jackets', 'Blazers', 'Skirts', 'Coats'] },
  { variantType: 'Material', label: 'Jersey', categories: ['Dresses', 'Tops', 'T-Shirts', 'Activewear'] },

  // Leather & Exotic
  { variantType: 'Material', label: 'Leather', categories: ['Jackets', 'Coats', 'Pants', 'Skirts', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Tote Bags', 'Clutches', 'Backpacks', 'Travel Bags', 'Wallets', 'Belt Bags', 'Belts', 'Boots', 'Ankle Boots', 'Heels', 'Loafers', 'Sneakers', 'Gloves'] },
  { variantType: 'Material', label: 'Suede', categories: ['Jackets', 'Boots', 'Ankle Boots', 'Loafers', 'Heels', 'Handbags', 'Clutches', 'Belts'] },
  { variantType: 'Material', label: 'Patent Leather', categories: ['Heels', 'Pumps', 'Loafers', 'Clutches', 'Belts'] },
  { variantType: 'Material', label: 'Exotic Leather', categories: ['Handbags', 'Wallets', 'Belts', 'Heels', 'Loafers'] },
  { variantType: 'Material', label: 'Vegan Leather', categories: ['Jackets', 'Handbags', 'Shoulder Bags', 'Crossbody Bags', 'Belts', 'Boots'] },

  // Technical
  { variantType: 'Material', label: 'Nylon', categories: ['Jackets', 'Backpacks', 'Travel Bags', 'Activewear', 'Swimwear'] },
  { variantType: 'Material', label: 'Polyester', categories: ['Activewear', 'Jackets', 'Swimwear'] },
  { variantType: 'Material', label: 'Gore-Tex', categories: ['Jackets', 'Coats', 'Boots'] },
  { variantType: 'Material', label: 'Canvas', categories: ['Sneakers', 'Tote Bags', 'Backpacks', 'Espadrilles'] },

  // Jewelry & Watch materials
  { variantType: 'Material', label: '18K Yellow Gold', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Luxury Watches', 'Fashion Watches'] },
  { variantType: 'Material', label: '18K White Gold', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Brooches', 'Luxury Watches'] },
  { variantType: 'Material', label: '18K Rose Gold', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Luxury Watches', 'Fashion Watches'] },
  { variantType: 'Material', label: 'Platinum', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Luxury Watches'] },
  { variantType: 'Material', label: 'Sterling Silver', categories: ['Necklaces', 'Bracelets', 'Earrings', 'Rings', 'Cufflinks'] },
  { variantType: 'Material', label: 'Stainless Steel', categories: ['Luxury Watches', 'Sport Watches', 'Fashion Watches', 'Bracelets', 'Cufflinks'] },

  // ============ LENGTH OPTIONS ============
  // Dress/Skirt lengths
  { variantType: 'Length', label: 'Mini Length', categories: ['Dresses', 'Skirts'] },
  { variantType: 'Length', label: 'Above Knee', categories: ['Dresses', 'Skirts', 'Shorts'] },
  { variantType: 'Length', label: 'Knee Length', categories: ['Dresses', 'Skirts', 'Coats'] },
  { variantType: 'Length', label: 'Midi', categories: ['Dresses', 'Skirts'] },
  { variantType: 'Length', label: 'Maxi', categories: ['Dresses', 'Skirts'] },
  { variantType: 'Length', label: 'Floor Length', categories: ['Dresses'] },

  // Pants lengths
  { variantType: 'Length', label: 'Cropped', categories: ['Pants', 'Jeans'] },
  { variantType: 'Length', label: 'Ankle Length', categories: ['Pants', 'Jeans'] },
  { variantType: 'Length', label: 'Regular', categories: ['Pants', 'Jeans'] },
  { variantType: 'Length', label: 'Long', categories: ['Pants', 'Jeans'] },

  // Necklace lengths
  { variantType: 'Length', label: 'Choker (35-40cm)', categories: ['Necklaces'] },
  { variantType: 'Length', label: 'Princess (45-50cm)', categories: ['Necklaces'] },
  { variantType: 'Length', label: 'Matinee (55-60cm)', categories: ['Necklaces'] },
  { variantType: 'Length', label: 'Opera (70-85cm)', categories: ['Necklaces'] },
  { variantType: 'Length', label: 'Rope (90cm+)', categories: ['Necklaces'] },

  // ============ FIT OPTIONS ============
  { variantType: 'Fit', label: 'Slim Fit', categories: ['Shirts', 'Pants', 'Jeans', 'Suits', 'Blazers', 'T-Shirts'] },
  { variantType: 'Fit', label: 'Regular Fit', categories: ['Shirts', 'Pants', 'Jeans', 'Suits', 'Blazers', 'T-Shirts', 'Tops'] },
  { variantType: 'Fit', label: 'Relaxed Fit', categories: ['Shirts', 'Pants', 'Jeans', 'T-Shirts', 'Tops', 'Dresses'] },
  { variantType: 'Fit', label: 'Oversized', categories: ['Shirts', 'T-Shirts', 'Sweaters', 'Coats', 'Jackets', 'Blazers'] },
  { variantType: 'Fit', label: 'Skinny', categories: ['Jeans', 'Pants'] },
  { variantType: 'Fit', label: 'Straight', categories: ['Jeans', 'Pants'] },
  { variantType: 'Fit', label: 'Wide Leg', categories: ['Jeans', 'Pants'] },
  { variantType: 'Fit', label: 'Bootcut', categories: ['Jeans', 'Pants'] },
  { variantType: 'Fit', label: 'Flare', categories: ['Jeans', 'Pants'] },
  { variantType: 'Fit', label: 'Tailored', categories: ['Shirts', 'Pants', 'Suits', 'Blazers', 'Dresses'] },
  { variantType: 'Fit', label: 'Bodycon', categories: ['Dresses', 'Skirts'] },
  { variantType: 'Fit', label: 'A-Line', categories: ['Dresses', 'Skirts'] },

  // ============ HEEL HEIGHT OPTIONS ============
  { variantType: 'Heel Height', label: 'Flat (0-2cm)', categories: ['Heels', 'Pumps', 'Sandals', 'Flats', 'Mules'] },
  { variantType: 'Heel Height', label: 'Low (2-5cm)', categories: ['Heels', 'Pumps', 'Sandals', 'Mules', 'Boots', 'Ankle Boots'] },
  { variantType: 'Heel Height', label: 'Mid (5-8cm)', categories: ['Heels', 'Pumps', 'Sandals', 'Mules', 'Boots', 'Ankle Boots'] },
  { variantType: 'Heel Height', label: 'High (8-10cm)', categories: ['Heels', 'Pumps', 'Sandals', 'Mules', 'Boots', 'Ankle Boots'] },
  { variantType: 'Heel Height', label: 'Very High (10cm+)', categories: ['Heels', 'Pumps', 'Sandals'] },
  { variantType: 'Heel Height', label: 'Platform', categories: ['Heels', 'Pumps', 'Sandals', 'Sneakers', 'Boots'] },
  { variantType: 'Heel Height', label: 'Wedge', categories: ['Heels', 'Sandals', 'Espadrilles', 'Boots'] },

  // ============ CONDITION OPTIONS ============
  { variantType: 'Condition', label: 'New with Tags', categories: [] },
  { variantType: 'Condition', label: 'New without Tags', categories: [] },
  { variantType: 'Condition', label: 'Excellent', categories: [] },
  { variantType: 'Condition', label: 'Very Good', categories: [] },
  { variantType: 'Condition', label: 'Good', categories: [] },
  { variantType: 'Condition', label: 'Fair', categories: [] },
]

export const seedVariantOptions = async (payload: Payload): Promise<void> => {
  // Note: Variant options are already cleared in seedVariantTypes due to FK constraint
  payload.logger.info('Seeding variant options...')

  // Get all variant types for mapping
  const variantTypesResult = await payload.find({
    collection: 'variantTypes',
    limit: 100,
  })
  const variantTypeMap = new Map(variantTypesResult.docs.map((vt) => [vt.name, vt.id]))

  // Get all categories for mapping
  const categoriesResult = await payload.find({
    collection: 'categories',
    limit: 500,
  })
  const categoryMap = new Map(categoriesResult.docs.map((c) => [c.title, c.id]))
  const allCategoryIds = categoriesResult.docs.map((c) => c.id)

  for (const option of variantOptionsData) {
    const variantTypeId = variantTypeMap.get(option.variantType)

    if (!variantTypeId) {
      payload.logger.warn(`Variant type not found: ${option.variantType}`)
      continue
    }

    // Get category IDs - if empty array, use ALL categories
    let categoryIds: number[]
    if (option.categories.length > 0) {
      categoryIds = option.categories
        .map((title) => categoryMap.get(title))
        .filter((id): id is number => id !== undefined)
    } else {
      // Empty array means applies to all categories
      categoryIds = allCategoryIds
    }

    if (categoryIds.length === 0) {
      payload.logger.warn(`No categories found for option: ${option.label}`)
      continue
    }

    // @ts-expect-error - Payload types issue with optional categories field
    await payload.create({
      collection: 'variantOptions',
      data: {
        variantType: variantTypeId,
        label: option.label,
        categories: categoryIds,
      },
    })
    payload.logger.info(`Created option: ${option.variantType} > ${option.label} (${categoryIds.length} categories)`)
  }

  payload.logger.info(`Variant options seeding complete! (${variantOptionsData.length} options)`)
}
