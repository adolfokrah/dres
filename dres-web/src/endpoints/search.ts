import type { PayloadHandler } from 'payload'

interface SearchItem {
  id: string
  searchTitle: string
  query: string
  type: 'category' | 'style' | 'collection' | 'variation'
  slug?: string
  // Parent filter IDs for navigation
  departmentId?: string
  collectionId?: string
  categoryId?: string
}

/**
 * GET /api/search-items
 * Search for brands, categories, collections, styles, variations, and sellers based on query
 */
export const search: PayloadHandler = async (req) => {
  const { payload } = req
  const url = new URL(req.url || '', 'http://localhost')
  const query = url.searchParams.get('q')?.trim() || ''

  if (!query) {
    return Response.json({
      items: [],
      brands: [],
      sellers: [],
    })
  }

  try {
    // Search in parallel for better performance
    const [
      brandsResult,
      categoriesResult,
      collectionsResult,
      stylesResult,
      variationsResult,
      usersResult,
    ] = await Promise.all([
      // Search brands
      payload.find({
        collection: 'brands',
        where: {
          name: { contains: query },
        },
        limit: 5,
      }),
      // Search categories with collections populated
      payload.find({
        collection: 'categories',
        where: {
          category: { contains: query },
        },
        limit: 5,
        depth: 1,
      }),
      // Search collections with departments populated
      payload.find({
        collection: 'collections',
        where: {
          name: { contains: query },
        },
        limit: 5,
        depth: 1,
      }),
      // Search styles with category populated
      payload.find({
        collection: 'styles',
        where: {
          title: { contains: query },
        },
        limit: 5,
        depth: 1,
      }),
      // Search variations with style populated
      payload.find({
        collection: 'variations',
        where: {
          title: { contains: query },
        },
        limit: 5,
        depth: 1,
      }),
      // Search sellers/users
      payload.find({
        collection: 'users',
        where: {
          or: [
            { firstName: { contains: query } },
            { username: { contains: query } },
            { shopName: { contains: query } },
            { lastName: { contains: query } },
          ],
        },
        limit: 5,
        depth: 1,
      }),
    ])

    const items: SearchItem[] = []

    // Add categories - "Category in Department" → one result per department
    for (const cat of categoriesResult.docs) {
      const category = cat as any
      const departments = category.departments || []

      if (departments.length === 0) {
        // No departments, add without department filter
        items.push({
          id: category.id,
          searchTitle: category.category,
          query: category.category,
          type: 'category',
        })
      } else {
        // Create one result per department
        for (const department of departments) {
          const departmentName = typeof department === 'object' ? department?.name : null
          const departmentId = typeof department === 'object' ? department?.id : department
          const searchTitle = departmentName
            ? `${category.category} in ${departmentName}`
            : category.category

          items.push({
            id: category.id,
            searchTitle,
            query: category.category,
            type: 'category',
            departmentId: departmentId || undefined,
          })
        }
      }
    }

    // Add collections - "Collection in Department" → one result per department
    for (const col of collectionsResult.docs) {
      const collection = col as any
      const departments = collection.departments || []

      if (departments.length === 0) {
        // No departments, add without department filter
        items.push({
          id: collection.id,
          searchTitle: collection.name,
          query: collection.name,
          type: 'collection',
        })
      } else {
        // Create one result per department
        for (const department of departments) {
          const departmentName = typeof department === 'object' ? department?.name : null
          const departmentId = typeof department === 'object' ? department?.id : department
          const searchTitle = departmentName
            ? `${collection.name} in ${departmentName}`
            : collection.name

          items.push({
            id: collection.id,
            searchTitle,
            query: collection.name,
            type: 'collection',
            departmentId: departmentId || undefined,
          })
        }
      }
    }

    // Add styles - "Style in Category" → navigate with categoryId + query
    for (const style of stylesResult.docs) {
      const s = style as any
      const categoryObj = typeof s.category === 'object' ? s.category : null
      const categoryName = categoryObj?.category || null
      const categoryId = categoryObj?.id || (typeof s.category === 'string' ? s.category : null)
      const searchTitle = categoryName ? `${s.title} in ${categoryName}` : s.title

      items.push({
        id: s.id,
        searchTitle,
        query: s.title,
        type: 'style',
        slug: s.slug,
        categoryId: categoryId || undefined,
      })
    }

    // Add variations - just the title
    for (const variation of variationsResult.docs) {
      const v = variation as any

      items.push({
        id: v.id,
        searchTitle: v.title,
        query: v.title,
        type: 'variation',
        slug: v.slug,
      })
    }

    const brands = brandsResult.docs.map((brand) => ({
      id: brand.id,
      name: brand.name,
    }))

    const sellers = usersResult.docs.map((user: any) => ({
      id: user.id,
      name: user.name || user.shopName || user.username || '',
      username: user.username || null,
      avatar:
        user.photo && typeof user.photo === 'object' ? { url: user.photo.url } : null,
    }))

    return Response.json({
      items,
      brands,
      sellers,
    })
  } catch (error: any) {
    payload.logger.error(`Error searching: ${error}`)
    return Response.json({ error: 'Search failed' }, { status: 500 })
  }
}
