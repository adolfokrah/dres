import React from 'react'
import { ProductArchiveBlock } from '@/components/ProductArchiveBlock'

interface Product {
  id: string
  thumbnail: string | null
  brand: string | null
  category: string | null
  title: string
  price: number
  compareAtPrice?: number
  currency: {
    code: string
    symbol: string
  } | null
  slug: string
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

    if (queryType === 'trending') {
      const params = new URLSearchParams({
        limit: (limit || 8).toString(),
        department: departmentId,
      })
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/variations/trending?${params}`,
        {
          next: { revalidate: 600 } // Cache for 10 minutes
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        products = data.docs || []
      }
    } else if (queryType === 'new-arrivals') {
      const params = new URLSearchParams({
        limit: (limit || 8).toString(),
        department: departmentId,
      })
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_SERVER_URL}/api/variations/new-arrivals?${params}`,
        {
          next: { revalidate: 600 } // Cache for 10 minutes
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        products = data.docs || []
      }
    }
    // Add other query types here as they're implemented
    // else if (queryType === 'recently-viewed') { ... }
    // else if (queryType === 'featured') { ... }
    
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
