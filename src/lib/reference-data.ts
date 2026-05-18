/**
 * Cached fetchers for reference data (colors, textures, finishes, dimensions, categories).
 * These tables change rarely. Caching for 10 minutes saves a DB round-trip on most page loads.
 *
 * Cache is server-side (Vercel Data Cache) and shared across all visitors.
 * Invalidates after 10 min or when `revalidateReferenceData()` is called from a mutation.
 */
import { unstable_cache } from 'next/cache'
import { prisma }         from '@/lib/prisma'

const TTL = 60 * 10 // 10 minutes

export const getColors = unstable_cache(
  async () => prisma.color.findMany({ orderBy: { sortOrder: 'asc' } }),
  ['ref:colors'],
  { revalidate: TTL, tags: ['ref:colors'] },
)

export const getTextures = unstable_cache(
  async () => prisma.texture.findMany({ orderBy: { sortOrder: 'asc' } }),
  ['ref:textures'],
  { revalidate: TTL, tags: ['ref:textures'] },
)

export const getFinishes = unstable_cache(
  async () => prisma.finish.findMany({ orderBy: { sortOrder: 'asc' } }),
  ['ref:finishes'],
  { revalidate: TTL, tags: ['ref:finishes'] },
)

export const getDimensions = unstable_cache(
  async () => prisma.dimension.findMany({ orderBy: { sortOrder: 'asc' } }),
  ['ref:dimensions'],
  { revalidate: TTL, tags: ['ref:dimensions'] },
)

export const getCategories = unstable_cache(
  async () => prisma.category.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ['ref:categories'],
  { revalidate: TTL, tags: ['ref:categories'] },
)

/** Active-only variants — used by vendor-facing pages where inactive items should be hidden. */
export const getActiveColors = unstable_cache(
  async () => prisma.color.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ['ref:colors-active'],
  { revalidate: TTL, tags: ['ref:colors'] },
)

export const getActiveTextures = unstable_cache(
  async () => prisma.texture.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ['ref:textures-active'],
  { revalidate: TTL, tags: ['ref:textures'] },
)

export const getActiveFinishes = unstable_cache(
  async () => prisma.finish.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ['ref:finishes-active'],
  { revalidate: TTL, tags: ['ref:finishes'] },
)

export const getActiveDimensions = unstable_cache(
  async () => prisma.dimension.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ['ref:dimensions-active'],
  { revalidate: TTL, tags: ['ref:dimensions'] },
)

/**
 * Call from CRUD endpoints after a mutation so cached lists refresh.
 * Pass the tag matching what was changed: 'ref:colors', 'ref:textures', etc.
 *
 *   import { revalidateTag } from 'next/cache'
 *   revalidateTag('ref:colors')
 */
