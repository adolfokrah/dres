import type { PayloadHandler } from 'payload'
import OpenAI from 'openai'
import { sendWhatsAppMessage, downloadWhatsAppMedia } from '../../utilities/whatsapp'
import { DRES_MERCHANT_SYSTEM_PROMPT } from '../../utilities/dresMerchantDocs'

/**
 * GET /api/whatsapp/webhook
 * Meta webhook verification handshake
 */
export const verifyWebhook: PayloadHandler = async (req) => {
  const url = new URL(req.url || '', 'http://localhost')
  const mode = url.searchParams.get('hub.mode')
  const token = url.searchParams.get('hub.verify_token')
  const challenge = url.searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    req.payload.logger.info('[WhatsApp] Webhook verified successfully')
    return new Response(challenge, { status: 200 })
  }

  return Response.json({ error: 'Verification failed' }, { status: 403 })
}

/**
 * POST /api/whatsapp/webhook
 * Receives incoming WhatsApp messages and responds with AI
 */
export const handleWhatsAppMessage: PayloadHandler = async (req) => {
  const { payload } = req

  try {
    const body = await req.json?.()

    // WhatsApp sends a verification ping on setup — just acknowledge
    if (!body?.entry?.[0]?.changes?.[0]?.value?.messages) {
      return Response.json({ status: 'ok' }, { status: 200 })
    }

    const change = body.entry[0].changes[0].value
    const message = change.messages[0]
    const senderPhone = message.from

    if (message.type === 'text') {
      const userMessage = message.text.body
      payload.logger.info(`[WhatsApp] Text from ${senderPhone}: ${userMessage}`)

      processAndReply(senderPhone, userMessage, undefined, payload).catch((err) =>
        payload.logger.error(`[WhatsApp] Processing error: ${err}`),
      )
    } else if (message.type === 'image') {
      const mediaId = message.image.id
      const caption = message.image.caption || ''
      payload.logger.info(`[WhatsApp] Image from ${senderPhone} (media: ${mediaId}, caption: "${caption}")`)

      processAndReply(senderPhone, caption, mediaId, payload).catch((err) =>
        payload.logger.error(`[WhatsApp] Image processing error: ${err}`),
      )
    } else {
      sendWhatsAppMessage(
        senderPhone,
        "Hi! I can read text messages and images. Please send a text question or a product photo and I'll help you out!",
      ).catch((err) => payload.logger.error(`[WhatsApp] Send error: ${err}`))
    }

    // Return 200 immediately (Meta requires response within 5 seconds)
    return Response.json({ status: 'ok' }, { status: 200 })
  } catch (error) {
    payload.logger.error(`[WhatsApp] Webhook error: ${error}`)
    return Response.json({ status: 'ok' }, { status: 200 })
  }
}

async function processAndReply(
  phone: string,
  userMessage: string,
  imageMediaId: string | undefined,
  payload: any,
): Promise<void> {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
      {
        role: 'system',
        content: DRES_MERCHANT_SYSTEM_PROMPT,
      },
    ]

    if (imageMediaId) {
      // Download image and send with vision
      const imageDataUrl = await downloadWhatsAppMedia(imageMediaId)

      const content: OpenAI.Chat.Completions.ChatCompletionContentPart[] = [
        {
          type: 'image_url',
          image_url: { url: imageDataUrl, detail: 'low' },
        },
      ]

      if (userMessage) {
        content.push({ type: 'text', text: userMessage })
      } else {
        content.push({
          type: 'text',
          text: 'The user sent this product image. Help them with listing it on DRES — suggest a category, give photo tips, or answer any questions about selling this item.',
        })
      }

      messages.push({ role: 'user', content })
    } else {
      messages.push({ role: 'user', content: userMessage })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 500,
      messages,
    })

    const aiReply = response.choices[0]?.message?.content || "Sorry, I couldn't process your question. Please try again!"

    await sendWhatsAppMessage(phone, aiReply)

    payload.logger.info(`[WhatsApp] Replied to ${phone}`)
  } catch (error) {
    payload.logger.error(`[WhatsApp] AI/send error for ${phone}: ${error}`)

    await sendWhatsAppMessage(
      phone,
      "Sorry, I'm having trouble right now. Please try again in a moment!",
    ).catch(() => {})
  }
}
