import type { CollectionBeforeLoginHook } from 'payload'
import { APIError } from 'payload'

/**
 * Before login hook - prevents non-active users from logging in
 */
export const beforeLogin: CollectionBeforeLoginHook = async ({ user }) => {
  // Check if user has an active account status
  const accountStatus = (user as any).accountStatus

  if (accountStatus === 'banned') {
    throw new APIError('Your account has been banned. Please contact support.', 403)
  }

  if (accountStatus === 'deleted') {
    throw new APIError('This account has been deleted.', 403)
  }

  if (accountStatus === 'to-be-archived') {
    throw new APIError('Your account is scheduled for deletion. Please contact support if you wish to reactivate it.', 403)
  }

  // Only allow active users (or users without status set, for backwards compatibility)
  if (accountStatus && accountStatus !== 'active') {
    throw new APIError('Your account is not active. Please contact support.', 403)
  }

  return user
}
