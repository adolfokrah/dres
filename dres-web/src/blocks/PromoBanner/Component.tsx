import React from 'react'
import { cn } from '@/utilities/ui'
import type { PromoBannerBlock as PromoBannerBlockType } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { ArrowRight } from 'lucide-react'

type Props = PromoBannerBlockType & {
  className?: string
}

export const PromoBannerBlock: React.FC<Props> = ({
  title,
  description,
  actionText,
  actionLink,
  backgroundColor,
  className,
}) => {
  const bgColors: Record<string, string> = {
    light: 'bg-gray-100',
    white: 'bg-white',
    dark: 'bg-gray-900 text-white',
  }

  const bgColor = backgroundColor ?? 'light'
  const textColor = bgColor === 'dark' ? 'text-white' : 'text-black'

  return (
    <div className={cn('w-full py-6 px-6', bgColors[bgColor], className)}>
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <h2 className={cn('text-2xl md:text-3xl font-medium mb-2', textColor)}>
          {title}
        </h2>

        {/* Description */}
        <p className={cn('text-sm md:text-base mb-3', textColor, 'opacity-90')}>
          {description}
        </p>

        {/* Action Link */}
        {actionLink && (
          <CMSLink
            {...actionLink}
            className={cn(
              'inline-flex items-center gap-2 font-bold text-sm md:text-base group',
              textColor
            )}
          >
            {actionText}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </CMSLink>
        )}
      </div>
    </div>
  )
}
