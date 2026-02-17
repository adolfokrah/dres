const GRAPH_API_URL = 'https://graph.facebook.com/v21.0'

/**
 * Download media from WhatsApp by media ID
 * Returns a base64 data URL suitable for OpenAI vision
 */
export async function downloadWhatsAppMedia(mediaId: string): Promise<string> {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  if (!accessToken) throw new Error('WhatsApp access token not configured')

  // Step 1: Get the media URL
  const metaResponse = await fetch(`${GRAPH_API_URL}/${mediaId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!metaResponse.ok) {
    throw new Error(`Failed to get media URL: ${metaResponse.statusText}`)
  }

  const metaData = await metaResponse.json() as { url: string }

  // Step 2: Download the actual image
  const imageResponse = await fetch(metaData.url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!imageResponse.ok) {
    throw new Error(`Failed to download media: ${imageResponse.statusText}`)
  }

  const buffer = await imageResponse.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'

  return `data:${contentType};base64,${base64}`
}

export async function sendWhatsAppMessage(to: string, message: string): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN

  if (!phoneNumberId || !accessToken) {
    throw new Error('WhatsApp credentials not configured')
  }

  const response = await fetch(`${GRAPH_API_URL}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`WhatsApp API error: ${JSON.stringify(error)}`)
  }

  return true
}
