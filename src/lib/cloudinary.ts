import { v2 as cloudinary, UploadApiResponse } from 'cloudinary'

/* ── Config (runs once per process) ──────────────────────────────────── */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
})

export interface UploadOpts {
  /** Cloudinary folder, e.g. "forestry/vendor-logos" */
  folder:        string
  /** Optional explicit public_id (without extension). Default: random. */
  publicId?:     string
  /** 'image' for normal images, 'raw' for PDFs / docs, 'auto' to detect. */
  resourceType?: 'image' | 'raw' | 'auto' | 'video'
  /** Optional transformation chain applied at upload time. */
  eager?:        Array<Record<string, any>>
}

/**
 * Upload a Buffer (typically from `file.arrayBuffer()`) to Cloudinary.
 * Returns the secure HTTPS URL — store that in the DB.
 */
export async function uploadToCloudinary(
  buffer: Buffer,
  opts:   UploadOpts,
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:        opts.folder,
        public_id:     opts.publicId,
        resource_type: opts.resourceType ?? 'image',
        eager:         opts.eager,
        overwrite:     true,
      },
      (err, result) => {
        if (err)     return reject(err)
        if (!result) return reject(new Error('Cloudinary returned no result'))
        resolve(result)
      },
    )
    stream.end(buffer)
  })
}

/**
 * Delete an asset by full secure URL or public_id.
 * Silently swallows "not found" errors so deletion is idempotent.
 */
export async function deleteFromCloudinary(urlOrPublicId: string): Promise<void> {
  if (!urlOrPublicId) return
  const publicId = urlOrPublicId.startsWith('http')
    ? extractPublicId(urlOrPublicId)
    : urlOrPublicId
  if (!publicId) return

  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true })
  } catch (err) {
    // Don't fail caller if asset is already gone.
    console.warn('[cloudinary.delete] failed for', publicId, err)
  }
}

/**
 * Extract the Cloudinary public_id from a secure URL.
 * Handles folders and version segments.
 *
 *   https://res.cloudinary.com/<cloud>/image/upload/v1234/forestry/avatars/abc.png
 *   → forestry/avatars/abc
 */
export function extractPublicId(url: string): string | null {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    const uploadIdx = parts.indexOf('upload')
    if (uploadIdx === -1) return null
    // Skip optional version segment v\d+
    let start = uploadIdx + 1
    if (parts[start] && /^v\d+$/.test(parts[start])) start += 1
    const tail = parts.slice(start).join('/')
    return tail.replace(/\.[a-z0-9]+$/i, '') // strip extension
  } catch {
    return null
  }
}

/**
 * Helper for routes that accept a `File` and just need the URL back.
 * Reduces boilerplate in 13 upload handlers.
 */
export async function uploadFileToCloudinary(
  file:    File,
  folder:  string,
  publicId?: string,
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const isImage = file.type.startsWith('image/')
  const result = await uploadToCloudinary(buffer, {
    folder,
    publicId,
    resourceType: isImage ? 'image' : 'raw',
  })
  return result.secure_url
}
