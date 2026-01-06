import type { CollectionAfterChangeHook } from 'payload'
import type { Skus, Variation, Style, User, Country, Currency } from '../../../payload-types'

/**
 * Hook to notify users when a SKU's price drops or goes on sale
 * Finds users who have favorited the variation and sends them a notification
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

  const variationId = typeof doc.variation === 'string' ? doc.variation : doc.variation?.id

  if (!variationId) {
    return doc
  }

  // Check if item is newly on sale (compareAtPrice added)
  const wasOnSale = previousDoc?.compareAtPrice && previousDoc.compareAtPrice > 0
  const isNowOnSale = doc.compareAtPrice && doc.compareAtPrice > 0
  const newlyOnSale = !wasOnSale && isNowOnSale

  // Check if price actually dropped
  const previousPrice = previousDoc?.sellingPrice ?? previousDoc?.price
  const newPrice = doc.sellingPrice ?? doc.price
  const priceDropped = previousPrice && newPrice && newPrice < previousPrice

  // Calculate discount percentages
  let priceDropPercent = 0
  let salePercent = 0

  if (priceDropped) {
    priceDropPercent = Math.round(((previousPrice - newPrice) / previousPrice) * 100)
  }

  if (newlyOnSale && doc.compareAtPrice && newPrice) {
    salePercent = Math.round(((doc.compareAtPrice - newPrice) / doc.compareAtPrice) * 100)
  }

  // Only notify if there's a significant price drop (5%+) or item went on sale
  const shouldNotifyPriceDrop = priceDropped && priceDropPercent >= 5
  const shouldNotifySale = newlyOnSale && salePercent >= 5

  if (!shouldNotifyPriceDrop && !shouldNotifySale) {
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

    // Get currency and country from seller
    let currencySymbol = '₵' // Default to GHS
    let currencyCode = 'GHS'

    const style = variation.style as Style | undefined
    const seller = style?.seller as User | undefined
    const sellerCountry = seller?.country as Country | undefined
    const sellerCountryId = sellerCountry?.id || (typeof seller?.country === 'string' ? seller.country : null)
    const currency = sellerCountry?.currency as Currency | undefined

    if (currency) {
      currencySymbol = currency.symbol || '₵'
      currencyCode = currency.code || 'GHS'
    }

    // If we can't determine seller's country, skip notification
    if (!sellerCountryId) {
      req.payload.logger.warn(`Cannot send price notification: seller country not found for variation ${variationId}`)
      return doc
    }

    // Find all users who favorited this variation AND are in the same country as the seller
    const favorites = await req.payload.find({
      collection: 'favorites',
      where: {
        variation: { equals: variationId },
      },
      limit: 500,
      depth: 1, // Need depth to get user's country
    })

    if (favorites.docs.length === 0) {
      return doc
    }

    // Filter to users in the same country as the seller
    const userIds = favorites.docs
      .filter((fav) => {
        const user = fav.user as User | string | undefined
        if (!user || typeof user === 'string') return false

        const userCountryId = typeof user.country === 'string'
          ? user.country
          : (user.country as Country | undefined)?.id

        return userCountryId === sellerCountryId
      })
      .map((fav) => (typeof fav.user === 'string' ? fav.user : (fav.user as User)?.id))
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
    const formattedNewPrice = formatPrice(newPrice, currencyCode, currencySymbol)
    const formattedComparePrice = doc.compareAtPrice
      ? formatPrice(doc.compareAtPrice, currencyCode, currencySymbol)
      : null

    // Get image ID for notification
    let imageId: string | undefined
    if (images && images.length > 0) {
      const firstImage = images[0]?.image
      if (firstImage) {
        imageId = typeof firstImage === 'string' ? firstImage : (firstImage as { id?: string })?.id
      }
    }

    // Determine notification type and message
    let notificationType: 'price_drop' | 'promotion'
    let notificationMessage: string
    let discountPercent: number
    let logEmoji: string

    if (shouldNotifySale) {
      // Item newly on sale - prioritize this notification
      notificationType = 'promotion'
      discountPercent = salePercent
      notificationMessage = `🏷️ ${variationTitle} is now on sale! ${discountPercent}% off - was ${formattedComparePrice}, now ${formattedNewPrice}`
      logEmoji = '🏷️ Sale'
    } else {
      // Price dropped
      notificationType = 'price_drop'
      discountPercent = priceDropPercent
      const formattedPreviousPrice = formatPrice(previousPrice!, currencyCode, currencySymbol)
      notificationMessage = `${variationTitle} dropped ${discountPercent}% from ${formattedPreviousPrice} to ${formattedNewPrice}!`
      logEmoji = '📉 Price drop'
    }

    // Create notification for each user
    const notificationPromises = userIds.map(async (userId) => {
      await req.payload.create({
        collection: 'notifications',
        data: {
          user: userId,
          type: notificationType,
          message: notificationMessage,
          path: `/product/${variation.slug || variationId}`,
          image: imageId,
          metadata: {
            variationId,
            skuId: doc.id,
            previousPrice: previousPrice || null,
            newPrice,
            compareAtPrice: doc.compareAtPrice || null,
            discountPercent,
            currency: currencyCode,
          },
        },
      })
    })

    await Promise.all(notificationPromises)

    req.payload.logger.info(
      `${logEmoji}: Notified ${userIds.length} users about ${variationTitle} (${discountPercent}% off)`,
    )
  } catch (error) {
    req.payload.logger.error(`Error sending price/promotion notifications: ${error}`)
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
