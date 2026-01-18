interface RemoveBgResult {
  success: boolean
  buffer?: Buffer
  error?: string
}

/**
 * Remove background from an image buffer using WaveSpeed.ai (preferred - $0.01/image),
 * Pixelcut API, or Remove.bg as fallbacks. Returns a transparent PNG by default.
 *
 * Env:
 * - WAVESPEED_API_KEY (preferred - cheapest at $0.01/image)
 * - PIXELCUT_API_KEY (fallback)
 * - REMOVE_BG_API_KEY (fallback - most expensive at $0.20/image)
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

  // Prefer WaveSpeed.ai if configured (cheapest at $0.01/image)
  const wavespeedKey = process.env.WAVESPEED_API_KEY
  if (wavespeedKey) {
    try {
      // WaveSpeed requires uploading to their media endpoint first
      // Endpoint: POST https://api.wavespeed.ai/api/v3/media/upload/binary
      const uploadForm = new FormData()
      const blob = new Blob([imageBuffer], { type: mimeType })
      uploadForm.append('file', blob, fileName)

      // First, upload the image to get a URL
      const uploadResponse = await fetch('https://api.wavespeed.ai/api/v3/media/upload/binary', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${wavespeedKey}`,
        },
        body: uploadForm,
      })

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}))
        return {
          success: false,
          error: `WaveSpeed upload error: ${uploadResponse.status} - ${JSON.stringify(errorData)}`,
        }
      }

      const uploadResult = await uploadResponse.json()
      // Response: { code: 200, data: { download_url: "...", type: "image", filename: "...", size: ... } }
      const imageUrl = uploadResult.data?.download_url || uploadResult.download_url

      if (!imageUrl) {
        return {
          success: false,
          error: `WaveSpeed upload failed: No URL returned. Response: ${JSON.stringify(uploadResult)}`,
        }
      }

      // Now call the background remover with the uploaded image URL
      const bgRemoveResponse = await fetch('https://api.wavespeed.ai/api/v3/wavespeed-ai/image-background-remover', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${wavespeedKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageUrl,
          enable_base64_output: false,
          enable_sync_mode: true, // Wait for result directly
        }),
      })

      if (!bgRemoveResponse.ok) {
        const errorData = await bgRemoveResponse.json().catch(() => ({}))
        return {
          success: false,
          error: `WaveSpeed API error: ${bgRemoveResponse.status} - ${JSON.stringify(errorData)}`,
        }
      }

      const result = await bgRemoveResponse.json()
      
      // Get the output URL from the response
      const outputUrl = result.data?.outputs?.[0] || result.outputs?.[0]
      
      if (!outputUrl) {
        // If sync mode didn't return result, we might need to poll
        const taskId = result.data?.id || result.id
        if (taskId) {
          // Poll for result
          const pollResult = await pollWaveSpeedResult(wavespeedKey, taskId)
          if (!pollResult.success) {
            return pollResult
          }
          // Download the result
          const imageResponse = await fetch(pollResult.url!)
          const resultBuffer = Buffer.from(await imageResponse.arrayBuffer())
          return { success: true, buffer: resultBuffer }
        }
        return {
          success: false,
          error: 'WaveSpeed API error: No output URL returned',
        }
      }

      // Download the result image
      const imageResponse = await fetch(outputUrl)
      const resultBuffer = Buffer.from(await imageResponse.arrayBuffer())
      return { success: true, buffer: resultBuffer }
    } catch (error) {
      return {
        success: false,
        error: `WaveSpeed request failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  // Fallback to Pixelcut if configured
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

  // Fallback to Remove.bg if configured (most expensive at $0.20/image)
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
    error: 'No background removal provider configured. Set WAVESPEED_API_KEY, PIXELCUT_API_KEY, or REMOVE_BG_API_KEY.',
  }
}

/**
 * Poll WaveSpeed API for task result
 */
async function pollWaveSpeedResult(
  apiKey: string,
  taskId: string,
  maxAttempts = 30,
  delayMs = 1000
): Promise<{ success: boolean; url?: string; error?: string }> {
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`https://api.wavespeed.ai/api/v3/predictions/${taskId}/result`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      return {
        success: false,
        error: `WaveSpeed poll error: ${response.status}`,
      }
    }

    const result = await response.json()
    const status = result.data?.status || result.status

    if (status === 'completed') {
      const outputUrl = result.data?.outputs?.[0] || result.outputs?.[0]
      if (outputUrl) {
        return { success: true, url: outputUrl }
      }
      return { success: false, error: 'WaveSpeed completed but no output URL' }
    }

    if (status === 'failed') {
      return {
        success: false,
        error: `WaveSpeed task failed: ${result.data?.error || result.error || 'Unknown error'}`,
      }
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, delayMs))
  }

  return {
    success: false,
    error: 'WaveSpeed task timed out',
  }
}

/**
 * Check if any background removal provider is configured
 */
export function isRemoveBgConfigured(): boolean {
  return Boolean(process.env.WAVESPEED_API_KEY || process.env.PIXELCUT_API_KEY || process.env.REMOVE_BG_API_KEY)
}
