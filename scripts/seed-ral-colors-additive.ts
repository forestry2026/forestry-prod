/**
 * Additive RAL migration:
 *   - Adds all RAL colors that don't already exist (matched by ralCode)
 *   - Leaves existing colors + ProductColor + RfpItem.colorId UNTOUCHED
 *
 * Safe for production data.
 *
 * Run: npx tsx scripts/seed-ral-colors-additive.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { RAL_COLORS }   from '../src/lib/ralColors'

const prisma = new PrismaClient()

async function main() {
  console.log('🎨  Adding RAL colors (non-destructive)')

  const existingByCode = new Map<string, string>()
  const existing = await prisma.color.findMany({ where: { ralCode: { not: null } }, select: { id: true, ralCode: true } })
  for (const c of existing) if (c.ralCode) existingByCode.set(c.ralCode, c.id)

  const startCount = await prisma.color.count()
  console.log(`    Existing rows total: ${startCount}`)
  console.log(`    Existing with RAL codes: ${existingByCode.size}`)

  // Find sort offset so new rows go to the end without colliding
  const maxSort = await prisma.color.aggregate({ _max: { sortOrder: true } })
  let nextSort = (maxSort._max.sortOrder ?? 0) + 1

  let inserted = 0
  let skipped  = 0
  for (const c of RAL_COLORS) {
    if (existingByCode.has(c.code)) { skipped++; continue }
    await prisma.color.create({
      data: {
        name:      c.name,
        hexCode:   c.hex,
        ralCode:   c.code,
        isActive:  true,
        sortOrder: nextSort++,
      },
    })
    inserted++
  }

  const endCount = await prisma.color.count()
  console.log(`\n✅  Done`)
  console.log(`    Inserted: ${inserted}`)
  console.log(`    Skipped (already exist): ${skipped}`)
  console.log(`    Total rows now: ${endCount}`)
}

main()
  .catch(err => { console.error('❌  Seed failed:', err); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
