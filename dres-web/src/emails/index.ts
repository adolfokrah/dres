import { render } from '@react-email/components'
import { WelcomeEmail } from './WelcomeEmail'

export { WelcomeEmail }
export { EmailLayout } from './components/EmailLayout'

/**
 * Render the welcome email to HTML string
 */
export async function renderWelcomeEmail() {
  return render(WelcomeEmail())
}
