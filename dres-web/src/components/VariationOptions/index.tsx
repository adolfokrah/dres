'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useField, useForm, useDocumentInfo } from '@payloadcms/ui'

interface VariantType {
  id: number
  name: string
}

interface VariantOption {
  id: number
  label: string
  variantType: VariantType | number
}

type Props = {
  path: string
  field: {
    name: string
    label?: string
  }
}

export const VariationOptionsField: React.FC<Props> = ({ path }) => {
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([])
  const [optionsByType, setOptionsByType] = useState<Record<number, VariantOption[]>>({})
  const [loading, setLoading] = useState(false)

  const { value, setValue } = useField<Record<string, number | null>>({ path })
  const { getData } = useForm()
  const formData = getData()
  
  const categoryId = formData?.category as number | { id: number } | undefined
  const categoryIdValue = typeof categoryId === 'object' ? categoryId?.id : categoryId

  // Fetch variant types for the category
  const fetchVariantTypes = useCallback(async () => {
    if (!categoryIdValue) {
      setVariantTypes([])
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/categories/${categoryIdValue}?depth=1`)
      const category = await response.json()

      if (category?.variantTypes && Array.isArray(category.variantTypes)) {
        const types = category.variantTypes.filter(
          (vt: VariantType | number): vt is VariantType => typeof vt === 'object'
        )
        setVariantTypes(types)
      } else {
        setVariantTypes([])
      }
    } catch (error) {
      console.error('Error fetching variant types:', error)
      setVariantTypes([])
    } finally {
      setLoading(false)
    }
  }, [categoryIdValue])

  useEffect(() => {
    fetchVariantTypes()
  }, [fetchVariantTypes])

  // Fetch variant options for each type
  useEffect(() => {
    const fetchOptions = async () => {
      if (variantTypes.length === 0 || !categoryIdValue) {
        setOptionsByType({})
        return
      }

      const optionsMap: Record<number, VariantOption[]> = {}

      for (const vt of variantTypes) {
        try {
          const response = await fetch(
            `/api/variantOptions?where[variantType][equals]=${vt.id}&where[categories][contains]=${categoryIdValue}&limit=100`
          )
          const data = await response.json()
          optionsMap[vt.id] = data.docs || []
        } catch (error) {
          console.error(`Error fetching options for ${vt.name}:`, error)
          optionsMap[vt.id] = []
        }
      }

      setOptionsByType(optionsMap)
    }

    fetchOptions()
  }, [variantTypes, categoryIdValue])

  // Handle selection change
  const handleChange = (variantTypeName: string, optionId: string) => {
    const newValue = {
      ...((value as Record<string, number | null>) || {}),
      [variantTypeName]: optionId ? Number(optionId) : null,
    }
    setValue(newValue)
  }

  if (!categoryIdValue) {
    return (
      <div style={{ color: '#888', padding: '12px 0', fontSize: '14px' }}>
        Select a category first to see variant options
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ color: '#888', padding: '12px 0', fontSize: '14px' }}>
        Loading variant types...
      </div>
    )
  }

  if (variantTypes.length === 0) {
    return (
      <div style={{ color: '#888', padding: '12px 0', fontSize: '14px' }}>
        No variant types found for this category
      </div>
    )
  }

  const currentValue = (value as Record<string, number | null>) || {}

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {variantTypes.map((vt) => {
        const options = optionsByType[vt.id] || []
        const selectedValue = currentValue[vt.name] || ''

        return (
          <div key={vt.id}>
            <label
              style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: 500,
                fontSize: '14px',
              }}
            >
              {vt.name} <span style={{ color: '#ff6b6b' }}>*</span>
            </label>
            <select
              value={selectedValue}
              onChange={(e) => handleChange(vt.name, e.target.value)}
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
              <option value="">Select {vt.name}</option>
              {options.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
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
