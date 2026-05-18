/**
 * One-time migration:
 *   - Wipes existing Color rows
 *   - Repopulates from RAL_COLORS (Classic, Effect, Metallic)
 *
 * Existing ProductColor + RfpItem rows reference Color by `id`. Wiping the table
 * will cascade-null those FKs, so run AFTER agreeing that the old colors no
 * longer apply.
 *
 * Run: npx tsx scripts/seed-ral-colors.ts
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { RAL_COLORS }   from '../src/lib/ralColors'

const prisma = new PrismaClient()

async function main() {
  console.log('🎨  Seeding RAL colors into Color table')

  // Detach product/RFP relations + remove old colors
  const oldCount = await prisma.color.count()
  console.log(`    Existing colors: ${oldCount}`)
  await prisma.productColor.deleteMany({})
  await prisma.rfpItem.updateMany({ where: { colorId: { not: null } }, data: { colorId: null } })
  await prisma.color.deleteMany({})

  // Insert RAL set
  let sortOrder = 0
  for (const c of RAL_COLORS) {
    await prisma.color.create({
      data: {
        name:    c.name,
        hexCode: c.hex,
        ralCode: c.code,
        isActive: true,
        sortOrder: sortOrder++,
      },
    })
  }

  const newCount = await prisma.color.count()
  console.log(`✅  Inserted ${newCount} RAL colors`)
}

main()
  .catch(err => { console.error('❌  Seed failed:', err); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
