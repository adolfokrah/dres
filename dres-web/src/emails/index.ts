import { render } from '@react-email/components'
import { WelcomeEmail } from './WelcomeEmail'
import { OrderPlacedEmail } from './OrderPlacedEmail'
import type { FilteredProduct } from './WelcomeEmail'
import type { OrderPlacedEmailProps, OrderItem, ShippingDetails } from './OrderPlacedEmail'

export { WelcomeEmail, OrderPlacedEmail }
export { EmailLayout } from './components/EmailLayout'
export type { FilteredProduct, OrderPlacedEmailProps, OrderItem, ShippingDetails }

/**
 * Get the base URL for API calls
 * Uses internal URL for server-side calls, falls back to public URL
 */
function getApiBaseUrl(): string {
  // In development, use localhost
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }
  // In production, use the server URL
  return process.env.NEXT_PUBLIC_SERVER_URL || 'https://dres.app'
}

/**
 * Fetch on-sale products for email
 */
async function fetchOnSaleProducts(): Promise<FilteredProduct[]> {
  const apiUrl = getApiBaseUrl()
  console.log('Fetching on-sale products from:', `${apiUrl}/api/variations/filtered?filterType=on-sale&limit=6`)

  try {
    const response = await fetch(`${apiUrl}/api/variations/filtered?filterType=on-sale&limit=6`)
    if (!response.ok) {
      console.error('Failed to fetch on-sale products:', response.status, response.statusText)
      return []
    }
    const data = await response.json()
    console.log('Fetched on-sale products:', data.variations?.length || 0, 'products')
    return data.variations || []
  } catch (error) {
    console.error('Error fetching on-sale products:', error)
    return []
  }
}

/**
 * Render the welcome email to HTML string
 */
export async function renderWelcomeEmail() {
  const saleProducts = await fetchOnSaleProducts()
  return render(WelcomeEmail({ saleProducts }))
}

/**
 * Render the order placed email to HTML string
 */
export async function renderOrderPlacedEmail(props: OrderPlacedEmailProps) {
  return await render(OrderPlacedEmail(props))
}
