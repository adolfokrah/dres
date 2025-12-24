'use client'

import React, { useEffect, useState, useCallback, useMemo } from 'react'
import { useField, useFormFields, SelectInput, FieldLabel } from '@payloadcms/ui'
import useSWR from 'swr'

interface Attribute {
  id: string
  name: string
}

interface AttributeOption {
  id: string
  name: string
  attribute: string | Attribute
  categories?: (string | { id: string })[]
}

interface Category {
  id: string
  variantAttributes?: (string | Attribute)[]
}

interface Product {
  id: string
  category?: string | Category
}

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const VariationOptionsField: React.FC<{
  path: string
  field: {
    name: string
    label?: string
    required?: boolean
  }
}> = ({ path, field }) => {
  const { value, setValue } = useField<string[]>({ path })
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({})

  // Watch the product field
  const productField = useFormFields(([fields]) => fields.product)
  
  const productId = useMemo(() => {
    const prodValue = productField?.value
    if (prodValue) {
      const id = typeof prodValue === 'object' && prodValue !== null 
        ? (prodValue as { id?: string }).id 
        : prodValue
      return typeof id === 'string' ? id : null
    }
    return null
  }, [productField])

  // Fetch product
  const { data: product } = useSWR<Product>(
    productId ? `/api/products/${productId}?depth=1` : null,
    fetcher
  )

  // Get category ID from product
  const categoryId = useMemo(() => {
    if (!product?.category) return null
    return typeof product.category === 'object' ? product.category.id : product.category
  }, [product])

  // Fetch category
  const { data: category } = useSWR<Category>(
    categoryId ? `/api/categories/${categoryId}?depth=1` : null,
    fetcher
  )

  // Get variant attribute IDs
  const variantAttrIds = useMemo(() => {
    if (!category?.variantAttributes?.length) return []
    return category.variantAttributes.map((attr) =>
      typeof attr === 'object' ? attr.id : attr
    )
  }, [category])

  // Fetch attributes
  const { data: attrsData } = useSWR(
    variantAttrIds.length > 0 
      ? `/api/attributes?where[id][in]=${variantAttrIds.join(',')}&depth=0` 
      : null,
    fetcher
  )
  const attributes: Attribute[] = attrsData?.docs || []

  // Fetch all options for all attributes in one query
  const { data: optionsData, isLoading } = useSWR(
    variantAttrIds.length > 0
      ? `/api/attributeOptions?where[attribute][in]=${variantAttrIds.join(',')}&depth=1&limit=500`
      : null,
    fetcher
  )

  // Group and filter options by attribute and category
  const optionsByAttribute = useMemo(() => {
    const allOptions: AttributeOption[] = optionsData?.docs || []
    const optionsMap: Record<string, AttributeOption[]> = {}

    for (const attr of attributes) {
      const attrOptions = allOptions.filter((opt) => {
        const optAttrId = typeof opt.attribute === 'object' ? opt.attribute.id : opt.attribute
        return optAttrId === attr.id
      })

      // Filter by category
      const filteredOptions = attrOptions.filter((opt) => {
        if (!opt.categories || opt.categories.length === 0) return true
        return opt.categories.some((cat) => {
          const catId = typeof cat === 'object' ? cat.id : cat
          return catId === categoryId
        })
      })

      optionsMap[attr.id] = filteredOptions
    }

    return optionsMap
  }, [optionsData, attributes, categoryId])

  // Initialize selected options from current value
  useEffect(() => {
    if (value && value.length > 0 && Object.keys(optionsByAttribute).length > 0) {
      const selected: Record<string, string> = {}
      for (const optionId of value) {
        for (const [attrId, options] of Object.entries(optionsByAttribute)) {
          const found = options.find((opt) => opt.id === optionId)
          if (found) {
            selected[attrId] = optionId
            break
          }
        }
      }
      setSelectedOptions(selected)
    }
  }, [value, optionsByAttribute])

  // Update the field value when selections change
  const handleOptionChange = useCallback(
    (attributeId: string, optionId: string | null) => {
      const newSelected = { ...selectedOptions }
      if (optionId) {
        newSelected[attributeId] = optionId
      } else {
        delete newSelected[attributeId]
      }
      setSelectedOptions(newSelected)
      setValue(Object.values(newSelected).filter(Boolean))
    },
    [selectedOptions, setValue]
  )

  if (!productId) {
    return (
      <div className="field-type">
        <FieldLabel label={field.label || 'Options'} required={field.required} />
        <p style={{ color: 'var(--theme-elevation-500)', marginTop: '0.5rem' }}>
          Please select a product first to see available variation options.
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="field-type">
        <FieldLabel label={field.label || 'Options'} required={field.required} />
        <p style={{ color: 'var(--theme-elevation-500)', marginTop: '0.5rem' }}>
          Loading variation options...
        </p>
      </div>
    )
  }

  if (attributes.length === 0) {
    return (
      <div className="field-type">
        <FieldLabel label={field.label || 'Options'} required={field.required} />
        <p style={{ color: 'var(--theme-elevation-500)', marginTop: '0.5rem' }}>
          No variant attributes configured for this product's category.
        </p>
      </div>
    )
  }

  return (
    <div className="field-type">
      <FieldLabel label={field.label || 'Options'} required={field.required} />
      <p
        style={{
          color: 'var(--theme-elevation-500)',
          marginTop: '0.25rem',
          marginBottom: '1rem',
          fontSize: '0.875rem',
        }}
      >
        Select one option from each variant type to define this variation.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {attributes.map((attr) => {
          const options = optionsByAttribute[attr.id] || []
          const selectOptions = options.map((opt) => ({
            label: opt.name,
            value: opt.id,
          }))

          return (
            <div key={attr.id}>
              <FieldLabel label={attr.name} />
              <SelectInput
                path={`${path}.${attr.id}`}
                name={`${path}.${attr.id}`}
                options={selectOptions}
                value={selectedOptions[attr.id] || ''}
                onChange={(option) => {
                  const selected = Array.isArray(option) ? option[0] : option
                  const val = selected?.value as string | undefined
                  handleOptionChange(attr.id, val || null)
                }}
                isClearable
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
