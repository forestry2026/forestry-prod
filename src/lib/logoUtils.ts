import { readFile } from 'fs/promises'
import { join }     from 'path'
import { existsSync } from 'fs'
import sharp         from 'sharp'

const MIME: Record<string, string> = {
  png:  'image/png',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif:  'image/gif',
  svg:  'image/svg+xml',
}

/**
 * Convert a logo URL into a base64 data URL.
 * Handles three sources:
 *   • Cloudinary / any remote https URL  → fetched and embedded
 *   • Local `/uploads/...` legacy paths  → read from public/
 *   • SVG (local or remote)               → rasterised to PNG via sharp
 *
 * Returns null if the asset cannot be loaded — callers fall back to a wordmark.
 */
export async function logoToDataUrl(logoUrl: string | null | undefined): Promise<string | null> {
  if (!logoUrl) return null
  const clean = logoUrl.split('?')[0]
  const isSvg = clean.toLowerCase().endsWith('.svg')
  const isRemote = clean.startsWith('http://') || clean.startsWith('https://')

  try {
    let buffer: Buffer
    let mime:   string

    if (isRemote) {
      const res = await fetch(clean)
      if (!res.ok) return null
      buffer = Buffer.from(await res.arrayBuffer())
      mime   = res.headers.get('content-type') ?? guessMimeFromUrl(clean)
    } else {
      const filePath = join(process.cwd(), 'public', clean)
      if (!existsSync(filePath)) return null
      buffer = await readFile(filePath)
      mime   = guessMimeFromUrl(clean)
    }

    if (isSvg || mime === 'image/svg+xml') {
      // jsPDF can't embed SVG — rasterise to PNG at high DPI.
      const pngBuffer = await sharp(buffer, { density: 300 }).png().toBuffer()
      return `data:image/png;base64,${pngBuffer.toString('base64')}`
    }

    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch (err) {
    console.warn('[logoToDataUrl] failed:', clean, (err as Error)?.message)
    return null
  }
}

function guessMimeFromUrl(url: string): string {
  const ext = url.split('.').pop()?.toLowerCase() ?? ''
  return MIME[ext] ?? 'image/jpeg'
}
