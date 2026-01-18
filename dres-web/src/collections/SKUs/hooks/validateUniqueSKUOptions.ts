import type { CollectionBeforeChangeHook } from 'payload'
import { APIError } from 'payload'

interface SKUOptionItem {
  option?: string | { id: string }
  value?: string | { id: string }
}

/**
 * Validates that no other SKU exists with the same attribute options for the same variation.
 * This prevents duplicate SKUs like "Size: M" being added twice to the same variation.
 */
export const validateUniqueSKUOptions: CollectionBeforeChangeHook = async ({
  data,
  originalDoc,
  req,
  operation,
}) => {
  // Only validate if we have a variation and skuOptions
  const variationId = data?.variation
  const skuOptions = data?.skuOptions as SKUOptionItem[] | undefined

  if (!variationId) {
    return data
  }

  // Get the current SKU ID (for updates, we need to exclude it from the check)
  const currentSkuId = originalDoc?.id

  // Extract value IDs from the SKU options being saved
  const newValueIds = (skuOptions || [])
    .map((item) => {
      if (!item?.value) return null
      return typeof item.value === 'object' ? item.value.id : item.value
    })
    .filter((id): id is string => id !== null)
    .sort()

  // Create a unique key for this combination of options
  const newOptionsKey = newValueIds.join(',')

  // Find all existing SKUs for this variation
  const existingSkus = await req.payload.find({
    collection: 'skus',
    where: {
      variation: { equals: typeof variationId === 'object' ? variationId.id : variationId },
      ...(currentSkuId ? { id: { not_equals: currentSkuId } } : {}),
    },
    depth: 0,
    limit: 100,
  })

  // Check each existing SKU for matching options
  for (const existingSku of existingSkus.docs) {
    const existingOptions = (existingSku.skuOptions || []) as SKUOptionItem[]
    
    const existingValueIds = existingOptions
      .map((item) => {
        if (!item?.value) return null
        return typeof item.value === 'object' ? item.value.id : item.value
      })
      .filter((id): id is string => id !== null)
      .sort()

    const existingOptionsKey = existingValueIds.join(',')

    // If the options match, this is a duplicate
    if (newOptionsKey === existingOptionsKey) {
      // Get the option names for a better error message
      let optionNames = 'these options'
      
      if (skuOptions && skuOptions.length > 0) {
        try {
          const optionDetails = await Promise.all(
            skuOptions.map(async (item) => {
              if (!item?.value) return null
              const valueId = typeof item.value === 'object' ? item.value.id : item.value
              const valueDoc = await req.payload.findByID({
                collection: 'attributeOptions',
                id: valueId,
                depth: 1,
              })
              return valueDoc?.name || valueId
            })
          )
          optionNames = optionDetails.filter(Boolean).join(', ')
        } catch {
          // Fallback to generic message
        }
      }

      throw new APIError(
        `A SKU with ${optionNames} already exists for this variation. Please use different attribute options or edit the existing SKU.`,
        400
      )
    }
  }

  return data
}
