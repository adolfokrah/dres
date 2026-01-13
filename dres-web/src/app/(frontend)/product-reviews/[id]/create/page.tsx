import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { ReviewForm } from './ReviewForm'

type Args = {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    variationId?: string
  }>
}

// Fetch style by ID with seller info
const queryStyleById = cache(async ({ id }: { id: string }) => {
  const payload = await getPayload({ config: configPromise })

  try {
    const style = await payload.findByID({
      collection: 'styles',
      id,
      depth: 2, // Increased depth to get seller photo
    })
    return style
  } catch (error) {
    console.error('Failed to fetch style:', error)
    return null
  }
})

// Fetch variation by ID
const queryVariationById = cache(async ({ id }: { id: string }) => {
  const payload = await getPayload({ config: configPromise })

  try {
    const variation = await payload.findByID({
      collection: 'variations',
      id,
      depth: 1,
    })
    return variation
  } catch (error) {
    console.error('Failed to fetch variation:', error)
    return null
  }
})

export default async function CreateReviewPage({
  params: paramsPromise,
  searchParams: searchParamsPromise,
}: Args) {
  const { id } = await paramsPromise
  const { variationId } = await searchParamsPromise
  const style = await queryStyleById({ id })

  if (!style) {
    notFound()
  }

  // Fetch specific variation if variationId is provided
  let variation: any = null
  if (variationId) {
    variation = await queryVariationById({ id: variationId })
  }

  // Get the first image from the variation's images array
  let thumbnailUrl: string | null = null
  if (variation?.images?.length > 0) {
    const firstImage = variation.images[0]
    thumbnailUrl = typeof firstImage === 'object' ? firstImage?.url : firstImage
  }

  // Fallback to first variation from style if no specific variation
  if (!thumbnailUrl) {
    const variations = style.variations as any[] | undefined
    const firstVariation = variations?.[0]
    if (firstVariation?.images?.length > 0) {
      const firstImage = firstVariation.images[0]
      thumbnailUrl = typeof firstImage === 'object' ? firstImage?.url : firstImage
    }
  }

  // Get brand name
  const brand = typeof style.brand === 'object' ? style.brand?.name : style.brand

  // Get seller info
  const seller = typeof style.seller === 'object' ? style.seller : null
  const sellerPhoto =
    seller && typeof seller.photo === 'object' ? seller.photo?.url : null
  const sellerName = seller?.shopName || seller?.firstName || 'Seller'

  return (
    <main className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold tracking-tight">DRES</h1>
          </Link>
        </div>

        {/* Page Title */}
        <h2 className="text-xl font-semibold text-center mb-8">Write a Review</h2>

        {/* Product Preview */}
        <div className="flex items-start gap-4 p-4 border border-gray-200 mb-8">
          {thumbnailUrl && (
            <div className="relative w-20 h-24 bg-gray-100 flex-shrink-0">
              <Image
                src={thumbnailUrl}
                alt={style.title || 'Product'}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            {brand && (
              <p className="text-sm font-bold uppercase tracking-wide text-gray-900">{brand}</p>
            )}
            <p className="text-gray-600 truncate">{style.title}</p>
            {variation?.color && (
              <p className="text-sm text-gray-500 mt-1">Color: {variation.color}</p>
            )}
          </div>
        </div>

        {/* Seller Info */}
        {seller && (
          <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 mb-8">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {sellerPhoto ? (
                <Image
                  src={sellerPhoto}
                  alt={sellerName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Sold by</p>
              <p className="font-medium text-gray-900">{sellerName}</p>
            </div>
          </div>
        )}

        {/* Review Form */}
        <ReviewForm styleId={id} styleName={style.title || 'Product'} />
      </div>
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { id } = await paramsPromise
  const style = await queryStyleById({ id })

  if (!style) {
    return {
      title: 'Product Not Found | DRES',
    }
  }

  const brand = typeof style.brand === 'object' ? style.brand?.name : style.brand
  const title = `Review ${brand ? `${brand} - ` : ''}${style.title} | DRES`

  return {
    title,
    description: `Leave a review for ${style.title} on DRES`,
  }
}
