'use client'

import { useRowLabel } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

type SKUOptionRowData = {
  option?: string | { id: string; name?: string }
  value?: string | { id: string; name?: string }
}

export const SKUOptionRowLabel = () => {
  const { data } = useRowLabel<SKUOptionRowData>()
  const [label, setLabel] = useState('New Option')

  useEffect(() => {
    const fetchNames = async () => {
      try {
        let optionName = ''
        let valueName = ''

        // Get option name
        if (data?.option) {
          if (typeof data.option === 'object' && data.option.name) {
            optionName = data.option.name
          } else {
            const optionId = typeof data.option === 'object' ? data.option.id : data.option
            const res = await fetch(`/api/attributes/${optionId}?depth=0`)
            if (res.ok) {
              const attr = await res.json()
              optionName = attr.name || ''
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

        if (optionName && valueName) {
          setLabel(`${optionName}: ${valueName}`)
        } else if (optionName) {
          setLabel(optionName)
        } else {
          setLabel('New Option')
        }
      } catch (error) {
        console.error('Error fetching SKU option names:', error)
        setLabel('New Option')
      }
    }

    fetchNames()
  }, [data?.option, data?.value])

  return <span>{label}</span>
}
