import type { CollectionBeforeChangeHook } from 'payload'

/**
 * Prevents creating duplicate attribute options with the same name
 * for the same attribute (case-insensitive).
 *
 * Uses `contains` query (case-insensitive in MongoDB) then does
 * an exact case-insensitive comparison in JS to avoid false positives.
 */
export const preventDuplicateOption: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data?.name || !data?.attribute) return data

  const attributeId = typeof data.attribute === 'object' ? data.attribute.id : data.attribute
  const name = data.name.trim()

  // Build query — use `contains` for case-insensitive search in MongoDB
  const where: Record<string, any> = {
    and: [
      { attribute: { equals: attributeId } },
      { name: { contains: name } },
    ],
  }

  // On update, exclude the current document
  if (operation === 'update' && originalDoc?.id) {
    where.and.push({ id: { not_equals: originalDoc.id } })
  }

  const existing = await req.payload.find({
    collection: 'attributeOptions',
    where,
    limit: 20,
    depth: 0,
    req,
  })

  // Case-insensitive exact match check in JS
  const duplicate = existing.docs.find(
    (doc) => (doc.name as string)?.trim().toLowerCase() === name.toLowerCase(),
  )

  if (duplicate) {
    throw new Error(`An option named "${name}" already exists for this attribute.`)
  }

  return data
}
