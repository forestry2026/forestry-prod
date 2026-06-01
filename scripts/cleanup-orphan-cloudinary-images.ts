/**
 * One-off cleanup: delete Cloudinary `forestry/products` assets that are
 * no longer referenced by any DB row.
 *
 * Background: until commit be28ce8 the CMS would orphan a Cloudinary
 * asset whenever a product / image was deleted or replaced. This script
 * reconciles the on-disk state with the DB.
 *
 * Default is DRY RUN (lists orphans but deletes nothing). Pass --commit
 * (or COMMIT=1) to actually delete.
 *
 * Usage:
 *   npx tsx scripts/cleanup-orphan-cloudinary-images.ts           # dry run
 *   npx tsx scripts/cleanup-orphan-cloudinary-images.ts --commit  # delete
 *
 * Env required: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY,
 *               CLOUDINARY_API_SECRET, DATABASE_URL.
 */

import { v2 as cloudinary } from 'cloudinary'
import { PrismaClient } from '@prisma/client'
import { extractPublicId } from '../src/lib/cloudinary'

const FOLDER = 'forestry/products'

const COMMIT =
  process.argv.includes('--commit') || process.env.COMMIT === '1'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
})

const prisma = new PrismaClient()

interface CloudinaryAsset {
  public_id:  string
  secure_url: string
  bytes:      number
}

async function listAllAssets(): Promise<CloudinaryAsset[]> {
  const all: CloudinaryAsset[] = []
  let nextCursor: string | undefined
  let page = 0
  do {
    page++
    const res: any = await cloudinary.api.resources({
      type:        'upload',
      prefix:      FOLDER,
      max_results: 500,
      next_cursor: nextCursor,
    })
    for (const r of res.resources) {
      all.push({
        public_id:  r.public_id,
        secure_url: r.secure_url,
        bytes:      r.bytes ?? 0,
      })
    }
    nextCursor = res.next_cursor
    process.stdout.write(
      `  page ${page}: +${res.resources.length} (total ${all.length})\n`,
    )
  } while (nextCursor)
  return all
}

async function main() {
  console.log(`Cloudinary orphan cleanup — folder: ${FOLDER}`)
  console.log(`Mode: ${COMMIT ? 'COMMIT (will delete)' : 'DRY RUN'}\n`)

  console.log('Loading Cloudinary assets…')
  const assets = await listAllAssets()
  console.log(`  total assets in folder: ${assets.length}\n`)

  console.log('Loading DB ProductImage URLs…')
  const rows = await prisma.productImage.findMany({ select: { url: true } })
  console.log(`  total ProductImage rows:    ${rows.length}`)

  const referencedPublicIds = new Set<string>()
  for (const r of rows) {
    const pid = extractPublicId(r.url)
    if (pid) referencedPublicIds.add(pid)
  }
  console.log(`  unique referenced ids:      ${referencedPublicIds.size}\n`)

  const orphans = assets.filter(a => !referencedPublicIds.has(a.public_id))
  const orphanBytes = orphans.reduce((sum, a) => sum + a.bytes, 0)

  console.log(`Orphans found: ${orphans.length}  (~${(orphanBytes / 1024 / 1024).toFixed(2)} MB)`)
  if (orphans.length === 0) {
    console.log('Nothing to clean. ✅')
    await prisma.$disconnect()
    return
  }

  // Sample preview
  console.log('\nSample (first 10 orphans):')
  for (const a of orphans.slice(0, 10)) {
    console.log(`  - ${a.public_id}  (${(a.bytes / 1024).toFixed(1)} KB)`)
  }
  if (orphans.length > 10) console.log(`  …and ${orphans.length - 10} more`)

  if (!COMMIT) {
    console.log('\nDry run complete. Re-run with --commit to delete.')
    await prisma.$disconnect()
    return
  }

  console.log('\nDeleting…')
  let deleted = 0
  let failed  = 0
  // delete_resources accepts up to 100 public_ids per call
  for (let i = 0; i < orphans.length; i += 100) {
    const batch = orphans.slice(i, i + 100).map(a => a.public_id)
    try {
      const res: any = await cloudinary.api.delete_resources(batch, {
        type:          'upload',
        resource_type: 'image',
        invalidate:    true,
      })
      for (const pid of batch) {
        if (res.deleted?.[pid] === 'deleted') deleted++
        else                                   failed++
      }
      process.stdout.write(`  batch ${i / 100 + 1}: +${batch.length} processed\n`)
    } catch (err) {
      failed += batch.length
      console.error(`  batch ${i / 100 + 1} failed:`, err)
    }
  }

  console.log(`\nDone. Deleted ${deleted}, failed ${failed}.`)
  await prisma.$disconnect()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
