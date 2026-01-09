import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getServerSideURL } from '@/utilities/getURL'
import { OpenInApp } from './OpenInApp'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

// Fetch product by slug from the API
const queryProductBySlug = cache(async ({ slug }: { slug: string }) => {
  const serverUrl = getServerSideURL()
  
  try {
    const response = await fetch(`${serverUrl}/api/variations/${slug}/details`, {
      next: { revalidate: 60 }, // Revalidate every 60 seconds
    })
    
    if (!response.ok) {
      return null
    }
    
    const data = await response.json()
    // API returns { variation: {...}, relatedVariations: [...], seller: {...} }
    return data.variation || null
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return null
  }
})

export default async function ProductPage({ params: paramsPromise }: Args) {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const product = await queryProductBySlug({ slug: decodedSlug })

  if (!product) {
    notFound()
  }

  const thumbnailUrl = product.thumbnail || product.images?.[0]?.url
  const price = product.skus?.[0]?.price || 0
  const currencySymbol = product.currencySymbol || 'GHS'

  return (
    <main className="min-h-screen bg-white">
      {/* Try to open in app on mobile */}
      <OpenInApp slug={decodedSlug} />
      
      {/* Simple product display for sharing */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-2xl font-bold tracking-tight">DRES</h1>
          </Link>
        </div>

        {/* Product Card */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          {/* Product Image */}
          {thumbnailUrl && (
            <div className="relative aspect-[3/4] bg-gray-100">
              <Image
                src={thumbnailUrl}
                alt={product.title || 'Product'}
                fill
                className="object-contain"
                priority
              />
            </div>
          )}

          {/* Product Info */}
          <div className="p-6">
            {/* Brand */}
            <p className="text-lg font-bold uppercase tracking-wide mb-1">
              {product.brand}
            </p>

            {/* Title */}
            <h2 className="text-xl text-gray-800 mb-2">
              {product.title}
            </h2>

            {/* Category */}
            {product.category && (
              <p className="text-gray-500 mb-4">
                {product.category}
              </p>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-6">
              <span className="text-2xl font-bold">
                {currencySymbol} {price.toFixed(2)}
              </span>
              {product.skus?.[0]?.compareAtPrice && (
                <span className="text-gray-400 line-through">
                  {currencySymbol} {product.skus[0].compareAtPrice.toFixed(2)}
                </span>
              )}
            </div>

            {/* CTA Button - Deep link to app */}
            <a
              href={`dres://products/${decodedSlug}`}
              className="block w-full bg-black text-white text-center py-4 font-semibold hover:bg-gray-800 transition-colors"
            >
              Open in DRES App
            </a>

            <p className="text-center text-gray-500 text-sm mt-4">
              Download the DRES app to shop this item
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = '' } = await paramsPromise
  const decodedSlug = decodeURIComponent(slug)
  const product = await queryProductBySlug({ slug: decodedSlug })

  if (!product) {
    return {
      title: 'Product Not Found | DRES',
    }
  }

  const serverUrl = getServerSideURL()
  const thumbnailUrl = product.thumbnail || product.images?.[0]?.url
  const ogImage = thumbnailUrl?.startsWith('http') 
    ? thumbnailUrl 
    : `${serverUrl}${thumbnailUrl}`
  
  const title = `${product.brand} - ${product.title} | DRES`
  const description = product.category 
    ? `Shop ${product.brand} ${product.title} in ${product.category} on DRES. ${product.description || ''}`
    : `Shop ${product.brand} ${product.title} on DRES. ${product.description || ''}`
  const price = product.skus?.[0]?.price || 0
  const currencyCode = product.currencyCode || 'GHS'

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${serverUrl}/products/${slug}`,
      siteName: 'DRES',
      images: ogImage ? [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: `${product.brand} ${product.title}`,
        },
      ] : undefined,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
    other: {
      'product:price:amount': price.toString(),
      'product:price:currency': currencyCode,
      'product:brand': product.brand || '',
      'product:category': product.category || '',
    },
  }
}
