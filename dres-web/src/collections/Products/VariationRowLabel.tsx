'use client'

import { useRowLabel } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

export const VariationRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{
    options?: Record<string, string | null>
  }>()
  const [label, setLabel] = useState<string>(`Variation ${(rowNumber ?? 0) + 1}`)

  const options = data?.options

  useEffect(() => {
    const fetchOptionLabels = async () => {
      if (!options || typeof options !== 'object') {
        setLabel(`Variation ${(rowNumber ?? 0) + 1}`)
        return
      }

      // Get option IDs that have values (they are strings now)
      const optionIds = Object.values(options).filter(
        (value): value is string => value !== null && value !== undefined && value !== ''
      )

      if (optionIds.length === 0) {
        setLabel(`Variation ${(rowNumber ?? 0) + 1}`)
        return
      }

      try {
        // Fetch option labels from API - using attributeOptions collection
        const response = await fetch(`/api/attributeOptions?where[id][in]=${optionIds.join(',')}&limit=100`)
        const result = await response.json()

        if (result.docs && result.docs.length > 0) {
          const labels = result.docs.map((opt: { name: string }) => opt.name)
          setLabel(labels.join(' / '))
        } else {
          setLabel(`Variation ${(rowNumber ?? 0) + 1}`)
        }
      } catch (error) {
        console.error('Error fetching option labels:', error)
        setLabel(`Variation ${(rowNumber ?? 0) + 1}`)
      }
    }

    fetchOptionLabels()
  }, [options, rowNumber])

  return <span>{label}</span>
}

export default VariationRowLabel
