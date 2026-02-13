import type { PayloadHandler } from 'payload'
import OpenAI from 'openai'
import { getServerSideURL } from '../utilities/getURL'

/**
 * Generate product description from images using AI
 *
 * Usage: POST /api/generate-description
 * Body: {
 *   images: string[]  // Array of media IDs
 * }
 *
 * Returns: {
 *   description: string
 * }
 */
export const generateImageDescription: PayloadHandler = async (req) => {
  const { payload, user } = req

  // Check authentication
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.OPENAI_API_KEY) {
    return Response.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 })
  }

  try {
    const body = await req.json?.()
    const { images }: { images: string[] } = body || {}

    // Validate input
    if (!images || !Array.isArray(images) || images.length === 0) {
      return Response.json({ error: 'Images are required' }, { status: 400 })
    }

    payload.logger.info(
      `[GenerateDescription] Generating description for ${images.length} images`
    )

    // Fetch image URLs
    const imageUrls: string[] = []
    for (const imageId of images) {
      try {
        const media = await payload.findByID({
          collection: 'media',
          id: imageId,
        })

        if (media?.url) {
          const fullUrl = media.url.startsWith('http')
            ? media.url
            : `${getServerSideURL()}${media.url}`
          imageUrls.push(fullUrl)
        }
      } catch (error) {
        payload.logger.warn(`[GenerateDescription] Failed to fetch image ${imageId}`)
      }
    }

    if (imageUrls.length === 0) {
      return Response.json({ error: 'No valid images found' }, { status: 400 })
    }

    // Generate description using OpenAI Vision
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a fashion product description writer. Generate a concise, natural product description (2-3 sentences) based on the images provided. Include:
- What the item is
- Key visual details (color, style, notable features)
- Condition observations if visible

Keep it conversational and factual. Do not include pricing, sizing, or availability information.`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Analyze these product images and generate a description:',
            },
            ...imageUrls.map((url) => ({
              type: 'image_url' as const,
              image_url: { url },
            })),
          ],
        },
      ],
      max_tokens: 200,
    })

    const description = response.choices[0]?.message?.content?.trim() || ''

    if (!description) {
      return Response.json(
        { error: 'Failed to generate description' },
        { status: 500 }
      )
    }

    payload.logger.info(
      `[GenerateDescription] Successfully generated description (${description.length} chars)`
    )

    return Response.json({ description })
  } catch (error) {
    payload.logger.error(`[GenerateDescription] Error: ${error}`)
    return Response.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
}
