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
  actionLink,
  backgroundColor,
  className,
}) => {
  const bgColors: Record<string, string> = {
    light: 'bg-gray-100',
    white: 'bg-white',
    info: 'bg-[#9DE5F4]',
    success: 'bg-[#ACF8BF]',
    warning: 'bg-[#F4D39D]',
    error: 'bg-[#F8ACAC]',
  }

  const bgColor = backgroundColor ?? 'light'

  return (
    <div className={cn('w-full py-6 px-6', bgColors[bgColor], className)}>
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-medium mb-2 text-black">
          {title}
        </h2>

        {/* Description */}
        <p className="text-sm md:text-base mb-3 text-black opacity-90">
          {description}
        </p>

        {/* Action Link */}
        {actionLink && (
          <CMSLink
            {...actionLink}
            className="inline-flex items-center gap-2 font-bold text-sm md:text-base group text-black"
          >
            {actionLink.label}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </CMSLink>
        )}
      </div>
    </div>
  )
}
