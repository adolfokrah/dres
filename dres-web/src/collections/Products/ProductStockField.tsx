'use client'

import React, { useEffect, useState } from 'react'
import { useField, useFormFields, NumberField } from '@payloadcms/ui'
import type { NumberFieldClientProps } from 'payload'

export const ProductStockField: React.FC<NumberFieldClientProps> = (props) => {
  const { path, field } = props
  const [shouldShow, setShouldShow] = useState(true)
  const [isLoading, setIsLoading] = useState(true)

  // Watch the category field
  const categoryField = useFormFields(([fields]) => fields.category)
  const categoryValue = categoryField?.value

  useEffect(() => {
    const checkCategoryVariants = async () => {
      if (!categoryValue) {
        setShouldShow(true)
        setIsLoading(false)
        return
      }

      try {
        const categoryId = typeof categoryValue === 'object' ? (categoryValue as { id: string }).id : categoryValue
        const response = await fetch(`/api/categories/${categoryId}?depth=0`)
        
        if (response.ok) {
          const category = await response.json()
          // Hide stock if category has variant attributes
          const hasVariantAttributes = category.variantAttributes && 
            Array.isArray(category.variantAttributes) && 
            category.variantAttributes.length > 0
          setShouldShow(!hasVariantAttributes)
        } else {
          setShouldShow(true)
        }
      } catch (error) {
        console.error('Error fetching category:', error)
        setShouldShow(true)
      }
      
      setIsLoading(false)
    }

    setIsLoading(true)
    checkCategoryVariants()
  }, [categoryValue])

  if (isLoading) {
    return null
  }

  if (!shouldShow) {
    return null
  }

  return <NumberField {...props} />
}

export default ProductStockField
