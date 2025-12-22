'use client'

import React, { useMemo } from 'react'
import { useField, useForm, SelectInput } from '@payloadcms/ui'
import useSWR from 'swr'

interface Attribute {
  id: string
  name: string
}

interface AttributeOption {
  id: string
  name: string
  slug: string
  attribute: Attribute | string
  categories?: (Category | string)[]
}

interface Category {
  id: string
  attributes?: (Attribute | string)[]
  variantAttributes?: (Attribute | string)[]
}

type Props = {
  path: string
  field: {
    name: string
    label?: string
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const ProductAttributesField: React.FC<Props> = ({ path }) => {
  const { value, setValue } = useField<Record<string, string | null>>({ path })
  const { getData } = useForm()
  const formData = getData()
  
  const categoryId = formData?.category as string | { id: string } | undefined
  const categoryIdValue = typeof categoryId === 'object' ? categoryId?.id : categoryId

  // Fetch category with attributes
  const { data: category, isLoading: categoryLoading } = useSWR<Category>(
    categoryIdValue ? `/api/categories/${categoryIdValue}?depth=1` : null,
    fetcher
  )

  // Get variant attribute IDs to exclude them
  const variantAttributeIds = useMemo(() => {
    if (!category?.variantAttributes) return []
    return category.variantAttributes.map((attr) =>
      typeof attr === 'object' ? attr.id : attr
    )
  }, [category?.variantAttributes])

  // Get non-variant attributes only
  const attributes = useMemo(() => {
    if (!category?.attributes) return []
    const allAttrs = category.attributes.filter(
      (attr): attr is Attribute => typeof attr === 'object'
    )
    return allAttrs.filter((attr) => !variantAttributeIds.includes(attr.id))
  }, [category?.attributes, variantAttributeIds])

  // Fetch options for all attributes (with depth to get categories)
  const attributeIds = attributes.map((attr) => attr.id).join(',')
  const { data: optionsData } = useSWR(
    attributes.length > 0
      ? `/api/attributeOptions?where[attribute][in]=${attributeIds}&depth=1&limit=500`
      : null,
    fetcher
  )

  // Group options by attribute, filtering by category
  const optionsByAttribute = useMemo(() => {
    if (!optionsData?.docs) return {}
    const grouped: Record<string, AttributeOption[]> = {}
    for (const option of optionsData.docs as AttributeOption[]) {
      // Check if option is available for this category
      const optionCategories = option.categories
      
      // Option must have categories assigned and include the current category
      if (!optionCategories || !Array.isArray(optionCategories) || optionCategories.length === 0) {
        // Skip options without categories assigned
        continue
      }
      
      const categoryIds = optionCategories.map((cat) =>
        typeof cat === 'object' ? cat.id : cat
      )
      
      // Skip if this option doesn't include the current category
      if (!categoryIds.includes(categoryIdValue!)) continue
      
      const attrId = typeof option.attribute === 'object' ? option.attribute.id : option.attribute
      if (!grouped[attrId]) grouped[attrId] = []
      grouped[attrId].push(option)
    }
    return grouped
  }, [optionsData?.docs, categoryIdValue])

  // Handle selection change
  const handleChange = (attributeName: string, optionId: string) => {
    const newValue = {
      ...((value as Record<string, string | null>) || {}),
      [attributeName]: optionId || null,
    }
    setValue(newValue)
  }

  if (!categoryIdValue) {
    return (
      <div style={{ color: '#888', padding: '12px 0', fontSize: '14px' }}>
        Select a category first to see product attributes
      </div>
    )
  }

  if (categoryLoading) {
    return (
      <div style={{ color: '#888', padding: '12px 0', fontSize: '14px' }}>
        Loading attributes...
      </div>
    )
  }

  if (attributes.length === 0) {
    return (
      <div style={{ color: '#888', padding: '12px 0', fontSize: '14px' }}>
        No attributes for this category
      </div>
    )
  }

  const currentValue = (value as Record<string, string | null>) || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {attributes.map((attr) => {
        const options = optionsByAttribute[attr.id] || []
        const selectedValue = currentValue[attr.name] || ''

        return (
          <SelectInput
            key={attr.id}
            path={`${path}.${attr.name}`}
            name={attr.name}
            label={attr.name}
            options={[
              { label: `Select ${attr.name}`, value: '' },
              ...options.map((opt) => ({
                label: opt.name,
                value: opt.id,
              })),
            ]}
            value={selectedValue}
            onChange={(option) => {
              const selectedOption = option as { value: string } | null
              handleChange(attr.name, selectedOption?.value || '')
            }}
          />
        )
      })}
    </div>
  )
}

export default ProductAttributesField
