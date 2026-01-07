import type { Payload } from 'payload'

/**
 * Resolve a department identifier (ID or slug) to an ID
 * @param payload - Payload instance
 * @param identifier - Department ID or slug (e.g., "men", "women", or an ObjectId)
 * @returns Department ID or null if not found
 */
export async function resolveDepartmentId(
  payload: Payload,
  identifier: string | null | undefined,
): Promise<string | null> {
  if (!identifier) return null

  // Check if it looks like a MongoDB ObjectId (24 hex characters)
  const isObjectId = /^[a-f\d]{24}$/i.test(identifier)

  if (isObjectId) {
    // It's already an ID, return as-is
    return identifier
  }

  // It's a slug, look up the department
  try {
    // First try by slug field
    const result = await payload.find({
      collection: 'departments',
      where: {
        slug: {
          equals: identifier.toLowerCase(),
        },
      },
      limit: 1,
      depth: 0,
    })

    if (result.docs.length > 0) {
      return result.docs[0].id
    }

    // Fallback: try matching by name (case-insensitive using like)
    // This handles "men" matching "Men" or "women" matching "Women"
    const byName = await payload.find({
      collection: 'departments',
      where: {
        name: {
          like: identifier,
        },
      },
      limit: 1,
      depth: 0,
    })

    if (byName.docs.length > 0) {
      return byName.docs[0].id
    }

    // Final fallback: get all departments and do case-insensitive match
    const allDepts = await payload.find({
      collection: 'departments',
      limit: 100,
      depth: 0,
    })

    const matchedDept = allDepts.docs.find(
      (d: any) => d.name?.toLowerCase() === identifier.toLowerCase()
    )

    if (matchedDept) {
      return matchedDept.id
    }

    console.warn(`Department not found for identifier: ${identifier}`)
    return null
  } catch (error) {
    console.error('Error resolving department:', error)
    return null
  }
}
