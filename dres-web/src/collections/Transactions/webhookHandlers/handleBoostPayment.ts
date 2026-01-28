import type { Payload } from 'payload'

interface PaystackChargeMetadata {
  styleId?: string
  tierId?: string
  tierDuration?: number | string
  [key: string]: unknown
}

/**
 * Handle successful boost payment - create StyleBoost
 *
 * This creates a StyleBoost record after a boost payment transaction is completed
 */
export async function handleBoostPayment(
  payload: Payload,
  transaction: {
    id: string
    transactionId: string
    user?: unknown
  },
  metadata?: PaystackChargeMetadata
) {
  const { transactionId } = transaction

  payload.logger.info(`🔔 handleBoostPayment: Processing boost payment ${transactionId}`)

  // Get style and tier info from metadata
  const styleId = metadata?.styleId as string | undefined
  const tierId = metadata?.tierId as string | undefined
  // Metadata values from Paystack come as strings, so parse to int
  const tierDuration = metadata?.tierDuration ? parseInt(String(metadata.tierDuration), 10) : undefined

  if (!styleId || !tierId) {
    payload.logger.error(`🔔 handleBoostPayment: Missing styleId or tierId in metadata`)
    return
  }

  // Get tier info if duration not in metadata or invalid
  let duration = tierDuration && !isNaN(tierDuration) ? tierDuration : undefined
  if (!duration) {
    const tier = await payload.findByID({
      collection: 'boost-tiers',
      id: tierId,
      depth: 0,
    })
    duration = tier?.duration as number || 7
  }

  // Calculate start and end dates
  const startDate = new Date()
  const endDate = new Date()
  endDate.setDate(endDate.getDate() + duration)

  // Create the StyleBoost
  const styleBoost = await payload.create({
    collection: 'style-boosts',
    data: {
      style: styleId,
      tier: tierId,
      status: 'active',
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      transaction: transaction.id,
      notes: `Boost activated via payment. Duration: ${duration} days.`,
    },
    overrideAccess: true,
  })

  payload.logger.info(`🔔 handleBoostPayment: StyleBoost created ${styleBoost.id} for style ${styleId}`)
}
