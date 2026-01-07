'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Heart } from 'lucide-react'

interface ProductCardProps {
  id: string
  thumbnail: string | null
  brand: string | null
  category: string | null
  title: string
  price: number
  compareAtPrice?: number
  currency: {
    code: string
    symbol: string
  } | null
  slug: string
  onFavoriteToggle?: (id: string, isFavorited: boolean) => void
  isFavorited?: boolean
}

export function ProductCard({
  id,
  thumbnail,
  brand,
  category,
  title,
  price,
  compareAtPrice,
  currency,
  slug,
  onFavoriteToggle,
  isFavorited = false,
}: ProductCardProps) {
  const [favorited, setFavorited] = useState(isFavorited)

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newFavorited = !favorited
    setFavorited(newFavorited)
    onFavoriteToggle?.(id, newFavorited)
  }

  return (
    <Link
      href={`/products/${slug}`}
      className="group block bg-white border border-gray-200 hover:shadow-lg transition-shadow duration-200"
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4 md:p-6 relative">
        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className="absolute top-4 right-4 md:top-6 md:right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-6 h-6 transition-colors ${
              favorited ? 'fill-red-500 stroke-red-500' : 'stroke-black fill-none'
            }`}
          />
        </button>

        {/* Brand */}
        {brand && (
          <h3 className="text-sm md:text-base font-semibold uppercase tracking-wide mb-2">
            {brand}
          </h3>
        )}

        {/* Title */}
        <h4 className="text-sm md:text-base font-normal line-clamp-2">
          {title}
        </h4>

        {/* Category */}
        {category && (
          <p className="text-sm text-gray-600 mb-1">
            {category}
          </p>
        )}

      

        {/* Price */}
        <div className="flex items-center gap-2">
          {compareAtPrice && price && compareAtPrice > price && (
            <p className="text-sm md:text-base text-gray-400 line-through">
              {currency?.symbol || currency?.code || 'GHS'} {compareAtPrice.toFixed(2)}
            </p>
          )}
          <p className={`text-lg md:text-xl font-semibold ${compareAtPrice && price && compareAtPrice > price ? 'text-red-600' : ''}`}>
            {currency?.symbol || currency?.code || 'GHS'} {(price ?? 0).toFixed(2)}
          </p>
        </div>
      </div>
    </Link>
  )
}
