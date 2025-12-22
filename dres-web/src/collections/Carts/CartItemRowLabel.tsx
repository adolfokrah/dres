'use client'

import { useRowLabel } from '@payloadcms/ui'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const CartItemRowLabel = () => {
  const { data, rowNumber } = useRowLabel<{
    product?: string | { id: string }
    variation?: number | null
  }>()

  const productId = typeof data?.product === 'object' ? data.product.id : data?.product
  const variationIndex = data?.variation

  // Fetch product with seller info
  const { data: productData } = useSWR(
    productId ? `/api/products/${productId}?depth=1` : null,
    fetcher
  )

  // Get variation options IDs
  const variation = variationIndex !== null && variationIndex !== undefined 
    ? productData?.variations?.[variationIndex] 
    : null
  const optionIds = variation?.options 
    ? Object.values(variation.options).filter((id): id is string => id !== null && id !== '')
    : []

  // Fetch option names
  const { data: optionsData } = useSWR(
    optionIds.length > 0 
      ? `/api/attributeOptions?where[id][in]=${optionIds.join(',')}&limit=100` 
      : null,
    fetcher
  )

  // Build label parts
  const productTitle = productData?.title || `Item ${(rowNumber ?? 0) + 1}`
  const optionNames = optionsData?.docs?.map((opt: { name: string }) => opt.name).join(' / ') || ''
  const seller = productData?.seller
  const isOnVacation = seller && typeof seller === 'object' && seller.vacationMode === true

  // Combine: Product Title - Variation Options
  const label = optionNames ? `${productTitle} - ${optionNames}` : productTitle

  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{label}</span>
      {isOnVacation && (
        <span
          style={{
            backgroundColor: '#f59e0b',
            color: '#fff',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            textTransform: 'uppercase',
          }}
        >
          ⏸ Seller on vacation
        </span>
      )}
    </span>
  )
}

export default CartItemRowLabel
