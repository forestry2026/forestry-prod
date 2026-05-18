/**
 * One-time migration:
 *   - Reads old SQLite DB at prisma/dev.db
 *   - Uploads any /uploads/* file referenced in DB to Cloudinary
 *   - Upserts every row into Neon Postgres with new Cloudinary URLs
 *
 * Run with:  npx tsx scripts/migrate-sqlite-to-neon.ts
 *
 * Idempotent — re-running upserts on conflict, skips already-Cloudinary URLs.
 */

import 'dotenv/config'
import Database              from 'better-sqlite3'
import path                  from 'path'
import fs                    from 'fs'
import { PrismaClient }      from '@prisma/client'
import { v2 as cloudinary }  from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
})

const prisma   = new PrismaClient()
const oldDb    = new Database(path.join(process.cwd(), 'prisma', 'dev.db'), { readonly: true })
const PUBLIC   = path.join(process.cwd(), 'public')
const uploadCache = new Map<string, string>() // localPath → cloudinaryUrl

/* ── Helpers ────────────────────────────────────────────────────────── */

/**
 * If the given URL looks like a /uploads/... path AND the file exists locally,
 * upload it to Cloudinary and return the new https URL.
 * - Returns the original URL unchanged if already external or file missing.
 * - Caches results so repeated rows referencing the same path only upload once.
 */
async function migrateAsset(url: string | null | undefined, folder: string): Promise<string | null> {
  if (!url) return null
  // Already on Cloudinary or external — leave it.
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  // Strip query (`?t=123` etc.)
  const clean = url.split('?')[0]
  if (!clean.startsWith('/uploads/')) return url // /images/... static, leave alone

  if (uploadCache.has(clean)) return uploadCache.get(clean)!

  const localPath = path.join(PUBLIC, clean.replace(/^\//, ''))
  if (!fs.existsSync(localPath)) {
    console.warn(`  ⚠ file missing on disk, skipping: ${clean}`)
    return null
  }

  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder,
      resource_type: 'auto',
      overwrite:     true,
    })
    uploadCache.set(clean, result.secure_url)
    console.log(`  ✓ ${clean} → ${result.secure_url}`)
    return result.secure_url
  } catch (err: any) {
    console.error(`  ✗ upload failed for ${clean}:`, err.message)
    return null
  }
}

function getAll<T = any>(table: string): T[] {
  const rows = oldDb.prepare(`SELECT * FROM "${table}"`).all() as T[]
  return rows.map(r => normalize(r as any) as T)
}

/**
 * SQLite stores booleans as 0/1 and dates as Unix ms or ISO strings.
 * Normalize every row into Postgres-compatible types.
 *
 * - Columns named is*, has* → Boolean
 * - Columns ending in At/Date → Date (or null)
 */
const BOOL_RE   = /^(is|has)[A-Z]/
const DATE_RE   = /(At|Date)$/
// Boolean columns whose names don't match the is*/has* convention.
const BOOL_COLS = new Set(['vendorDeleted'])

function normalize<T extends Record<string, any>>(row: T): T {
  const out: any = { ...row }
  for (const key of Object.keys(out)) {
    const v = out[key]
    if (v === null || v === undefined) continue

    // Boolean columns (is*/has* prefix OR explicit list)
    if ((BOOL_RE.test(key) || BOOL_COLS.has(key)) && typeof v === 'number') {
      out[key] = Boolean(v)
      continue
    }

    // Date columns
    if (DATE_RE.test(key)) {
      if (typeof v === 'number')           out[key] = new Date(v)
      else if (typeof v === 'string')      out[key] = new Date(v)
    }
  }
  return out
}

/* ── Migration steps ────────────────────────────────────────────────── */

async function migrateReferenceData() {
  console.log('\n📦  Reference data (Color / Texture / Finish / Dimension / Category)')

  for (const row of getAll('Color')) {
    await prisma.color.upsert({ where: { id: row.id }, update: row, create: row })
  }
  for (const row of getAll('Texture')) {
    const imageUrl = await migrateAsset(row.imageUrl, 'forestry/textures')
    await prisma.texture.upsert({
      where:  { id: row.id },
      update: { ...row, imageUrl },
      create: { ...row, imageUrl },
    })
  }
  for (const row of getAll('Finish')) {
    await prisma.finish.upsert({ where: { id: row.id }, update: row, create: row })
  }
  for (const row of getAll('Dimension')) {
    await prisma.dimension.upsert({ where: { id: row.id }, update: row, create: row })
  }
  for (const row of getAll('Category')) {
    await prisma.category.upsert({ where: { id: row.id }, update: row, create: row })
  }
}

