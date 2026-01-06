import type { CollectionAfterChangeHook } from 'payload'
import type { Skus, Variation, Style, User, Country, Currency } from '../../../payload-types'

/**
 * Hook to notify users when a SKU's price drops
 * Finds users who have favorited the variation and sends them a price drop notification
 */
export const notifyPriceDropHook: CollectionAfterChangeHook<Skus> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  // Only check on update operations
  if (operation !== 'update') {
    return doc
  }

  // Check if price actually dropped
  const previousPrice = previousDoc?.sellingPrice ?? previousDoc?.price
  const newPrice = doc.sellingPrice ?? doc.price

  if (!previousPrice || !newPrice || newPrice >= previousPrice) {
    return doc
  }

  // Calculate discount percentage
  const discountPercent = Math.round(((previousPrice - newPrice) / previousPrice) * 100)

  // Only notify if discount is at least 5%
  if (discountPercent < 5) {
    return doc
  }

  const variationId = typeof doc.variation === 'string' ? doc.variation : doc.variation?.id

  if (!variationId) {
    return doc
  }

  try {
    // Get variation details with style and seller for currency info
    const variation = (await req.payload.findByID({
      collection: 'variations',
      id: variationId,
      depth: 3, // variation -> style -> seller -> country -> currency
    })) as Variation

    if (!variation) {
      return doc
    }

    // Get currency from seller's country
    let currencySymbol = '₵' // Default to GHS
    let currencyCode = 'GHS'
    
    const style = variation.style as Style | undefined
    const seller = style?.seller as User | undefined
    const country = seller?.country as Country | undefined
    const currency = country?.currency as Currency | undefined
    
    if (currency) {
      currencySymbol = currency.symbol || '₵'
      currencyCode = currency.code || 'GHS'
    }

    // Find all users who favorited this variation
    const favorites = await req.payload.find({
      collection: 'favorites',
      where: {
        variation: { equals: variationId },
      },
      limit: 500, // Process in batches if needed
      depth: 0,
    })

    if (favorites.docs.length === 0) {
      return doc
    }

    // Get unique user IDs
    const userIds = favorites.docs
      .map((fav) => (typeof fav.user === 'string' ? fav.user : fav.user?.id))
      .filter((id): id is string => Boolean(id))

    if (userIds.length === 0) {
      return doc
    }

    // Get variation image URL if available
    let imageUrl: string | undefined
    const images = variation.images as Array<{ image?: { url?: string } | string }> | undefined
    if (images && images.length > 0) {
      const firstImage = images[0]?.image
      if (firstImage && typeof firstImage === 'object' && firstImage.url) {
        imageUrl = firstImage.url.startsWith('http')
          ? firstImage.url
          : `${process.env.NEXT_PUBLIC_SERVER_URL}${firstImage.url}`
      }
    }

    // Get variation title/name
    const variationTitle = variation.title || 'An item you favorited'

    // Format prices with currency
    const formattedPreviousPrice = formatPrice(previousPrice, currencyCode, currencySymbol)
    const formattedNewPrice = formatPrice(newPrice, currencyCode, currencySymbol)

    // Create notification for each user and send push notification
    const notificationPromises = userIds.map(async (userId) => {
      // Get image ID for notification
      let imageId: string | undefined
      if (images && images.length > 0) {
        const firstImage = images[0]?.image
        if (firstImage) {
          imageId = typeof firstImage === 'string' ? firstImage : (firstImage as { id?: string })?.id
        }
      }

      // Create in-app notification
      await req.payload.create({
        collection: 'notifications',
        data: {
          user: userId,
          type: 'price_drop',
          message: `${variationTitle} dropped ${discountPercent}% from ${formattedPreviousPrice} to ${formattedNewPrice}!`,
          path: `/product/${variation.slug || variationId}`,
          image: imageId,
          metadata: {
            variationId,
            skuId: doc.id,
            previousPrice,
            newPrice,
            discountPercent,
            currency: currencyCode,
          },
        },
      })
    })

    await Promise.all(notificationPromises)

    req.payload.logger.info(
      `📉 Price drop: Notified ${userIds.length} users about ${variationTitle} (${discountPercent}% off)`,
    )
  } catch (error) {
    req.payload.logger.error(`Error sending price drop notifications: ${error}`)
  }

  return doc
}

/**
 * Format price for notification message
 */
function formatPrice(price: number, currencyCode: string, currencySymbol: string): string {
  // Use Intl.NumberFormat for proper formatting
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price)
  } catch {
    // Fallback if currency code is not recognized
    return `${currencySymbol}${price.toFixed(2)}`
  }
}
