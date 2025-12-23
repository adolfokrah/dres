interface RemoveBgOptions {
  /** Image buffer to process */
  imageBuffer: Buffer
  /** Background color to use (default: white) */
  bgColor?: string
  /** Image size: 'preview' (up to 0.25 MP), 'full' (up to 25 MP), 'auto' */
  size?: 'preview' | 'full' | 'auto'
  /** Output format */
  format?: 'png' | 'jpg'
}

interface RemoveBgResult {
  success: boolean
  buffer?: Buffer
  error?: string
}

/**
 * Remove background from an image buffer using Remove.bg API
 * and replace with a white background
 * 
 * Requires REMOVE_BG_API_KEY environment variable
 */
export async function removeBackgroundFromBuffer(
  imageBuffer: Buffer,
  options?: {
    bgColor?: string
    size?: 'preview' | 'full' | 'auto'
    format?: 'png' | 'jpg'
  }
): Promise<RemoveBgResult> {
  const apiKey = process.env.REMOVE_BG_API_KEY

  if (!apiKey) {
    return {
      success: false,
      error: 'REMOVE_BG_API_KEY environment variable is not set',
    }
  }

  const { bgColor = 'FFFFFF', size = 'auto', format = 'png' } = options || {}

  try {
    // Send the raw image as binary data
    const response = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        image_file_b64: imageBuffer.toString('base64'),
        size: size,
        format: format,
        bg_color: bgColor,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        error: `Remove.bg API error: ${response.status} - ${JSON.stringify(errorData)}`,
      }
    }

    const resultBuffer = Buffer.from(await response.arrayBuffer())

    return {
      success: true,
      buffer: resultBuffer,
    }
  } catch (error) {
    return {
      success: false,
      error: `Failed to remove background: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

/**
 * Check if Remove.bg API is configured
 */
export function isRemoveBgConfigured(): boolean {
  return Boolean(process.env.REMOVE_BG_API_KEY)
}
