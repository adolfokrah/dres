import React from 'react'
import { cn } from '@/utilities/ui'
import type { PromoBannerBlock as PromoBannerBlockType } from '@/payload-types'
import { CMSLink } from '@/components/Link'
import { ArrowRight } from '@phosphor-icons/react/dist/ssr'

type Props = PromoBannerBlockType & {
  className?: string
}

export const PromoBannerBlock: React.FC<Props> = ({
  title,
  description,
  actionLink,
  backgroundColor,
  className,
}) => {
  const bgColors: Record<string, string> = {
    light: 'bg-[#F7F7F7]',
    white: 'bg-white',
    info: 'bg-[#9DE5F4]',
    success: 'bg-[#ACF8BF]',
    warning: 'bg-[#F4D39D]',
    error: 'bg-[#F8ACAC]',
  }

  const bgColor = backgroundColor ?? 'light'

  return (
    <div className={cn('w-full py-6', className)}>
      <div className="container mx-auto px-4">
        <div className={cn('py-8 px-8', bgColors[bgColor])}>
          {/* Title - Serif font */}
          <h2 className="text-3xl md:text-4xl font-normal font-serif text-[#1A1A1A] mb-2">
            {title}
          </h2>

          {/* Description */}
          <p className="text-base md:text-lg text-[#1A1A1A] mb-4 font-sans">
            {description}
          </p>

          {/* Action Link */}
          {actionLink && (
            <CMSLink
              {...actionLink}
              label={null}
              className="inline-flex items-center gap-2 font-semibold text-base text-[#1A1A1A] group underline hover:underline"
            >
              {actionLink.label}
              <ArrowRight size={20} weight="bold" className="transition-transform group-hover:translate-x-1" />
            </CMSLink>
          )}
        </div>
      </div>
    </div>
  )
}
