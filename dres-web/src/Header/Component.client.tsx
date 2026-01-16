'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { MagnifyingGlass, User, Heart, Bell, ShoppingBag, List, X, CaretDown } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'

import type { Header } from '@/payload-types'

import { HeaderNav } from './Nav'
import { CMSLink } from '@/components/Link'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const [theme, setTheme] = useState<string | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<number[]>([])
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
  }, [headerTheme])

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
    setExpandedItems([])
  }, [pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    )
  }

  const navItems = data?.navItems || []

  return (
    <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-50" {...(theme ? { 'data-theme': theme } : {})}>
      {/* Top Bar */}
      <div className="container">
        <div className="flex items-center justify-between h-[60px] md:h-[72px] gap-4 md:gap-12">
          {/* Left: Hamburger (mobile) / Search Bar (desktop) */}
          <div className="flex items-center gap-3 flex-1 md:max-w-md">
            {/* Hamburger Menu - Mobile Only */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 -ml-2 md:hidden"
              aria-label="Open menu"
            >
              <List size={24} weight="bold" />
            </button>

            {/* Search - Desktop Only */}
            <Link href="/search" className="hidden md:flex items-center gap-3 bg-secondary rounded-full px-6 py-2.5 text-gray-500 hover:bg-gray-100 transition-colors flex-1">
              <MagnifyingGlass className="flex-shrink-0" size={20} weight="regular" />
              <span className="text-base">Search by brand, article...</span>
            </Link>

            {/* Search Icon - Mobile Only */}
            <Link href="/search" className="p-2 md:hidden">
              <MagnifyingGlass size={24} weight="regular" />
            </Link>
          </div>

          {/* Center: Logo */}
          <Link href="/" className="flex-shrink-0 absolute left-1/2 -translate-x-1/2">
            <img
              src="/dres-logo.png"
              alt="DRES"
              className="h-7 md:h-9 w-auto"
            />
          </Link>

          {/* Right: Actions */}
          <div className="flex-1 flex items-center justify-end gap-1 md:gap-2">
            {/* Sell Button - Desktop Only */}
            <Link
              href="/sell"
              className="bg-black text-white text-base font-medium px-6 py-2.5 hover:bg-gray-800 transition-colors hidden lg:inline-flex"
            >
              Sell an item
            </Link>

            {/* User Profile - Hidden on Mobile */}
            <Link href="/account" className="hidden sm:flex p-2 hover:bg-gray-50 transition-colors rounded-full">
              <User size={24} weight="regular" className="text-gray-700" />
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist" className="p-2 hover:bg-gray-50 transition-colors rounded-full">
              <Heart size={24} weight="regular" className="text-gray-700" />
            </Link>

            {/* Notifications - Hidden on Mobile */}
            <Link href="/notifications" className="hidden sm:flex p-2 hover:bg-gray-50 transition-colors relative rounded-full">
              <Bell size={24} weight="regular" className="text-gray-700" />
              <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-semibold">
                1
              </span>
            </Link>

            {/* Cart */}
            <Link href="/cart" className="p-2 hover:bg-gray-50 transition-colors relative rounded-full">
              <ShoppingBag size={24} weight="regular" className="text-gray-700" />
              <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-semibold">
                2
              </span>
            </Link>
          </div>
        </div>
      </div>

      {/* Navigation Bar - Desktop Only */}
      <div className="hidden md:block">
        <HeaderNav data={data} />
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[100]"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-full bg-white z-[101] overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <img src="/dres-logo.png" alt="DRES" className="h-7 w-auto" />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 -mr-2"
                  aria-label="Close menu"
                >
                  <X size={24} weight="bold" />
                </button>
              </div>

              {/* User Actions */}
              <div className="p-4 border-b border-gray-100 space-y-2">
                <Link
                  href="/sell"
                  className="flex items-center justify-center bg-black text-white text-base font-medium py-3 w-full hover:bg-gray-800 transition-colors"
                >
                  Sell an item
                </Link>
                <div className="flex items-center gap-4 pt-2">
                  <Link href="/account" className="flex items-center gap-2 text-sm text-gray-700">
                    <User size={20} />
                    <span>Account</span>
                  </Link>
                  <Link href="/notifications" className="flex items-center gap-2 text-sm text-gray-700">
                    <Bell size={20} />
                    <span>Notifications</span>
                  </Link>
                </div>
              </div>

              {/* Navigation Items */}
              <nav className="py-2">
                {navItems.map((item, i) => {
                  const hasSubItems = item.subItems && Array.isArray(item.subItems) && item.subItems.length > 0
                  const isExpanded = expandedItems.includes(i)
                  const isHighlighted = item.highlighted || false

                  return (
                    <div key={i} className="border-b border-gray-50">
                      {/* Main Item */}
                      <div className="flex items-center justify-between">
                        {item.link ? (
                          <CMSLink
                            {...item.link}
                            label={item.label || ''}
                            className={`flex-1 px-4 py-3 text-base font-medium no-underline ${isHighlighted ? 'text-red-600' : 'text-gray-900'}`}
                          />
                        ) : (
                          <span className={`flex-1 px-4 py-3 text-base font-medium ${isHighlighted ? 'text-red-600' : 'text-gray-900'}`}>
                            {item.label}
                          </span>
                        )}
                        {hasSubItems && (
                          <button
                            onClick={() => toggleExpanded(i)}
                            className="px-4 py-3"
                          >
                            <motion.div
                              animate={{ rotate: isExpanded ? 180 : 0 }}
                            >
                              <CaretDown size={20} weight="bold" />
                            </motion.div>
                          </button>
                        )}
                      </div>

                      {/* Sub Items */}
                      <AnimatePresence>
                        {hasSubItems && isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-gray-50"
                          >
                            {item.subItems?.map((subItem, subIndex) => (
                              <div key={subIndex} className="py-2">
                                {/* Sub Menu Header */}
                                <p className="px-6 py-2 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                  {subItem.label}
                                </p>
                                {/* Sub Sub Items */}
                                {subItem.subItems?.map((nestedItem, nestedIndex) => (
                                  <div key={nestedIndex}>
                                    {nestedItem.link ? (
                                      <CMSLink
                                        {...nestedItem.link}
                                        label={nestedItem.label || ''}
                                        className="block px-8 py-2 text-sm text-gray-700 no-underline hover:bg-gray-100"
                                      />
                                    ) : (
                                      <span className="block px-8 py-2 text-sm text-gray-700">
                                        {nestedItem.label}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </header>
  )
}
