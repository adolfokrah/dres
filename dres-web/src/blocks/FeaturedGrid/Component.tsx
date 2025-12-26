import React from 'react'
import { cn } from '@/utilities/ui'
import type { FeaturedGridBlock as FeaturedGridBlockType, Media } from '@/payload-types'
import Link from 'next/link'
import Image from 'next/image'

type Props = FeaturedGridBlockType & {
  className?: string
}

export const FeaturedGridBlock: React.FC<Props> = ({
  title,
  items,
  columns = '3',
  aspectRatio = 'square',
  className,
}) => {
  const columnClasses: Record<string, string> = {
    '2': 'grid-cols-2',
    '3': 'grid-cols-2 md:grid-cols-3',
    '4': 'grid-cols-2 md:grid-cols-4',
  }

  const aspectClasses: Record<string, string> = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  }

  return (
    <div className={cn('w-full py-8 px-4', className)}>
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        {title && (
          <h2 className="text-2xl md:text-3xl font-medium mb-6">
            {title}
          </h2>
        )}

        {/* Grid */}
        <div className={cn('grid gap-4', columnClasses[columns ?? '3'])}>
          {items?.map((item, index) => {
            const media = item.image as Media
            const imageUrl = media?.url

            const content = (
              <div key={index} className="group cursor-pointer">
                {/* Image Container */}
                <div className={cn(
                  'relative w-full overflow-hidden bg-gray-100',
                  aspectClasses[aspectRatio ?? 'square']
                )}>
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={item.label || ''}
                      fill
                      className="object-cover object-center transition-transform duration-300 group-hover:scale-105"
                    />
                  )}
                </div>

                {/* Label */}
                <p className="mt-3 text-center text-sm font-semibold uppercase tracking-wide">
                  {item.label}
                </p>
              </div>
            )

            if (item.link) {
              return (
                <Link href={item.link} key={index}>
                  {content}
                </Link>
              )
            }

            return content
          })}
        </div>
      </div>
    </div>
  )
}
