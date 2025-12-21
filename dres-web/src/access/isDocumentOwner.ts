import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

/**
 * Atomic access checker that verifies if the user owns the document being accessed.
 * Returns a Where query to filter documents by the user field.
 *
 * Admins have full access, authenticated users get filtered by user field,
 * and unauthenticated users are denied access.
 *
 * @returns true for admins, Where query for users, false for guests
 */
export const isDocumentOwner: Access = ({ req }) => {
  // Admin has full access
  if (req.user && checkRole(['admin'], req.user)) {
    return true
  }

  // Authenticated user - return Where query to filter by user
  if (req.user?.id) {
    return {
      user: {
        equals: req.user.id,
      },
    }
  }

  // Guest - no access
  return false
}
