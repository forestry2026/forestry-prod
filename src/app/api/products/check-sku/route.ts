import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/products/check-sku?sku=ABC123[&excludeId=<id>]
 *
 * Returns { available: true | false } so the admin product form can
 * give live feedback while the user is typing a custom SKU.
 *
 * Pass `excludeId` when editing an existing product so the product's
 * own row isn't flagged as a duplicate of itself.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const url       = new URL(req.url)
  const sku       = url.searchParams.get('sku')?.trim()
  const excludeId = url.searchParams.get('excludeId')?.trim() || null

  if (!sku) {
    return NextResponse.json({ available: true })
  }

  const existing = await prisma.product.findUnique({
    where:  { sku },
    select: { id: true },
  })

  const available =
    !existing || (excludeId !== null && existing.id === excludeId)

  return NextResponse.json({ available })
}
