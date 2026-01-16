'use client'
import { useHeaderTheme } from '@/providers/HeaderTheme'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { MagnifyingGlass, User, Heart, Bell, ShoppingBag } from '@phosphor-icons/react'

import type { Header } from '@/payload-types'

import { HeaderNav } from './Nav'

interface HeaderClientProps {
  data: Header
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data }) => {
  const [theme, setTheme] = useState<string | null>(null)
  const { headerTheme, setHeaderTheme } = useHeaderTheme()
  const pathname = usePathname()

  useEffect(() => {
    setHeaderTheme(null)
  }, [pathname])

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme)
  }, [headerTheme])

  return (
    <header className="w-full border-b border-gray-100 bg-white sticky top-0 z-50" {...(theme ? { 'data-theme': theme } : {})}>
      {/* Top Bar */}
      <div className="container">
        <div className="flex items-center justify-between h-[72px] gap-12">
          {/* Left: Search Bar */}
          <div className="flex-1 max-w-md">
            <Link href="/search" className="flex items-center gap-3 bg-secondary rounded-full px-6 py-2.5 text-gray-500 hover:bg-gray-100 transition-colors">
              <MagnifyingGlass className="flex-shrink-0" size={20} weight="regular" />
              <span className="text-base">Search by brand, article...</span>
            </Link>
          </div>

          {/* Center: Logo */}
          <Link href="/" className="flex-shrink-0 absolute left-1/2 -translate-x-1/2">
            <img
              src="/dres-logo.png"
              alt="DRES"
              className="h-9 w-auto"
            />
          </Link>

          {/* Right: Actions */}
          <div className="flex-1 flex items-center justify-end gap-2">
            {/* Sell Button */}
            <Link
              href="/sell"
              className="bg-black text-white text-base font-medium px-6 py-2.5 hover:bg-gray-800 transition-colors hidden sm:inline-flex"
            >
              Sell an item
            </Link>

            {/* User Profile */}
            <Link href="/account" className="p-2 hover:bg-gray-50 transition-colors rounded-full">
              <User size={24} weight="regular" className="text-gray-700" />
            </Link>

            {/* Wishlist */}
            <Link href="/wishlist" className="p-2 hover:bg-gray-50 transition-colors rounded-full">
              <Heart size={24} weight="regular" className="text-gray-700" />
            </Link>

            {/* Notifications */}
            <Link href="/notifications" className="p-2 hover:bg-gray-50 transition-colors relative rounded-full">
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

      {/* Navigation Bar */}
      <HeaderNav data={data} />
    </header>
  )
}
