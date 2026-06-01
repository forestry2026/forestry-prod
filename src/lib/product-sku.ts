/**
 * SKU generator for products.
 *
 * Format: DD + N + YY
 *   - DD = day of month, zero-padded (2 digits)
 *   - N  = sequence number of products created on that date (unpadded)
 *   - YY = year last two digits
 *
 * Examples:
 *   1st of June 2026, first  product → "0126"
 *   1st of June 2026, 106th product → "0110626"
 *   15th of Jan 2027, second product → "15227"
 *
 * If the generated SKU happens to collide with an existing one (manual
 * override, race condition, etc.) the sequence is incremented until
 * a free slot is found.
 */

import { prisma } from '@/lib/prisma'

export async function generateProductSku(now: Date = new Date()): Promise<string> {
  const dd = String(now.getDate()).padStart(2, '0')
  const yy = String(now.getFullYear()).slice(-2)

  // Boundaries for "today" in server local time.
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const todayCount = await prisma.product.count({
    where: { createdAt: { gte: start, lte: end } },
  })

  // Start from todayCount + 1 and bump until we find an unused SKU.
  for (let seq = todayCount + 1; seq < todayCount + 10_000; seq++) {
    const sku = `${dd}${seq}${yy}`
    const existing = await prisma.product.findUnique({
      where:  { sku },
      select: { id: true },
    })
    if (!existing) return sku
  }

  throw new Error('Could not allocate a unique SKU after 10,000 attempts')
}
