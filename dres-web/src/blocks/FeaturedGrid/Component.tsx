'use client'

import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/utilities/ui'
import type { FeaturedGridBlock as FeaturedGridBlockType, Media } from '@/payload-types'
import Link from 'next/link'
import Image from 'next/image'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'

type Props = FeaturedGridBlockType & {
  className?: string
}

export const FeaturedGridBlock: React.FC<Props> = ({
  title,
  items,
  className,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const aspectClasses: Record<string, string> = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  }

  const checkScrollButtons = () => {
    const container = scrollContainerRef.current
    if (!container) return

    setCanScrollLeft(container.scrollLeft > 0)
    setCanScrollRight(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 10
    )
  }

  useEffect(() => {
    checkScrollButtons()
    const timer = setTimeout(checkScrollButtons, 100)
    
    // Add resize listener
    const handleResize = () => checkScrollButtons()
    window.addEventListener('resize', handleResize)
    
    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [items])

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current
    if (!container) return

    const scrollAmount = 400
    const targetScroll =
      direction === 'left'
        ? container.scrollLeft - scrollAmount
        : container.scrollLeft + scrollAmount

    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth',
    })

    setTimeout(checkScrollButtons, 300)
  }

  return (
    <div className={cn('w-full py-8', className)}>
      <div className="container mx-auto px-4">
        {/* Title */}
        {title && (
          <h2 className="text-3xl md:text-4xl font-normal mb-6 text-left">
            {title}
          </h2>
        )}

        {/* Horizontal Scrollable Grid */}
        <div className="relative -mx-4">
          {/* Scroll Buttons */}
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 p-2 hover:bg-gray-50 transition-colors shadow-sm"
              aria-label="Scroll left"
            >
              <CaretLeft size={20} weight="bold" />
            </button>
          )}

          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white border border-gray-200 p-2 hover:bg-gray-50 transition-colors shadow-sm"
              aria-label="Scroll right"
            >
              <CaretRight size={20} weight="bold" />
            </button>
          )}

          <div
            ref={scrollContainerRef}
            onScroll={checkScrollButtons}
            className="overflow-x-auto scrollbar-hide px-4"
          >
            <div className="flex gap-4 pb-2">
              {items?.map((item, index) => {
                const media = item.image as Media
                const imageUrl = media?.url

                const content = (
                  <div key={index} className="group cursor-pointer flex-shrink-0 w-[260px] h-[300px]">
                    {/* Image Container with secondary background */}
                    <div className="relative w-full overflow-hidden bg-secondary mb-4 aspect-square">
                      {imageUrl && (
                        <Image
                          src={imageUrl}
                          alt={item.label || ''}
                          fill
                          className="object-contain object-center transition-transform duration-300 group-hover:scale-105 p-4"
                        />
                      )}
                    </div>

                    {/* Label */}
                    <p className="text-center text-xs font-normal uppercase tracking-wider text-gray-900">
                      {item.label}
                    </p>
                  </div>
                )

                if (item.link) {
                  return (
                    <Link href={item.link} key={index} className="no-underline">
                      {content}
                    </Link>
                  )
                }

                return content
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
