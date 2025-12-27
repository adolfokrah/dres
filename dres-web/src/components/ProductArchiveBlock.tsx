'use client'

import Link from 'next/link'
import { ProductCard } from './ProductCard'

interface Product {
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
}

interface ProductArchiveBlockProps {
  title?: string
  queryType?: 'trending' | 'new-arrivals' | 'recently-viewed' | 'featured'
  seeAllLink?: string
  seeAllText?: string
  products: Product[]
  onFavoriteToggle?: (id: string, isFavorited: boolean) => void
  favoritedProducts?: Set<string>
  className?: string
}

export function ProductArchiveBlock({
  title = 'Products',
  queryType = 'trending',
  seeAllLink = '/shop',
  seeAllText = 'See all',
  products,
  onFavoriteToggle,
  favoritedProducts = new Set(),
  className = '',
}: ProductArchiveBlockProps) {
  return (
    <section className={`py-8 md:py-12 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif">
              {title}
            </h2>
            {seeAllLink && (
              <Link
                href={seeAllLink}
                className="text-sm md:text-base border border-black px-6 py-2 hover:bg-black hover:text-white transition-colors duration-200"
              >
                {seeAllText}
              </Link>
            )}
          </div>
        </div>

        {/* Products Grid */}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                {...product}
                onFavoriteToggle={onFavoriteToggle}
                isFavorited={favoritedProducts.has(product.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No products found
          </div>
        )}
      </div>
    </section>
  )
}
