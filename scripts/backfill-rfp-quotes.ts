/**
 * Backfill RfpQuote rows that were missed by the initial SQLite → Neon migration.
 *
 * - Reads all RfpQuote rows from prisma/dev.db
 * - Upserts each into Neon, only if the RFP exists there
 * - Skips rows already present (by id)
 *
 * Run: npx tsx scripts/backfill-rfp-quotes.ts
 */

import 'dotenv/config'
import Database from 'better-sqlite3'
import path     from 'path'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
const oldDb  = new Database(path.join(process.cwd(), 'prisma', 'dev.db'), { readonly: true })

function normalizeBool(v: unknown): boolean {
  return typeof v === 'number' ? Boolean(v) : Boolean(v)
}

function normalizeDate(v: unknown): Date | null {
  if (v === null || v === undefined) return null
  if (typeof v === 'number') return new Date(v)
  if (typeof v === 'string') {
    const d = new Date(v)
    return isNaN(d.getTime()) ? null : d
  }
  return null
}

async function main() {
  console.log('🔄  Backfilling RfpQuote rows from SQLite → Neon')

  const oldRows = oldDb.prepare('SELECT * FROM RfpQuote').all() as Array<{
    id: string; rfpId: string; quotedById: string;
    subtotal: number; discount: number | null; tax: number | null; shipping: number | null;
    total: number; validUntil: number | string; terms: string | null; notes: string | null;
    productionDays: number | null; deliveryDays: number | null; deliveryCharges: number | null;
    sentAt: number | string | null; createdAt: number | string; updatedAt: number | string;
  }>

  console.log(`    Found ${oldRows.length} quote rows in SQLite`)

  let inserted = 0
  let skipped  = 0
  let missingRfp = 0

  for (const row of oldRows) {
    // Verify the parent RFP exists in Neon
    const rfp = await prisma.rfp.findUnique({ where: { id: row.rfpId }, select: { id: true } })
    if (!rfp) { missingRfp++; console.warn(`  ⚠ parent RFP missing: ${row.rfpId} (quote ${row.id})`); continue }

    const existing = await prisma.rfpQuote.findUnique({ where: { id: row.id }, select: { id: true } })
    if (existing) { skipped++; continue }

    // Verify quotedBy user exists
    const user = await prisma.user.findUnique({ where: { id: row.quotedById }, select: { id: true } })
    if (!user) {
      console.warn(`  ⚠ quotedBy user missing for quote ${row.id} — skipping`)
      continue
    }

    await prisma.rfpQuote.create({
      data: {
        id:              row.id,
        rfpId:           row.rfpId,
        quotedById:      row.quotedById,
        subtotal:        row.subtotal ?? 0,
        discount:        row.discount,
        tax:             row.tax,
        shipping:        row.shipping,
        total:           row.total ?? 0,
        validUntil:      normalizeDate(row.validUntil) ?? new Date(),
        terms:           row.terms,
        notes:           row.notes,
        productionDays:  row.productionDays,
        deliveryDays:    row.deliveryDays,
        deliveryCharges: row.deliveryCharges,
        sentAt:          normalizeDate(row.sentAt),
        createdAt:       normalizeDate(row.createdAt) ?? new Date(),
        // RfpQuote schema has no `updatedAt` — skip it.
      },
    })
    inserted++
  }

  console.log(`\n✅  Done`)
  console.log(`    Inserted:    ${inserted}`)
  console.log(`    Skipped:     ${skipped} (already exist)`)
  console.log(`    Missing RFP: ${missingRfp}`)
}

main()
  .catch(err => { console.error('❌  Backfill failed:', err); process.exit(1) })
  .finally(async () => { await prisma.$disconnect(); oldDb.close() })
