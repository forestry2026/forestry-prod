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
 * Read a logo stored in public/ and return a base64 PNG data URL.
 * SVGs are rasterised to PNG via sharp (jsPDF addImage does not support SVG).
 * Returns null if file not found or unreadable.
 */
export async function logoToDataUrl(logoUrl: string | null | undefined): Promise<string | null> {
  if (!logoUrl) return null
  try {
    const cleanPath = logoUrl.split('?')[0]
    const filePath  = join(process.cwd(), 'public', cleanPath)
    if (!existsSync(filePath)) return null

    const isSvg = cleanPath.toLowerCase().endsWith('.svg')
    const buffer = await readFile(filePath)

    if (isSvg) {
      // Rasterise SVG → PNG at 2× resolution (good quality for PDF at 72–300 dpi)
      const pngBuffer = await sharp(buffer, { density: 300 })
        .png()
        .toBuffer()
      return `data:image/png;base64,${pngBuffer.toString('base64')}`
    }

    const ext  = cleanPath.split('.').pop()?.toLowerCase() ?? 'png'
    const mime = MIME[ext] ?? 'image/jpeg'
    return `data:${mime};base64,${buffer.toString('base64')}`
  } catch {
    return null
  }
}
