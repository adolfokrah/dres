'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Heart } from '@phosphor-icons/react'

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
  featured?: boolean
  isFirst?: boolean
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
  featured = false,
  isFirst = false,
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
      className={`group block bg-white no-underline border-t border-r border-b border-black ${isFirst ? 'border-l' : ''}`}
    >
      {/* Image Container */}
      <div className="relative aspect-square bg-white overflow-hidden p-4">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No Image
          </div>
        )}
      </div>

      {/* Content Container */}
      <div className="p-4 min-h-[200px]">
        {/* Tag & Favorite Row */}
        <div className="flex items-center justify-between mb-2 h-[28px]">
          {/* We Love Tag */}
          {featured ? (
            <div className="bg-black text-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wide">
              WE LOVE
            </div>
          ) : (
            <div />
          )}
          
          {/* Favorite Button */}
          <button
            onClick={handleFavoriteClick}
            className="p-1 hover:bg-gray-100 transition-colors"
            aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              size={20}
              weight={favorited ? 'fill' : 'regular'}
              className={favorited ? 'text-black' : 'text-gray-400'}
            />
          </button>
        </div>

        {/* Brand */}
        <h3 className="text-sm font-bold uppercase mb-1 text-black font-sans h-[20px]">
          {brand || '\u00A0'}
        </h3>

        {/* Title */}
        <h4 className="text-sm font-normal line-clamp-1 mb-1 text-black font-sans truncate">
          {title}
        </h4>

        {/* Category */}
        <p className="text-xs text-gray-600 mb-2 font-sans h-[16px]">
          {category || '\u00A0'}
        </p>

        {/* Price */}
        <div className="mt-2 h-[48px]">
          <p className="text-base font-bold text-black font-sans">
            {currency?.symbol || currency?.code || 'GHS'} {(price ?? 0).toFixed(2)}
          </p>
          {compareAtPrice && price && compareAtPrice > price ? (
            <p className="text-sm text-red-500 line-through font-normal font-sans">
              {currency?.symbol || currency?.code || 'GHS'} {compareAtPrice.toFixed(2)}
            </p>
          ) : (
            <div className="h-[20px]" />
          )}
        </div>
      </div>
    </Link>
  )
}
