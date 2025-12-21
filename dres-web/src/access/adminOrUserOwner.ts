import type { Access } from 'payload'

import { checkRole } from '@/access/utilities'

export const adminOrUserOwner: Access = ({ req: { user } }) => {
  if (user && checkRole(['admin'], user)) {
    return true
  }

  if (user?.id) {
    return {
      user: {
        equals: user.id,
      },
    }
  }

  return false
}
