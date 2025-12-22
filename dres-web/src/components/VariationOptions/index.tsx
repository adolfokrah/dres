'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useField, useForm } from '@payloadcms/ui'

interface Attribute {
  id: string
  name: string
}

interface AttributeOption {
  id: string
  name: string
  slug: string
  attribute: Attribute | string
}

type Props = {
  path: string
  field: {
    name: string
    label?: string
  }
}

export const VariationOptionsField: React.FC<Props> = ({ path }) => {
  const [variantAttributes, setVariantAttributes] = useState<Attribute[]>([])
  const [optionsByAttribute, setOptionsByAttribute] = useState<Record<string, AttributeOption[]>>({})
  const [loading, setLoading] = useState(false)

  const { value, setValue } = useField<Record<string, string | null>>({ path })
  const { getData } = useForm()
  const formData = getData()
  
  const categoryId = formData?.category as string | { id: string } | undefined
  const categoryIdValue = typeof categoryId === 'object' ? categoryId?.id : categoryId

  // Fetch variant attributes for the category
  const fetchVariantAttributes = useCallback(async () => {
    if (!categoryIdValue) {
      setVariantAttributes([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/categories/${categoryIdValue}?depth=1`)
      const category = await response.json()

      if (category?.variantAttributes && Array.isArray(category.variantAttributes)) {
        const attrs = category.variantAttributes.filter(
          (attr: Attribute | string): attr is Attribute => typeof attr === 'object'
        )
        setVariantAttributes(attrs)
      } else {
        setVariantAttributes([])
      }
    } catch (error) {
      console.error('Error fetching variant attributes:', error)
      setVariantAttributes([])
    } finally {
      setLoading(false)
    }
  }, [categoryIdValue])

  useEffect(() => {
    fetchVariantAttributes()
  }, [fetchVariantAttributes])

  // Fetch attribute options for each variant attribute
  useEffect(() => {
    const fetchOptions = async () => {
      if (variantAttributes.length === 0) {
        setOptionsByAttribute({})
        return
      }

      const optionsMap: Record<string, AttributeOption[]> = {}

      for (const attr of variantAttributes) {
        try {
          const response = await fetch(
            `/api/attributeOptions?where[attribute][equals]=${attr.id}&limit=100`
          )
          const data = await response.json()
          optionsMap[attr.id] = data.docs || []
        } catch (error) {
          console.error(`Error fetching options for ${attr.name}:`, error)
          optionsMap[attr.id] = []
        }
      }

      setOptionsByAttribute(optionsMap)
    }

    fetchOptions()
  }, [variantAttributes])

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
        Select a category first to see variation options
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ color: '#888', padding: '12px 0', fontSize: '14px' }}>
        Loading variation attributes...
      </div>
    )
  }

  if (variantAttributes.length === 0) {
    return (
      <div style={{ color: '#888', padding: '12px 0', fontSize: '14px' }}>
        No variation attributes found for this category
      </div>
    )
  }

  const currentValue = (value as Record<string, string | null>) || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {variantAttributes.map((attr) => {
        const options = optionsByAttribute[attr.id] || []
        const selectedValue = currentValue[attr.name] || ''

        return (
          <div key={attr.id}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              {attr.name} <span style={{ color: '#ff6b6b' }}>*</span>
            </label>
            <select
              value={selectedValue}
              onChange={(e) => handleChange(attr.name, e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '4px',
                border: '1px solid var(--theme-elevation-150)',
                backgroundColor: 'var(--theme-elevation-50)',
                color: 'var(--theme-text)',
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              <option value="">Select {attr.name}</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.name}
                </option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )
}

export default VariationOptionsField
