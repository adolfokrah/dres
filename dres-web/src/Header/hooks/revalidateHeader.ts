import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateHeader: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating header`)

    try {
      revalidateTag('global_header')
    } catch (error) {
      // Silently skip revalidation when running outside Next.js request context (e.g., seed scripts)
      payload.logger.debug(`Skipping revalidateTag - not in Next.js context: ${error}`)
    }
  }

  return doc
}
