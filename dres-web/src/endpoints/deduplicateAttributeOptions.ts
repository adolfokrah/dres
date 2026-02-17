import type { PayloadHandler } from 'payload'

/**
 * POST /api/deduplicate-attribute-options
 *
 * Finds duplicate attribute options (same attribute + same name, case-insensitive),
 * remaps all variations and SKUs to use the canonical (oldest) option,
 * then deletes the duplicates.
 *
 * Run once to clean up existing duplicates, then the preventDuplicateOption hook
 * will prevent new ones.
 */
export const deduplicateAttributeOptions: PayloadHandler = async (req) => {
  const { payload, user } = req

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    payload.logger.info('[Deduplicate] Starting attribute options deduplication...')

    // Step 1: Fetch ALL attribute options
    const allOptions = await payload.find({
      collection: 'attributeOptions',
      limit: 0, // No limit
      depth: 0,
      sort: 'createdAt',
    })

    payload.logger.info(`[Deduplicate] Found ${allOptions.docs.length} total attribute options`)

    // Step 2: Group by (attribute + lowercase name)
    const groups = new Map<string, typeof allOptions.docs>()

    for (const opt of allOptions.docs) {
      const attributeId = typeof opt.attribute === 'object' ? (opt.attribute as any).id : opt.attribute
      const name = (opt.name as string)?.trim().toLowerCase() ?? ''
      const key = `${attributeId}::${name}`

      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(opt)
    }

    // Step 3: Find groups with duplicates
    const duplicateGroups = Array.from(groups.entries()).filter(([, docs]) => docs.length > 1)

    if (duplicateGroups.length === 0) {
      payload.logger.info('[Deduplicate] No duplicates found!')
      return Response.json({
        success: true,
        message: 'No duplicates found',
        stats: { duplicateGroups: 0, optionsRemoved: 0, variationsUpdated: 0, skusUpdated: 0 },
      })
    }

    payload.logger.info(`[Deduplicate] Found ${duplicateGroups.length} groups with duplicates`)

    let totalRemoved = 0
    let totalVariationsUpdated = 0
    let totalSkusUpdated = 0
    const details: Array<{
      name: string
      keeperId: string
      duplicateIds: string[]
      variationsUpdated: number
      skusUpdated: number
    }> = []

    // Step 4: Process each duplicate group
    for (const [key, docs] of duplicateGroups) {
      // Keep the first (oldest by createdAt sort)
      const keeper = docs[0]
      const duplicates = docs.slice(1)
      const duplicateIds = duplicates.map((d) => d.id)

      payload.logger.info(
        `[Deduplicate] "${keeper.name}" (attribute: ${key.split('::')[0]}): keeping ${keeper.id}, removing ${duplicateIds.join(', ')}`,
      )

      let variationsUpdated = 0
      let skusUpdated = 0

      // Step 4a: Remap variations
      for (const dupId of duplicateIds) {
        // Find variations referencing this duplicate in variants[].value
        const variations = await payload.find({
          collection: 'variations',
          where: {
            'variants.value': { equals: dupId },
          },
          limit: 0,
          depth: 0,
        })

        for (const variation of variations.docs) {
          const variants = (variation.variants as any[]) || []
          const updated = variants.map((v: any) => {
            const valueId = typeof v.value === 'object' ? v.value?.id : v.value
            if (valueId === dupId) {
              return { ...v, value: keeper.id }
            }
            return v
          })

          await payload.update({
            collection: 'variations',
            id: variation.id,
            data: { variants: updated },
            context: { skipHooks: true }, // Avoid triggering other hooks
          })

          variationsUpdated++
          payload.logger.info(
            `[Deduplicate]   Updated variation ${variation.id}: ${dupId} → ${keeper.id}`,
          )
        }

        // Step 4b: Remap SKUs
        const skus = await payload.find({
          collection: 'skus',
          where: {
            'skuOptions.value': { equals: dupId },
          },
          limit: 0,
          depth: 0,
        })

        for (const sku of skus.docs) {
          const skuOptions = (sku.skuOptions as any[]) || []
          const updated = skuOptions.map((opt: any) => {
            const valueId = typeof opt.value === 'object' ? opt.value?.id : opt.value
            if (valueId === dupId) {
              return { ...opt, value: keeper.id }
            }
            return opt
          })

          await payload.update({
            collection: 'skus',
            id: sku.id,
            data: { skuOptions: updated },
            context: { skipHooks: true },
          })

          skusUpdated++
          payload.logger.info(`[Deduplicate]   Updated SKU ${sku.id}: ${dupId} → ${keeper.id}`)
        }

        // Step 4c: Delete the duplicate
        await payload.delete({
          collection: 'attributeOptions',
          id: dupId,
        })

        payload.logger.info(`[Deduplicate]   Deleted duplicate option ${dupId}`)
        totalRemoved++
      }

      totalVariationsUpdated += variationsUpdated
      totalSkusUpdated += skusUpdated

      details.push({
        name: keeper.name as string,
        keeperId: keeper.id,
        duplicateIds,
        variationsUpdated,
        skusUpdated,
      })
    }

    const stats = {
      duplicateGroups: duplicateGroups.length,
      optionsRemoved: totalRemoved,
      variationsUpdated: totalVariationsUpdated,
      skusUpdated: totalSkusUpdated,
    }

    payload.logger.info(`[Deduplicate] Complete! ${JSON.stringify(stats)}`)

    return Response.json({
      success: true,
      message: `Removed ${totalRemoved} duplicate options, updated ${totalVariationsUpdated} variations and ${totalSkusUpdated} SKUs`,
      stats,
      details,
    })
  } catch (error) {
    payload.logger.error(`[Deduplicate] Error: ${error}`)
    return Response.json(
      { error: `Deduplication failed: ${error}` },
      { status: 500 },
    )
  }
}
