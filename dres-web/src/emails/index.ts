import { render } from '@react-email/components'
import { WelcomeEmail } from './WelcomeEmail'

export { WelcomeEmail }

/**
 * Render the welcome email to HTML string
 */
export async function renderWelcomeEmail(props: { firstName?: string; loginUrl?: string }) {
  return render(WelcomeEmail(props))
}
