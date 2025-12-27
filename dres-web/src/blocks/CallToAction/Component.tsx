import React from 'react'

import type { CallToActionBlock as CTABlockProps } from '@/payload-types'

import { Media } from '@/components/Media'

export const CallToActionBlock: React.FC<CTABlockProps> = ({ 
  image,
  title,
  buttonText,
  buttonLink,
}) => {
  return (
    <div className="container my-16">
      <div className="flex flex-col md:flex-row h-auto md:h-[172px] overflow-hidden">
        {/* Left: Image */}
        {image && typeof image === 'object' && (
          <div className="w-full md:w-[128px] h-[200px] md:h-full flex-shrink-0">
            <Media
              resource={image}
              className="object-cover w-full h-full"
              imgClassName="object-cover w-full h-full"
            />
          </div>
        )}
        
        {/* Right: Content with Black Background */}
        <div className="flex flex-col items-start justify-start gap-3.5 p-8 md:px-[18px] md:py-8 bg-black flex-1">
          {title && (
            <h2 className="text-2xl md:text-[24px] leading-[33px] font-normal text-white w-full">
              {title}
            </h2>
          )}
          
          {buttonText && buttonLink && (
            <a
              href={buttonLink}
              className="inline-flex items-center gap-0 text-white text-base font-bold hover:gap-2 transition-all"
            >
              {buttonText}
              <svg
                width="23"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="ml-2"
              >
                <path
                  d="M5 12H19M19 12L12 5M19 12L12 19"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
