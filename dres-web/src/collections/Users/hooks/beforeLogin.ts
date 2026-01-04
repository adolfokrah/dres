import type { CollectionBeforeLoginHook } from 'payload'

/**
 * Before login hook - prevents non-active users from logging in
 */
export const beforeLogin: CollectionBeforeLoginHook = async ({ user }) => {
  // Check if user has an active account status
  const accountStatus = (user as any).accountStatus

  if (accountStatus === 'banned') {
    throw new Error('Your account has been banned. Please contact support.')
  }

  if (accountStatus === 'deleted') {
    throw new Error('This account has been deleted.')
  }

  if (accountStatus === 'to-be-archived') {
    throw new Error('Your account is scheduled for deletion. Please contact support if you wish to reactivate it.')
  }

  // Only allow active users (or users without status set, for backwards compatibility)
  if (accountStatus && accountStatus !== 'active') {
    throw new Error('Your account is not active. Please contact support.')
  }

  return user
}
