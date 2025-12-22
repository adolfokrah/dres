'use client'

import React, { useEffect, useMemo } from 'react'
import { SelectInput, useField, useFormFields, FieldLabel } from '@payloadcms/ui'
import useSWR from 'swr'

type VariantOption = {
  id: number
  label: string
  slug?: string
}

type Variation = {
  options?: Record<string, number | null>
  price?: number
}

type Product = {
  id: string
  title: string
  variations?: Variation[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const VariationSelectField: React.FC<{
  path: string
  field: {
    name: string
    label?: string
  }
}> = ({ path, field }) => {
  const { value, setValue } = useField<number | null>({ path })
  
  // Get the parent path (items.0 from items.0.variation)
  const pathParts = path.split('.')
  pathParts.pop() // Remove 'variation'
  const parentPath = pathParts.join('.')
  
  // Get current item index from path (e.g., "items.0.variation" -> 0)
  const currentItemIndex = parseInt(pathParts[pathParts.length - 1], 10)
  
  // Watch the product field in the same array item
  const productField = useFormFields(([fields]) => {
    return fields[`${parentPath}.product`]
  })

  // Watch all items to get selected variations for the same product
  const allItems = useFormFields(([fields]) => {
    // Get all item fields
    const items: Array<{ product: string | number | null; variation: number | null }> = []
    let i = 0
    while (fields[`items.${i}.product`] !== undefined) {
      items.push({
        product: fields[`items.${i}.product`]?.value as string | number | null,
        variation: fields[`items.${i}.variation`]?.value as number | null,
      })
      i++
    }
    return items
  })

  const priceField = useField<number>({ path: `${parentPath}.price` })
  
  const productId = productField?.value as string | undefined

  // Fetch product data
  const { data: product, isLoading: productLoading } = useSWR<Product>(
    productId ? `/api/products/${productId}?depth=0` : null,
    fetcher
  )

  // Collect all variant option IDs
  const optionIds = useMemo(() => {
    if (!product?.variations) return []
    
    const ids: number[] = []
    product.variations.forEach((variation) => {
      if (variation.options) {
        Object.values(variation.options).forEach((optId) => {
          if (optId !== null && typeof optId === 'number' && !ids.includes(optId)) {
            ids.push(optId)
          }
        })
      }
    })
    return ids
  }, [product?.variations])

  // Fetch variant options
  const { data: variantOptionsData, isLoading: optionsLoading } = useSWR(
    optionIds.length > 0 
      ? `/api/variantOptions?where[id][in]=${optionIds.join(',')}&limit=100&depth=0`
      : null,
    fetcher
  )

  // Build option names map
  const optionNames = useMemo(() => {
    const map = new Map<number, string>()
    if (variantOptionsData?.docs) {
      (variantOptionsData.docs as VariantOption[]).forEach((opt) => {
        map.set(opt.id, opt.label)
      })
    }
    return map
  }, [variantOptionsData])

  // Get variations already selected by other items with the same product
  const selectedVariations = useMemo(() => {
    const selected = new Set<number>()
    allItems.forEach((item, index) => {
      // Skip current item and items with different products
      if (index === currentItemIndex) return
      if (String(item.product) !== String(productId)) return
      if (item.variation !== null && item.variation !== undefined) {
        selected.add(item.variation)
      }
    })
    return selected
  }, [allItems, currentItemIndex, productId])

  // Build select options (excluding already selected variations)
  const selectOptions = useMemo(() => {
    if (!product?.variations || product.variations.length === 0) return []
    
    return product.variations
      .map((variation, index) => {
        // Skip if this variation is already selected by another item
        if (selectedVariations.has(index)) return null
        
        let label = `Variation ${index + 1}`
        
        if (variation.options && Object.keys(variation.options).length > 0) {
          const optionLabels = Object.values(variation.options)
            .filter((optId): optId is number => optId !== null)
            .map((optId) => optionNames.get(optId) || `Option ${optId}`)
          
          if (optionLabels.length > 0) {
            label = optionLabels.join(' / ')
          }
        }
        
        const priceLabel = variation.price ? ` - $${variation.price}` : ''
        
        return {
          label: `${label}${priceLabel}`,
          value: String(index),
        }
      })
      .filter((opt): opt is { label: string; value: string } => opt !== null)
  }, [product?.variations, optionNames, selectedVariations])

  // Update price when variation changes
  useEffect(() => {
    if (value !== null && value !== undefined && product?.variations?.[value]) {
      const variation = product.variations[value]
      if (variation.price !== undefined && variation.price !== null) {
        priceField.setValue(variation.price)
      }
    }
  }, [value, product?.variations, priceField])

  const isLoading = productLoading || optionsLoading

  if (selectOptions.length === 0 && !isLoading) {
    return (
      <div className="field-type">
        <FieldLabel label={field.label || 'Variation'} />
        <p style={{ color: 'var(--theme-elevation-400)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          {productId 
            ? 'This product has no variations' 
            : 'Select a product first'}
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="field-type">
        <FieldLabel label={field.label || 'Variation'} />
        <p style={{ color: 'var(--theme-elevation-400)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
          Loading variations...
        </p>
      </div>
    )
  }

  return (
    <div className="field-type">
      <FieldLabel label={field.label || 'Variation'} />
      <SelectInput
        path={path}
        name={field.name}
        options={selectOptions}
        value={value !== null && value !== undefined ? String(value) : ''}
        onChange={(option) => {
          if (option && typeof option === 'object' && 'value' in option) {
            const newValue = option.value === '' || option.value === null 
              ? null 
              : Number(option.value)
            setValue(newValue)
          } else {
            setValue(null)
          }
        }}
        isClearable
      />
    </div>
  )
}