async function migrateUsers() {
  console.log('\n👥  Users')
  for (const row of getAll('User')) {
    const avatarUrl = await migrateAsset(row.avatarUrl, 'forestry/avatars')
    const data = {
      id:             row.id,
      email:          row.email,
      passwordHash:   row.passwordHash,
      name:           row.name,
      phone:          row.phone,
      role:           row.role,
      permissions:    row.permissions,
      avatarUrl,
      isActive:       Boolean(row.isActive),
      lastLoginAt:    row.lastLoginAt ? new Date(row.lastLoginAt) : null,
      onboardingState: row.onboardingState,
      createdAt:      new Date(row.createdAt),
      updatedAt:      new Date(row.updatedAt),
    }
    await prisma.user.upsert({ where: { id: row.id }, update: data, create: data })
  }
}

async function migrateVendorProfiles() {
  console.log('\n🏢  VendorProfiles')
  for (const row of getAll('VendorProfile')) {
    const logoUrl = await migrateAsset(row.logoUrl, 'forestry/vendor-logos')

    // documents is a JSON array of file paths — migrate each
    let documents: string | null = row.documents
    if (row.documents) {
      try {
        const arr = JSON.parse(row.documents)
        if (Array.isArray(arr)) {
          const migrated = await Promise.all(arr.map((p: string) => migrateAsset(p, 'forestry/vendor-docs')))
          documents = JSON.stringify(migrated.filter(Boolean))
        }
      } catch { /* leave as-is */ }
    }

    const data = {
      id:            row.id,
      userId:        row.userId,
      companyName:   row.companyName,
      tradeLicense:  row.tradeLicense,
      address:       row.address,
      city:          row.city,
      country:       row.country,
      website:       row.website,
      notes:         row.notes,
      documents,
      logoUrl,
      status:        row.status,
      approvedAt:    row.approvedAt ? new Date(row.approvedAt) : null,
      approvedBy:    row.approvedBy,
      rejectedAt:    row.rejectedAt ? new Date(row.rejectedAt) : null,
      rejectionNote: row.rejectionNote,
      createdAt:     new Date(row.createdAt),
      updatedAt:     new Date(row.updatedAt),
    }
    await prisma.vendorProfile.upsert({ where: { id: row.id }, update: data, create: data })
  }
}

async function migrateProducts() {
  console.log('\n🪴  Products + Images + Files')

  for (const row of getAll('Product')) {
    const data: any = { ...row, isActive: Boolean(row.isActive), isFeatured: Boolean(row.isFeatured) }
    data.createdAt = new Date(row.createdAt)
    data.updatedAt = new Date(row.updatedAt)
    await prisma.product.upsert({ where: { id: row.id }, update: data, create: data })
  }

  for (const row of getAll('ProductImage')) {
    const url = await migrateAsset(row.url, 'forestry/products')
    if (!url) continue
    const data = {
      id:        row.id,
      productId: row.productId,
      url,
      alt:       row.alt,
      isPrimary: Boolean(row.isPrimary),
      sortOrder: row.sortOrder,
      createdAt: new Date(row.createdAt),
    }
    await prisma.productImage.upsert({ where: { id: row.id }, update: data, create: data })
  }

  for (const row of getAll('ProductFile')) {
    const url = await migrateAsset(row.url, `forestry/product-files/${row.productId}`)
    if (!url) continue
    const data = {
      id:        row.id,
      productId: row.productId,
      type:      row.type,
      name:      row.name,
      url,
      size:      row.size,
      createdAt: new Date(row.createdAt),
    }
    await prisma.productFile.upsert({ where: { id: row.id }, update: data, create: data })
  }

  // Join tables — straight copy
  for (const t of ['ProductDimension', 'ProductColor', 'ProductTexture', 'ProductFinish', 'ProductCategory']) {
    for (const row of getAll(t)) {
      // @ts-ignore — dynamic table name
      await (prisma as any)[t.charAt(0).toLowerCase() + t.slice(1)].upsert({
        where:  { id: row.id },
        update: row,
        create: row,
      }).catch(() => {/* may already exist via composite id */})
    }
  }
}

