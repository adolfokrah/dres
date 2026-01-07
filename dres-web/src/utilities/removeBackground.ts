interface RemoveBgResult {
  success: boolean
  buffer?: Buffer
  error?: string
}

/**
 * Remove background from an image buffer using Pixelcut API (preferred)
 * or Remove.bg as a fallback. Returns a transparent PNG by default.
 *
 * Env:
 * - PIXELCUT_API_KEY (preferred)
 * - REMOVE_BG_API_KEY (fallback)
 */
export async function removeBackgroundFromBuffer(
  imageBuffer: Buffer,
  options?: {
    /** Background color hint (only used by remove.bg fallback) */
    bgColor?: string
    /** Desired output format (PNG recommended) */
    format?: 'png' | 'jpg'
    /** Optional filename/mimetype to send to provider */
    fileName?: string
    mimeType?: string
  }
): Promise<RemoveBgResult> {
  const { bgColor, format = 'png', fileName = 'upload.png', mimeType = 'image/png' } = options || {}

  // Prefer Pixelcut if configured
  const pixelcutKey = process.env.PIXELCUT_API_KEY
  if (pixelcutKey) {
    try {
      const form = new FormData()
      // Many providers expect 'image' or 'image_file'; Pixelcut accepts multipart per docs
      const blob = new Blob([imageBuffer], { type: mimeType })
      form.append('image', blob, fileName)
      // Explicit format: Pixelcut currently supports png output
      form.append('format', 'png')

      const response = await fetch('https://api.developer.pixelcut.ai/v1/remove-background', {
        method: 'POST',
        headers: {
          'X-API-KEY': pixelcutKey,
          'Accept': 'image/*',
          // Do NOT set Content-Type manually; fetch will add the boundary
        },
        body: form,
      })

      if (!response.ok) {
        // Try to read JSON error if available
        let details: any = null
        try { details = await response.json() } catch {}
        return {
          success: false,
          error: `Pixelcut API error: ${response.status}${details ? ' - ' + JSON.stringify(details) : ''}`,
        }
      }

      const resultBuffer = Buffer.from(await response.arrayBuffer())
      return { success: true, buffer: resultBuffer }
    } catch (error) {
      return {
        success: false,
        error: `Pixelcut request failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  // Fallback to Remove.bg if configured
  const removeBgKey = process.env.REMOVE_BG_API_KEY
  if (removeBgKey) {
    try {
      const params: Record<string, string> = {
        image_file_b64: imageBuffer.toString('base64'),
        size: 'auto',
        format: format,
      }
      if (bgColor) params.bg_color = bgColor

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': removeBgKey,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams(params),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        return {
          success: false,
          error: `Remove.bg API error: ${response.status} - ${JSON.stringify(errorData)}`,
        }
      }

      const resultBuffer = Buffer.from(await response.arrayBuffer())
      return { success: true, buffer: resultBuffer }
    } catch (error) {
      return {
        success: false,
        error: `Remove.bg request failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  return {
    success: false,
    error: 'No background removal provider configured. Set PIXELCUT_API_KEY or REMOVE_BG_API_KEY.',
  }
}

/**
 * Check if any background removal provider is configured
 */
export function isRemoveBgConfigured(): boolean {
  return Boolean(process.env.PIXELCUT_API_KEY || process.env.REMOVE_BG_API_KEY)
}
