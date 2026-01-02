'use client'

import { useEffect } from 'react'

interface OpenInAppProps {
  slug: string
}

export function OpenInApp({ slug }: OpenInAppProps) {
  useEffect(() => {
    // Try to open the app on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    
    if (isMobile) {
      // Try to open the app using custom URL scheme
      const appUrl = `dres://products/${slug}`
      
      // Create a hidden iframe to try opening the app
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = appUrl
      document.body.appendChild(iframe)
      
      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(iframe)
      }, 2000)
    }
  }, [slug])

  return null
}
