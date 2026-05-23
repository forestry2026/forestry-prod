import { prisma } from '@/lib/prisma'

/**
 * Server-side read of the admin-uploaded site logo URL.
 * Used by layouts to render the logo into the SSR HTML, eliminating the
 * "text fallback flash" caused by a client-side fetch on first paint.
 *
 * Cached per-request via Next.js fetch cache equivalent — Prisma query is
 * cheap, but if needed wrap with `unstable_cache` later.
 */
export async function getSiteLogo(): Promise<string | null> {
  try {
    const setting = await prisma.siteSetting.findUnique({ where: { key: 'logoUrl' } })
    return setting?.value ?? null
  } catch {
    return null
  }
}
