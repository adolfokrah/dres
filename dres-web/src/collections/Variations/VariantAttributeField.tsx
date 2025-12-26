'use client'

import { RelationshipField, useField, useFormFields } from '@payloadcms/ui'
import React, { useMemo } from 'react'

/**
 * Custom relationship field that filters out attributes already used in other array items
 * Only shows attributes with level = 'variation'
 */
export const VariantAttributeField: React.FC<{
  path: string
  field: any
}> = (props) => {
  const { path } = props
  
  // Get current value
  const { value } = useField<string>({ path })
  
  // Get all variants array data
  const variants = useFormFields(([fields]) => {
    return fields?.variants?.value as Array<{ variant?: string | { id: string } }> | undefined
  })
  
  // Get already used attribute IDs (excluding current)
  const usedAttributeIds = useMemo(() => {
    if (!variants || !Array.isArray(variants)) return []
    
    // Extract the current item index from path (e.g., "variants.0.variant" -> 0)
    const pathParts = path.split('.')
    const currentIndex = parseInt(pathParts[1], 10)
    
    return variants
      .map((item, index) => {
        if (index === currentIndex) return null // Exclude current item
        if (!item?.variant) return null
        return typeof item.variant === 'object' ? item.variant.id : item.variant
      })
      .filter(Boolean) as string[]
  }, [variants, path])
  
  // Build filter query
  const filterOptions = useMemo(() => {
    const filter: Record<string, any> = {
      level: { equals: 'variation' },
    }
    
    if (usedAttributeIds.length > 0) {
      filter.id = { not_in: usedAttributeIds }
    }
    
    return filter
  }, [usedAttributeIds])

  return (
    <RelationshipField
      {...props}
      field={{
        ...props.field,
        filterOptions,
      }}
    />
  )
}
