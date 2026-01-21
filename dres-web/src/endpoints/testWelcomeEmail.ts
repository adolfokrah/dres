import type { PayloadHandler } from 'payload'
import { renderWelcomeEmail } from '../emails'

/**
 * Test endpoint for welcome email
 * GET /api/test-welcome-email - Returns HTML preview
 * POST /api/test-welcome-email - Sends email to specified address
 */
export const testWelcomeEmail: PayloadHandler = async (req) => {
  const { payload } = req

  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return Response.json({ error: 'Not available in production' }, { status: 403 })
  }

  try {
    // Render the email
    const html = await renderWelcomeEmail()

    // GET request - return HTML preview
    if (req.method === 'GET') {
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' },
      })
    }

    // POST request - send email
    if (req.method === 'POST') {
      const body = await req.json?.()
      const email = body?.email

      if (!email) {
        return Response.json({ error: 'Email address required' }, { status: 400 })
      }

      try {
        const result = await payload.sendEmail({
          to: email,
          subject: 'Welcome to Dres! (Test)',
          html,
        })
        payload.logger.info({ msg: 'Email send result', result })
        return Response.json({ success: true, message: `Test email sent to ${email}` })
      } catch (sendError: unknown) {
        payload.logger.error({ msg: 'Failed to send email', error: sendError })
        return Response.json(
          {
            error: 'Failed to send email',
            details: sendError instanceof Error ? sendError.message : String(sendError),
          },
          { status: 500 },
        )
      }
    }

    return Response.json({ error: 'Method not allowed' }, { status: 405 })
  } catch (error) {
    payload.logger.error({ msg: 'Error in test welcome email', error })
    return Response.json(
      { error: 'Failed to process email', details: String(error) },
      { status: 500 },
    )
  }
}
