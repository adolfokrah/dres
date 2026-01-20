import type { Endpoint } from 'payload'

/**
 * GET /api/categories/:id/attributes
 * Returns all attributes for a category with their options filtered by category.
 * Options are included if:
 * - They have the current category in their categories array, OR
 * - They have no categories set (available for all categories)
 */
export const getCategoryAttributes: Endpoint = {
  path: '/:id/attributes',
  method: 'get',
  handler: async (req) => {
    const { id } = req.routeParams as { id: string }

    if (!id) {
      return Response.json({ error: 'Category ID is required' }, { status: 400 })
    }

    try {
      // Get the category with its attributes
      const category = await req.payload.findByID({
        collection: 'categories',
        id,
        depth: 1,
      })

      if (!category) {
        return Response.json({ error: 'Category not found' }, { status: 404 })
      }

      const attributeIds = (category.attributes || []).map((attr: any) =>
        typeof attr === 'string' ? attr : attr.id,
      )

      if (attributeIds.length === 0) {
        return Response.json({ attributes: [] })
      }

      // Fetch all attributes
      const attributesResult = await req.payload.find({
        collection: 'attributes',
        where: {
          id: { in: attributeIds },
        },
        limit: 0, // No limit
      })

      // For each attribute, fetch its options filtered by category
      const attributesWithOptions = await Promise.all(
        attributesResult.docs.map(async (attr) => {
          // Fetch ALL options for this attribute first
          const allOptionsResult = await req.payload.find({
            collection: 'attributeOptions',
            where: {
              attribute: { equals: attr.id },
            },
            limit: 0, // No limit - get all options
            sort: 'name',
            depth: 0, // Don't populate categories, just get IDs
          })

          // Filter options: include if categories is empty/null OR contains this category
          const filteredOptions = allOptionsResult.docs.filter((opt) => {
            const categories = opt.categories as (string | { id: string })[] | null | undefined
            // Include if no categories set (empty array, null, or undefined)
            if (!categories || categories.length === 0) {
              return true
            }
            // Include if this category is in the list
            const categoryIds = categories.map((c) => (typeof c === 'string' ? c : c.id))
            return categoryIds.includes(id)
          })

          return {
            id: attr.id,
            name: attr.name,
            level: attr.level,
            options: filteredOptions.map((opt) => ({
              id: opt.id,
              name: opt.name,
              slug: opt.slug,
            })),
          }
        }),
      )

      return Response.json({ attributes: attributesWithOptions })
    } catch (error) {
      console.error('Error fetching category attributes:', error)
      return Response.json({ error: 'Failed to fetch category attributes' }, { status: 500 })
    }
  },
}
