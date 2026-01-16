'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'

import type { Header as HeaderType } from '@/payload-types'

import { CMSLink } from '@/components/Link'

type NavItem = NonNullable<HeaderType['navItems']>[number]

export const HeaderNav: React.FC<{ data: HeaderType }> = ({ data }) => {
  const navItems = data?.navItems || []
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const navRef = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])

  const hasSubItems = (item: NavItem) => {
    return item.subItems && Array.isArray(item.subItems) && item.subItems.length > 0
  }

  // No nav items configured in CMS
  if (navItems.length === 0) {
    return null
  }

  // Calculate underline position based on hovered item
  const getUnderlineStyle = () => {
    if (hoveredIndex === null || !itemRefs.current[hoveredIndex]) return { width: 0, x: 0 }
    const item = itemRefs.current[hoveredIndex]
    const nav = navRef.current
    if (!item || !nav) return { width: 0, x: 0 }
    
    const itemRect = item.getBoundingClientRect()
    const navRect = nav.getBoundingClientRect()
    
    return {
      width: itemRect.width,
      x: itemRect.left - navRect.left,
    }
  }

  const underlineStyle = getUnderlineStyle()

  return (
    <nav 
      className="border-t border-gray-50 bg-white relative"
      onMouseLeave={() => {
        setActiveDropdown(null)
        setHoveredIndex(null)
      }}
    >
      <div className="container mx-auto px-4">
        <ul 
          ref={navRef}
          className="flex items-center justify-between relative"
        >
          {/* Animated underline */}
          <motion.div
            className="absolute bottom-0 h-px bg-black pointer-events-none"
            initial={false}
            animate={{
              width: hoveredIndex !== null ? underlineStyle.width : 0,
              x: underlineStyle.x,
              opacity: hoveredIndex !== null ? 1 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 500,
              damping: 30,
            }}
          />

          {navItems.map((item, i) => {
            const isHighlighted = item.highlighted || false
            const label = item.label || ''

            return (
              <li
                key={i}
                ref={(el) => { itemRefs.current[i] = el }}
                className="relative"
                onMouseEnter={() => {
                  setActiveDropdown(i)
                  setHoveredIndex(i)
                }}
              >
                {/* Main nav link (Level 1: Menu) */}
                {item.link ? (
                  <CMSLink
                    {...item.link}
                    label={label}
                    appearance="link"
                    className={`
                      inline-block px-3 py-3.5 text-[15px] font-normal whitespace-nowrap
                      transition-colors no-underline
                      ${isHighlighted ? 'text-red-600 hover:text-red-700 font-medium' : 'text-[#3D3D3D] hover:text-black'}
                    `}
                  />
                ) : (
                  <span
                    className={`
                      inline-block px-3 py-3.5 text-[15px] font-normal whitespace-nowrap cursor-pointer
                      transition-colors
                      ${isHighlighted ? 'text-red-600 font-medium' : 'text-[#1E1E1E] hover:text-black'}
                    `}
                  >
                    {label}
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      {/* Mega menu dropdown - positioned below the entire nav */}
      {navItems.map((item, i) => {
        const itemHasSubItems = hasSubItems(item)
        if (!itemHasSubItems || activeDropdown !== i) return null
        
        return (
          <div
            key={`dropdown-${i}`}
            className="absolute left-0 right-0 bg-white border-t border-b border-gray-200 z-[100]"
            style={{ top: '100%' }}
            onMouseEnter={() => {
              setActiveDropdown(i)
              setHoveredIndex(i)
            }}
          >
            <div className="container mx-auto px-4 py-8">
              <div className="grid grid-cols-4 gap-12">
                {/* Level 2: Sub Menus (columns) */}
                {item.subItems?.map((subItem, subIndex) => (
                  <div key={subIndex}>
                    {/* Sub Menu header */}
                    <div className="text-xs font-medium text-[#9B9B9B] uppercase tracking-wider mb-5">
                      {subItem.label}
                    </div>

                    {/* Level 3: Sub Sub Menus (list items) */}
                    <ul className="space-y-2">
                      {subItem.subItems?.map((nestedItem, nestedIndex) => (
                        <li key={nestedIndex}>
                          {nestedItem.link ? (
                            <CMSLink
                              {...nestedItem.link}
                              label={nestedItem.label}
                              appearance="link"
                              className="block text-[15px] text-[#1A1A1A] hover:text-black transition-colors no-underline"
                            />
                          ) : (
                            <span className="block text-[15px] text-[#1A1A1A]">
                              {nestedItem.label}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </nav>
  )
}
