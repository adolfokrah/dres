import type { Payload } from 'payload'

const fashionBrands = [
  // Luxury Fashion Houses
  { name: 'Nike', description: 'American athletic footwear and apparel corporation' },
  { name: 'Adidas', description: 'German multinational sportswear manufacturer' },
  { name: 'Gucci', description: 'Italian luxury fashion house' },
  { name: 'Louis Vuitton', description: 'French luxury fashion house and company' },
  { name: 'Chanel', description: 'French luxury fashion house' },
  { name: 'Prada', description: 'Italian luxury fashion house' },
  { name: 'Hermès', description: 'French luxury goods manufacturer' },
  { name: 'Burberry', description: 'British luxury fashion house' },
  { name: 'Versace', description: 'Italian luxury fashion company' },
  { name: 'Dior', description: 'French luxury fashion house' },
  { name: 'Balenciaga', description: 'Spanish luxury fashion house' },
  { name: 'Fendi', description: 'Italian luxury fashion house' },
  { name: 'Givenchy', description: 'French luxury fashion and perfume house' },
  { name: 'Saint Laurent', description: 'French luxury fashion house' },
  { name: 'Valentino', description: 'Italian luxury fashion house' },
  { name: 'Bottega Veneta', description: 'Italian luxury fashion house' },
  { name: 'Loewe', description: 'Spanish luxury fashion house' },
  { name: 'Celine', description: 'French luxury fashion house' },
  { name: 'Alexander McQueen', description: 'British luxury fashion house' },
  { name: 'Off-White', description: 'Italian luxury fashion label' },
  
  // Fast Fashion & Retail
  { name: 'Zara', description: 'Spanish fast fashion retailer' },
  { name: 'H&M', description: 'Swedish multinational clothing company' },
  { name: 'Uniqlo', description: 'Japanese casual wear designer and retailer' },
  { name: 'Gap', description: 'American clothing and accessories retailer' },
  { name: "Levi's", description: 'American clothing company known for denim jeans' },
  { name: 'Forever 21', description: 'American fast fashion retailer' },
  { name: 'Primark', description: 'Irish fast fashion retailer' },
  { name: 'ASOS', description: 'British online fashion retailer' },
  { name: 'Shein', description: 'Chinese online fast fashion retailer' },
  { name: 'Boohoo', description: 'British online fashion retailer' },
  { name: 'Mango', description: 'Spanish clothing design and manufacturing company' },
  { name: 'Massimo Dutti', description: 'Spanish clothing manufacturer' },
  { name: 'Pull & Bear', description: 'Spanish clothing and accessories retailer' },
  { name: 'Bershka', description: 'Spanish clothing retailer' },
  { name: 'Stradivarius', description: 'Spanish fashion brand' },
  
  // Premium & Designer
  { name: 'Calvin Klein', description: 'American fashion house' },
  { name: 'Tommy Hilfiger', description: 'American premium clothing brand' },
  { name: 'Ralph Lauren', description: 'American fashion company' },
  { name: 'Hugo Boss', description: 'German luxury fashion house' },
  { name: 'Armani', description: 'Italian luxury fashion house' },
  { name: 'Dolce & Gabbana', description: 'Italian luxury fashion house' },
  { name: 'Michael Kors', description: 'American luxury fashion company' },
  { name: 'Coach', description: 'American luxury fashion company' },
  { name: 'Kate Spade', description: 'American luxury fashion design house' },
  { name: 'Tory Burch', description: 'American fashion label' },
  { name: 'Marc Jacobs', description: 'American fashion designer brand' },
  { name: 'Diane von Furstenberg', description: 'American fashion brand' },
  { name: 'Oscar de la Renta', description: 'Dominican-American fashion house' },
  { name: 'Carolina Herrera', description: 'Venezuelan fashion brand' },
  { name: 'Elie Saab', description: 'Lebanese fashion designer brand' },
  { name: 'Balmain', description: 'French luxury fashion house' },
  { name: 'Kenzo', description: 'French luxury fashion house' },
  { name: 'Moschino', description: 'Italian luxury fashion house' },
  { name: 'Vivienne Westwood', description: 'British fashion brand' },
  { name: 'Paul Smith', description: 'British fashion brand' },
  { name: 'Ted Baker', description: 'British luxury clothing brand' },
  { name: 'AllSaints', description: 'British fashion retailer' },
  { name: 'Reiss', description: 'British fashion brand' },
  { name: 'Sandro', description: 'French fashion brand' },
  { name: 'Maje', description: 'French fashion brand' },
  { name: 'Zadig & Voltaire', description: 'French fashion brand' },
  { name: 'Isabel Marant', description: 'French fashion designer brand' },
  
  // Sportswear & Athletic
  { name: 'Puma', description: 'German multinational sportswear company' },
  { name: 'Reebok', description: 'American fitness footwear and apparel company' },
  { name: 'New Balance', description: 'American sports footwear and apparel brand' },
  { name: 'Converse', description: 'American shoe company' },
  { name: 'Vans', description: 'American manufacturer of skateboarding shoes' },
  { name: 'Under Armour', description: 'American sports equipment company' },
  { name: 'ASICS', description: 'Japanese athletic equipment company' },
  { name: 'Fila', description: 'Italian-Korean sportswear company' },
  { name: 'Champion', description: 'American sportswear brand' },
  { name: 'Skechers', description: 'American footwear company' },
  { name: 'Jordan', description: 'American athletic footwear brand by Nike' },
  { name: 'Lululemon', description: 'Canadian athletic apparel retailer' },
  { name: 'Gymshark', description: 'British fitness apparel brand' },
  { name: 'Alo Yoga', description: 'American yoga-inspired clothing brand' },
  { name: 'Athleta', description: 'American athletic apparel brand' },
  { name: 'Outdoor Voices', description: 'American activewear brand' },
  
  // Outdoor & Lifestyle
  { name: 'The North Face', description: 'American outdoor recreation products company' },
  { name: 'Patagonia', description: 'American outdoor clothing company' },
  { name: 'Columbia', description: 'American outdoor apparel company' },
  { name: 'Moncler', description: 'Italian luxury fashion brand' },
  { name: 'Canada Goose', description: 'Canadian outdoor clothing company' },
  { name: 'Stone Island', description: 'Italian luxury menswear brand' },
  { name: 'Arc\'teryx', description: 'Canadian outdoor clothing company' },
  { name: 'Fjällräven', description: 'Swedish outdoor equipment company' },
  { name: 'Helly Hansen', description: 'Norwegian outdoor clothing brand' },
  { name: 'Timberland', description: 'American outdoor footwear and apparel brand' },
  { name: 'Carhartt', description: 'American apparel company known for workwear' },
  { name: 'Dickies', description: 'American workwear brand' },
  
  // Contemporary & Streetwear
  { name: 'Acne Studios', description: 'Swedish luxury fashion house' },
  { name: 'A.P.C.', description: 'French ready-to-wear brand' },
  { name: 'COS', description: 'European fashion brand offering modern wardrobe essentials' },
  { name: 'Supreme', description: 'American skateboarding and streetwear brand' },
  { name: 'Stüssy', description: 'American streetwear brand' },
  { name: 'A Bathing Ape', description: 'Japanese streetwear brand' },
  { name: 'Palace', description: 'British skateboarding and streetwear brand' },
  { name: 'Fear of God', description: 'American luxury streetwear brand' },
  { name: 'Vetements', description: 'Swiss fashion brand' },
  { name: 'Comme des Garçons', description: 'Japanese fashion label' },
  { name: 'Yohji Yamamoto', description: 'Japanese fashion designer brand' },
  { name: 'Issey Miyake', description: 'Japanese fashion designer brand' },
  { name: 'Maison Margiela', description: 'French fashion house' },
  { name: 'Rick Owens', description: 'American fashion designer brand' },
  { name: 'Thom Browne', description: 'American fashion designer brand' },
  { name: 'Rag & Bone', description: 'American fashion brand' },
  { name: 'Theory', description: 'American fashion brand' },
  { name: 'Vince', description: 'American fashion brand' },
  { name: 'Club Monaco', description: 'Canadian fashion brand' },
  { name: 'J.Crew', description: 'American clothing retailer' },
  { name: 'Banana Republic', description: 'American clothing and accessories retailer' },
  { name: 'Everlane', description: 'American clothing retailer focused on ethical fashion' },
  { name: 'Reformation', description: 'American sustainable fashion brand' },
  
  // Footwear Specialists
  { name: 'Jimmy Choo', description: 'British luxury fashion house specializing in shoes' },
  { name: 'Manolo Blahnik', description: 'Spanish footwear brand' },
  { name: 'Christian Louboutin', description: 'French luxury footwear brand' },
  { name: 'Stuart Weitzman', description: 'American footwear designer brand' },
  { name: 'Steve Madden', description: 'American footwear company' },
  { name: 'Sam Edelman', description: 'American footwear brand' },
  { name: 'Dr. Martens', description: 'British footwear and clothing brand' },
  { name: 'Clarks', description: 'British shoe manufacturer' },
  { name: 'Birkenstock', description: 'German footwear brand' },
  { name: 'UGG', description: 'American footwear company' },
  { name: 'Crocs', description: 'American footwear company' },
  { name: 'TOMS', description: 'American footwear and accessories company' },
  
  // Denim & Casual
  { name: 'Wrangler', description: 'American jeans brand' },
  { name: 'Lee', description: 'American denim brand' },
  { name: 'Diesel', description: 'Italian denim and casual wear brand' },
  { name: 'G-Star Raw', description: 'Dutch denim brand' },
  { name: 'True Religion', description: 'American denim brand' },
  { name: '7 For All Mankind', description: 'American denim brand' },
  { name: 'Citizens of Humanity', description: 'American denim brand' },
  { name: 'AG Jeans', description: 'American premium denim brand' },
  { name: 'Frame', description: 'American denim brand' },
  { name: 'Mother Denim', description: 'American denim brand' },
]

export const seedBrands = async (payload: Payload): Promise<void> => {
  payload.logger.info('Seeding brands...')

  for (const brand of fashionBrands) {
    const slug = brand.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    // Check if brand already exists
    const existing = await payload.find({
      collection: 'brands',
      where: {
        slug: {
          equals: slug,
        },
      },
    })

    if (existing.docs.length === 0) {
      await payload.create({
        collection: 'brands',
        data: {
          name: brand.name,
          slug,
        },
      })
      payload.logger.info(`Created brand: ${brand.name}`)
    } else {
      payload.logger.info(`Brand already exists: ${brand.name}`)
    }
  }

  payload.logger.info('Brands seeding complete!')
}
