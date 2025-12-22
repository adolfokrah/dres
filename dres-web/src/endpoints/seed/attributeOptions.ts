import type { Payload } from 'payload'

// Attribute options organized by attribute name
const attributeOptionsData: Record<string, { name: string; slug: string }[]> = {
  Size: [
    // Clothing sizes
    { name: 'XXS', slug: 'xxs' },
    { name: 'XS', slug: 'xs' },
    { name: 'S', slug: 's' },
    { name: 'M', slug: 'm' },
    { name: 'L', slug: 'l' },
    { name: 'XL', slug: 'xl' },
    { name: 'XXL', slug: 'xxl' },
    { name: '3XL', slug: '3xl' },
    // Numeric sizes
    { name: '36', slug: '36' },
    { name: '38', slug: '38' },
    { name: '40', slug: '40' },
    { name: '42', slug: '42' },
    { name: '44', slug: '44' },
    { name: '46', slug: '46' },
    { name: '48', slug: '48' },
    // Pants sizes (Waist x Length)
    { name: 'W28 L30', slug: 'w28-l30' },
    { name: 'W28 L32', slug: 'w28-l32' },
    { name: 'W30 L30', slug: 'w30-l30' },
    { name: 'W30 L32', slug: 'w30-l32' },
    { name: 'W30 L34', slug: 'w30-l34' },
    { name: 'W32 L30', slug: 'w32-l30' },
    { name: 'W32 L32', slug: 'w32-l32' },
    { name: 'W32 L34', slug: 'w32-l34' },
    { name: 'W34 L30', slug: 'w34-l30' },
    { name: 'W34 L32', slug: 'w34-l32' },
    { name: 'W34 L34', slug: 'w34-l34' },
    { name: 'W36 L30', slug: 'w36-l30' },
    { name: 'W36 L32', slug: 'w36-l32' },
    { name: 'W36 L34', slug: 'w36-l34' },
    { name: 'W38 L30', slug: 'w38-l30' },
    { name: 'W38 L32', slug: 'w38-l32' },
    { name: 'W38 L34', slug: 'w38-l34' },
    { name: 'W40 L30', slug: 'w40-l30' },
    { name: 'W40 L32', slug: 'w40-l32' },
    { name: 'W40 L34', slug: 'w40-l34' },
    // US Shoe sizes
    { name: 'US 5', slug: 'us-5' },
    { name: 'US 5.5', slug: 'us-5-5' },
    { name: 'US 6', slug: 'us-6' },
    { name: 'US 6.5', slug: 'us-6-5' },
    { name: 'US 7', slug: 'us-7' },
    { name: 'US 7.5', slug: 'us-7-5' },
    { name: 'US 8', slug: 'us-8' },
    { name: 'US 8.5', slug: 'us-8-5' },
    { name: 'US 9', slug: 'us-9' },
    { name: 'US 9.5', slug: 'us-9-5' },
    { name: 'US 10', slug: 'us-10' },
    { name: 'US 10.5', slug: 'us-10-5' },
    { name: 'US 11', slug: 'us-11' },
    { name: 'US 12', slug: 'us-12' },
    { name: 'US 13', slug: 'us-13' },
    // Ring sizes
    { name: 'Ring 5', slug: 'ring-5' },
    { name: 'Ring 6', slug: 'ring-6' },
    { name: 'Ring 7', slug: 'ring-7' },
    { name: 'Ring 8', slug: 'ring-8' },
    { name: 'Ring 9', slug: 'ring-9' },
    { name: 'Ring 10', slug: 'ring-10' },
    // One size
    { name: 'One Size', slug: 'one-size' },
  ],
  Color: [
    { name: 'Black', slug: 'black' },
    { name: 'White', slug: 'white' },
    { name: 'Navy', slug: 'navy' },
    { name: 'Blue', slug: 'blue' },
    { name: 'Red', slug: 'red' },
    { name: 'Pink', slug: 'pink' },
    { name: 'Green', slug: 'green' },
    { name: 'Yellow', slug: 'yellow' },
    { name: 'Orange', slug: 'orange' },
    { name: 'Purple', slug: 'purple' },
    { name: 'Brown', slug: 'brown' },
    { name: 'Tan', slug: 'tan' },
    { name: 'Beige', slug: 'beige' },
    { name: 'Grey', slug: 'grey' },
    { name: 'Cream', slug: 'cream' },
    { name: 'Gold', slug: 'gold' },
    { name: 'Silver', slug: 'silver' },
    { name: 'Rose Gold', slug: 'rose-gold' },
    { name: 'Burgundy', slug: 'burgundy' },
    { name: 'Olive', slug: 'olive' },
    { name: 'Coral', slug: 'coral' },
    { name: 'Teal', slug: 'teal' },
    { name: 'Multicolor', slug: 'multicolor' },
  ],
  Material: [
    { name: 'Cotton', slug: 'cotton' },
    { name: 'Leather', slug: 'leather' },
    { name: 'Silk', slug: 'silk' },
    { name: 'Wool', slug: 'wool' },
    { name: 'Cashmere', slug: 'cashmere' },
    { name: 'Linen', slug: 'linen' },
    { name: 'Denim', slug: 'denim' },
    { name: 'Polyester', slug: 'polyester' },
    { name: 'Nylon', slug: 'nylon' },
    { name: 'Suede', slug: 'suede' },
    { name: 'Canvas', slug: 'canvas' },
    { name: 'Velvet', slug: 'velvet' },
    { name: 'Satin', slug: 'satin' },
    { name: 'Tweed', slug: 'tweed' },
    { name: 'Faux Leather', slug: 'faux-leather' },
    { name: 'Faux Fur', slug: 'faux-fur' },
    { name: 'Stainless Steel', slug: 'stainless-steel' },
    { name: 'Gold', slug: 'gold-material' },
    { name: 'Silver', slug: 'silver-material' },
    { name: 'Platinum', slug: 'platinum' },
    { name: 'Rose Gold', slug: 'rose-gold-material' },
  ],
  Fit: [
    { name: 'Slim Fit', slug: 'slim-fit' },
    { name: 'Regular Fit', slug: 'regular-fit' },
    { name: 'Relaxed Fit', slug: 'relaxed-fit' },
    { name: 'Oversized', slug: 'oversized' },
    { name: 'Skinny', slug: 'skinny' },
    { name: 'Straight', slug: 'straight' },
    { name: 'Bootcut', slug: 'bootcut' },
    { name: 'Wide Leg', slug: 'wide-leg' },
    { name: 'Cropped', slug: 'cropped' },
    { name: 'Tailored', slug: 'tailored' },
  ],
  Length: [
    { name: 'Mini', slug: 'mini' },
    { name: 'Short', slug: 'short' },
    { name: 'Knee Length', slug: 'knee-length' },
    { name: 'Midi', slug: 'midi' },
    { name: 'Maxi', slug: 'maxi' },
    { name: 'Floor Length', slug: 'floor-length' },
    { name: 'Cropped', slug: 'cropped-length' },
    { name: 'Regular', slug: 'regular-length' },
    { name: 'Long', slug: 'long' },
    // Necklace lengths
    { name: 'Choker (14-16")', slug: 'choker' },
    { name: 'Princess (17-19")', slug: 'princess' },
    { name: 'Matinee (20-24")', slug: 'matinee' },
    { name: 'Opera (28-36")', slug: 'opera' },
  ],
  Condition: [
    { name: 'New with Tags', slug: 'new-with-tags' },
    { name: 'New without Tags', slug: 'new-without-tags' },
    { name: 'Like New', slug: 'like-new' },
    { name: 'Excellent', slug: 'excellent' },
    { name: 'Very Good', slug: 'very-good' },
    { name: 'Good', slug: 'good' },
    { name: 'Fair', slug: 'fair' },
  ],
  'Heel Height': [
    { name: 'Flat (0-1")', slug: 'flat' },
    { name: 'Low (1-2")', slug: 'low' },
    { name: 'Mid (2-3")', slug: 'mid' },
    { name: 'High (3-4")', slug: 'high' },
    { name: 'Very High (4"+)', slug: 'very-high' },
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

      if (existing.docs.length === 0) {
        await payload.create({
          collection: 'attributeOptions',
          data: {
            name: option.name,
            slug: option.slug,
            attribute: attributeId,
          },
        })
        payload.logger.info(`Created option: ${attributeName} -> ${option.name}`)
      }
    }
  }

  payload.logger.info('Finished seeding attribute options')
}
