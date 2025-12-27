import type { PayloadHandler } from 'payload'

/**
 * GET /api/menu
 * 
 * Fetches the navigation menu structure by querying categories
 * and organizing them by department -> collection -> categories
 */
export const getMenu: PayloadHandler = async (req) => {
  const { payload } = req

  try {
    // Fetch all categories with their relationships
    const categoriesResult = await payload.find({
      collection: 'categories',
      depth: 2, // Get full department and collection objects
      pagination: false,
      sort: 'category',
    })

    // Organize categories by department -> collection
    const menuMap = new Map<string, any>()

    categoriesResult.docs.forEach((category: any) => {
      // Get departments array
      const departments = Array.isArray(category.departments) ? category.departments : []
      // Get collections array (note: it's plural)
      const collections = Array.isArray(category.collections) ? category.collections : []
      
      departments.forEach((dept: any) => {
        const deptId = typeof dept === 'string' ? dept : dept?.id
        const deptName = typeof dept === 'string' ? dept : dept?.name
        const deptSlug = typeof dept === 'object' ? dept?.slug : null
        
        // Create department if it doesn't exist
        if (!menuMap.has(deptId)) {
          menuMap.set(deptId, {
            id: deptId,
            name: deptName,
            slug: deptSlug,
            collections: new Map<string, any>()
          })
        }

        const department = menuMap.get(deptId)!
        
        // Process each collection for this category
        collections.forEach((collection: any) => {
          const collectionId = typeof collection === 'string' ? collection : collection?.id
          const collectionName = typeof collection === 'string' ? collection : collection?.name
          const collectionSlug = typeof collection === 'object' ? collection?.slug : null
          
          if (collectionId) {
            // Create collection if it doesn't exist
            if (!department.collections.has(collectionId)) {
              department.collections.set(collectionId, {
                id: collectionId,
                name: collectionName,
                slug: collectionSlug,
                categories: []
              })
            }

            // Add category to collection
            const coll = department.collections.get(collectionId)!
            coll.categories.push({
              id: category.id,
              name: category.category, // Field is called 'category' not 'name'
              slug: category.slug,
            })
          }
        })
      })
    })

    // Convert maps to arrays
    const menu = Array.from(menuMap.values()).map(dept => ({
      id: dept.id,
      name: dept.name,
      slug: dept.slug,
      collections: Array.from(dept.collections.values())
    }))

    return Response.json({
      menu,
      totalCategories: categoriesResult.totalDocs,
    })
  } catch (error) {
    payload.logger.error(`Error fetching menu: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return Response.json(
      {
        error: 'Failed to fetch menu',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
