import type { GlobalAfterChangeHook } from 'payload'

import { revalidateTag } from 'next/cache'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    payload.logger.info(`Revalidating footer`)

    try {
      revalidateTag('global_footer')
    } catch (error) {
      // Silently skip revalidation when running outside Next.js request context (e.g., seed scripts)
      payload.logger.debug(`Skipping revalidateTag - not in Next.js context: ${error}`)
    }
  }

  return doc
}
