'use client'

import { useRowLabel, useDocumentInfo } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

type VariantRowData = {
  variant?: string | { id: string; name?: string }
  value?: string | { id: string; name?: string }
}

export const VariantRowLabel = () => {
  const { data } = useRowLabel<VariantRowData>()
  const [label, setLabel] = useState('New Variant')

  useEffect(() => {
    const fetchNames = async () => {
      try {
        let variantName = ''
        let valueName = ''

        // Get variant name
        if (data?.variant) {
          if (typeof data.variant === 'object' && data.variant.name) {
            variantName = data.variant.name
          } else {
            const variantId = typeof data.variant === 'object' ? data.variant.id : data.variant
            const res = await fetch(`/api/attributes/${variantId}?depth=0`)
            if (res.ok) {
              const attr = await res.json()
              variantName = attr.name || ''
            }
          }
        }

        // Get value name
        if (data?.value) {
          if (typeof data.value === 'object' && data.value.name) {
            valueName = data.value.name
          } else {
            const valueId = typeof data.value === 'object' ? data.value.id : data.value
            const res = await fetch(`/api/attributeOptions/${valueId}?depth=0`)
            if (res.ok) {
              const opt = await res.json()
              valueName = opt.name || ''
            }
          }
        }

        if (variantName && valueName) {
          setLabel(`${variantName}: ${valueName}`)
        } else if (variantName) {
          setLabel(variantName)
        } else {
          setLabel('New Variant')
        }
      } catch (error) {
        console.error('Error fetching variant names:', error)
        setLabel('New Variant')
      }
    }

    fetchNames()
  }, [data?.variant, data?.value])

  return <span>{label}</span>
}
