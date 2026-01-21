import type { CollectionAfterChangeHook } from 'payload'
import { renderWelcomeEmail } from '../../../emails'

/**
 * Send welcome email to new users after account creation
 */
export const sendWelcomeEmail: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  // Only send on create (new user registration)
  if (operation !== 'create') return doc

  // Skip if no email
  if (!doc.email) return doc

  // Skip if this is an OAuth user without email verification needed
  // (they already have a verified email from the OAuth provider)

  const { payload } = req

  try {
    // Render the welcome email
    const html = await renderWelcomeEmail()

    // Send the email using Payload's email adapter
    await payload.sendEmail({
      to: doc.email,
      subject: 'Welcome to Dres!',
      html,
    })

    payload.logger.info(`Welcome email sent to ${doc.email}`)
  } catch (error) {
    // Don't fail user creation if email fails
    payload.logger.error(`Failed to send welcome email to ${doc.email}: ${error}`)
  }

  return doc
}
