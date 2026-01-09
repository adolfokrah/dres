import type { PayloadHandler } from 'payload'

export const getSiteSettings: PayloadHandler = async (req) => {
  const { payload } = req

  try {
    const settings = await payload.findGlobal({
      slug: 'site-settings',
    })

    return Response.json(settings)
  } catch (error) {
    console.error('Error fetching site settings:', error)
    // Return default settings if not found
    return Response.json({
      commissionRate: 10,
      buyerProtectionFeeRate: 10,
    })
  }
}
