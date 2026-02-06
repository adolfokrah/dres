import React from 'react'
import { ProductArchiveBlock } from '@/components/ProductArchiveBlock'

interface Product {
  id: string
  thumbnail: string | null
  brand: string | null
  category: string | null
  title: string
  sellingPrice: number
  compareAtPrice?: number
  currency: {
    code: string
    symbol: string
  } | null
  slug: string
  showWeLoveBadge?: boolean
}

export default async function ProductArchiveBlockComponent({ 
  title, 
  queryType, 
  seeAllLink, 
  seeAllText, 
  department, 
  limit 
}: any) {
  // Fetch products based on query type
  let products: Product[] = []
  
  try {
    const departmentId = department || '694eee871a36e6d75fbb15af' // Default to Men

    // All query types go through the filtered endpoint
    const filterTypeMap: Record<string, string | undefined> = {
      'trending': 'trending',
      'featured': 'featured',
      'we-love': 'we-love',
      'on-sale': 'on-sale',
    }

    const params = new URLSearchParams({
      limit: (limit || 8).toString(),
      department: departmentId,
    })

    const filterType = filterTypeMap[queryType]
    if (filterType) {
      params.set('filterType', filterType)
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SERVER_URL}/api/variations/filtered?${params}`,
      {
        next: { revalidate: 600 } // Cache for 10 minutes
      }
    )

    if (response.ok) {
      const data = await response.json()
      products = data.variations || []
    }
    
  } catch (error) {
    console.error('Error fetching products:', error)
  }

  return (
    <ProductArchiveBlock
      title={title}
      queryType={queryType}
      seeAllLink={seeAllLink}
      seeAllText={seeAllText}
      products={products}
    />
  )
}
