'use client'

import { useRowLabel } from '@payloadcms/ui'
import { useEffect, useState } from 'react'

export const VariationRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{
    options?: Record<string, number | null>
  }>()
  const [label, setLabel] = useState<string>(`Variation ${(rowNumber ?? 0) + 1}`)

  const options = data?.options

  useEffect(() => {
    const fetchOptionLabels = async () => {
      if (!options || typeof options !== 'object') {
        setLabel(`Variation ${(rowNumber ?? 0) + 1}`)
        return
      }

      // Get option IDs that have values
      const optionIds = Object.values(options).filter(
        (value): value is number => value !== null && value !== undefined
      )

      if (optionIds.length === 0) {
        setLabel(`Variation ${(rowNumber ?? 0) + 1}`)
        return
      }

      try {
        // Fetch option labels from API
        const params = optionIds.map((id) => `where[id][in]=${id}`).join('&')
        const response = await fetch(`/api/variantOptions?${params}&limit=100`)
        const data = await response.json()

        if (data.docs && data.docs.length > 0) {
          const labels = data.docs.map((opt: { label: string }) => opt.label)
          setLabel(labels.join(' - '))
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