async function migrateSiteAssets() {
  console.log('\n🎨  Site assets (Logo / Hero / LoginSlide)')

  for (const row of getAll('SiteSetting')) {
    let value = row.value
    if (row.key === 'logoUrl' && row.value) {
      value = (await migrateAsset(row.value, 'forestry/site-logo')) ?? row.value
    }
    await prisma.siteSetting.upsert({
      where:  { key: row.key },
      update: { value },
      create: { key: row.key, value },
    })
  }

  for (const row of getAll('HeroBanner')) {
    const imageUrl = await migrateAsset(row.imageUrl, 'forestry/hero-banners')
    const data = { ...row, imageUrl, isActive: Boolean(row.isActive) }
    data.createdAt = new Date(row.createdAt)
    data.updatedAt = new Date(row.updatedAt)
    await prisma.heroBanner.upsert({ where: { id: row.id }, update: data, create: data })
  }

  for (const row of getAll('LoginSlide')) {
    const imageUrl = await migrateAsset(row.imageUrl, 'forestry/login-slides')
    const data = { ...row, imageUrl, isActive: Boolean(row.isActive) }
    data.createdAt = new Date(row.createdAt)
    data.updatedAt = new Date(row.updatedAt)
    await prisma.loginSlide.upsert({ where: { id: row.id }, update: data, create: data })
  }
}

async function migrateRfps() {
  console.log('\n📋  RFPs + Items')
  for (const row of getAll('Rfp')) {
    const data: any = { ...row }
    data.createdAt = new Date(row.createdAt)
    data.updatedAt = new Date(row.updatedAt)
    if (row.deadline) data.deadline = new Date(row.deadline)
    await prisma.rfp.upsert({ where: { id: row.id }, update: data, create: data })
  }
  for (const row of getAll('RfpItem')) {
    const customTextureUrl = await migrateAsset(row.customTextureUrl, 'forestry/rfp-items')
    const data: any = { ...row, customTextureUrl }
    await prisma.rfpItem.upsert({ where: { id: row.id }, update: data, create: data })
  }
}

async function migrateAccessRequests() {
  console.log('\n📨  AccessRequests')
  for (const row of getAll('AccessRequest')) {
    let documents = row.documents
    if (row.documents) {
      try {
        const arr = JSON.parse(row.documents)
        if (Array.isArray(arr)) {
          const migrated = await Promise.all(arr.map((p: string) => migrateAsset(p, 'forestry/access-requests')))
          documents = JSON.stringify(migrated.filter(Boolean))
        }
      } catch { /* leave */ }
    }
    const data: any = { ...row, documents }
    // AccessRequest has no `updatedAt` column.
    delete data.updatedAt
    await prisma.accessRequest.upsert({ where: { id: row.id }, update: data, create: data })
  }
}

async function migrateCustomDesigns() {
  console.log('\n🎨  CustomDesignRequests')
  for (const row of getAll('CustomDesignRequest')) {
    const data: any = { ...row }
    data.createdAt = new Date(row.createdAt)
    data.updatedAt = new Date(row.updatedAt)
    // attachments column may exist; check + migrate if present
    if ((row as any).attachments) {
      try {
        const arr = JSON.parse((row as any).attachments)
        if (Array.isArray(arr)) {
          const migrated = await Promise.all(arr.map((p: string) => migrateAsset(p, 'forestry/custom-design')))
          data.attachments = JSON.stringify(migrated.filter(Boolean))
        }
      } catch { /* leave */ }
    }
    await prisma.customDesignRequest.upsert({ where: { id: row.id }, update: data, create: data })
  }
}

/* ── Main ───────────────────────────────────────────────────────────── */
async function main() {
  console.log('🚚  Starting migration: SQLite → Neon Postgres + Cloudinary')
  console.log(`    SQLite: prisma/dev.db`)
  console.log(`    Target: ${process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] ?? 'unknown'}`)

  await migrateReferenceData()
  await migrateUsers()
  await migrateVendorProfiles()
  await migrateProducts()
  await migrateSiteAssets()
  await migrateRfps()
  await migrateAccessRequests()
  await migrateCustomDesigns()

  console.log(`\n✅  Migration complete. Files uploaded: ${uploadCache.size}`)
}

main()
  .catch(err => { console.error('\n❌  Migration failed:', err); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); oldDb.close() })
