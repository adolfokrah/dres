import type { PayloadHandler } from 'payload'

/**
 * Get all size options from size-related attributes
 *
 * Returns a flat list of all size options with their attribute grouping
 * Example response:
 * {
 *   sizes: [
 *     { name: "S", attribute: "Size", attributeId: "..." },
 *     { name: "M", attribute: "Size", attributeId: "..." },
 *     { name: "9", attribute: "Shoe Size US", attributeId: "..." },
 *     ...
 *   ]
 * }
 */
export const getSizeOptions: PayloadHandler = async (req) => {
  const { payload } = req

  try {
    // Fetch all attributes that are SKU-level and contain "size" in the name
    const attributesResult = await payload.find({
      collection: 'attributes',
      where: {
        and: [
          { level: { equals: 'sku' } },
          {
            or: [
              { name: { contains: 'size' } },
              { name: { contains: 'Size' } },
            ],
          },
        ],
      },
      depth: 0, // Don't populate relationships
      limit: 100,
    })

    // Fetch all options for these attributes
    const sizeOptions: Array<{
      name: string
      slug: string
      attribute: string
      attributeId: string
    }> = []

    for (const attribute of attributesResult.docs) {
      // Fetch options for this attribute
      const optionsResult = await payload.find({
        collection: 'attributeOptions',
        where: {
          attribute: {
            equals: attribute.id,
          },
        },
        limit: 500,
        sort: 'name',
      })

      // Add each option to the list
      for (const option of optionsResult.docs) {
        sizeOptions.push({
          name: option.name,
          slug: option.slug,
          attribute: attribute.name,
          attributeId: attribute.id,
        })
      }
    }

    // Sort by attribute name, then by option name
    sizeOptions.sort((a, b) => {
      if (a.attribute !== b.attribute) {
        return a.attribute.localeCompare(b.attribute)
      }
      return a.name.localeCompare(b.name)
    })

    return Response.json({
      sizes: sizeOptions,
      total: sizeOptions.length,
    })
  } catch (error) {
    payload.logger.error(`[GetSizeOptions] Error: ${error}`)
    return Response.json(
      { error: 'Failed to fetch size options' },
      { status: 500 }
    )
  }
}
