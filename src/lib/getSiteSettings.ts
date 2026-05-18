import { prisma } from '@/lib/prisma'

/** Returns the current logo URL stored in SiteSetting, or null. */
export async function getLogoUrl(): Promise<string | null> {
  try {
    const s = await prisma.siteSetting.findUnique({ where: { key: 'logoUrl' } })
    return s?.value ?? null
  } catch {
    return null
  }
}
