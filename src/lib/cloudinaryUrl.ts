/**
 * Insert a Cloudinary transformation segment into a delivery URL so the
 * image is resized + quality-compressed before download.
 *
 * Pass-through for non-Cloudinary URLs.
 *
 *   https://res.cloudinary.com/foo/image/upload/v123/path/img.jpg
 *   →
 *   https://res.cloudinary.com/foo/image/upload/c_fit,w_400,h_400,q_auto:eco,f_auto/v123/path/img.jpg
 */
export function cloudinaryThumb(url: string | null | undefined, maxSide = 400): string | null {
  if (!url) return null
  if (!url.includes('res.cloudinary.com')) return url
  if (url.includes('/upload/c_')) return url // already transformed

  const tx = `c_fit,w_${maxSide},h_${maxSide},q_auto:eco,f_auto`
  return url.replace('/upload/', `/upload/${tx}/`)
}

/** Smaller thumbnail used for table row product images (22mm wide). */
export function cloudinaryRowThumb(url: string | null | undefined): string | null {
  return cloudinaryThumb(url, 300)
}

/** Logos render at ~38–60mm, but a 600px source is more than enough. */
export function cloudinaryLogo(url: string | null | undefined): string | null {
  return cloudinaryThumb(url, 600)
}
