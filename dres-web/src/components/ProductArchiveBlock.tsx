'use client'

import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { ProductCard } from './ProductCard'

interface Product {
  id: string
  thumbnail: string | null
  brand: string | null
  category: string | null
  title: string
  sellingPrice: number
  compareAtPrice?: number
  currency: {
    code: string
    symbol: string
  } | null
  slug: string
  showWeLoveBadge?: boolean
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
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }

  // Check scroll buttons on mount and when products change
  useEffect(() => {
    checkScrollButtons()
    // Also check after a slight delay to ensure layout is complete
    const timer = setTimeout(checkScrollButtons, 100)
    
    // Add resize listener
    const handleResize = () => checkScrollButtons()
    window.addEventListener('resize', handleResize)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [products])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 300
    const targetScroll =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    })

    // Update button states after scroll
    setTimeout(checkScrollButtons, 300)
  }

  return (
    <section className={`py-8 ${className}`}>
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-normal font-serif">
            {title}
          </h2>
          {seeAllLink && (
            <Link
              href={seeAllLink}
              className="text-sm md:text-base border border-black px-6 py-2 hover:bg-black hover:text-white transition-colors duration-200 no-underline"
            >
              {seeAllText}
            </Link>
          )}
        </div>

        {/* Products Horizontal Scroll */}
        {products && products.length > 0 ? (
          <div className="relative">
            {/* Scroll Buttons */}
            {canScrollLeft && (
              <button
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
                aria-label="Scroll left"
              >
                <CaretLeft size={24} weight="bold" />
              </button>
            )}

            {canScrollRight && (
              <button
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 p-2 hover:bg-gray-50 transition-colors"
                aria-label="Scroll right"
              >
                <CaretRight size={24} weight="bold" />
              </button>
            )}

            {/* Scrollable Container */}
            <div
              ref={scrollContainerRef}
              onScroll={checkScrollButtons}
              className="overflow-x-auto scrollbar-hide -mx-4 px-4"
            >
              <div className="flex">
                {products.map((product, index) => (
                  <div key={product.id} className="flex-shrink-0 w-[220px]">
                    <ProductCard
                      id={product.id}
                      thumbnail={product.thumbnail}
                      brand={product.brand}
                      category={product.category}
                      title={product.title}
                      price={product.sellingPrice}
                      compareAtPrice={product.compareAtPrice}
                      currency={product.currency}
                      slug={product.slug}
                      featured={product.showWeLoveBadge}
                      onFavoriteToggle={onFavoriteToggle}
                      isFavorited={favoritedProducts.has(product.id)}
                      isFirst={index === 0}
                    />
                  </div>
                ))}
              </div>
            </div>
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
