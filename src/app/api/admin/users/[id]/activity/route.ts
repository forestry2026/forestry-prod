import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await ctx.params

  const sp        = req.nextUrl.searchParams
  const page      = Math.max(1, parseInt(sp.get('page') ?? '1', 10))
  const pageSize  = Math.min(100, Math.max(5, parseInt(sp.get('pageSize') ?? '20', 10)))
  const q         = (sp.get('q') ?? '').trim()
  const category  = sp.get('category')                              // optional
  const fromIso   = sp.get('from')                                  // ISO date
  const toIso     = sp.get('to')                                    // ISO date
  const recentDays = parseInt(sp.get('recentDays') ?? '0', 10)      // shortcut: last N days

  const where: any = { userId: id }

  if (q) {
    where.OR = [
      { action:     { contains: q } },
      { entityType: { contains: q } },
      { entityId:   { contains: q } },
      { details:    { contains: q } },
    ]
  }

  if (category && category !== 'all') {
    // Filter on category by mapping action prefixes (kept simple)
    const prefixMap: Record<string, string[]> = {
      vendor:    ['VENDOR_'],
      product:   ['PRODUCT_'],
      attribute: ['ATTRIBUTE_'],
      rfp:       ['RFP_'],
      system:    ['CREATE', 'UPDATE', 'DELETE'],
    }
    const prefixes = prefixMap[category]
    if (prefixes?.length) {
      where.OR = (where.OR ?? []).concat(
        prefixes.map(p => ({ action: { startsWith: p } })),
      )
    }
  }

  // Date filters — recentDays takes priority
  if (recentDays > 0) {
    const since = new Date(Date.now() - recentDays * 86400_000)
    where.createdAt = { gte: since }
  } else if (fromIso || toIso) {
    where.createdAt = {}
    if (fromIso) where.createdAt.gte = new Date(fromIso)
    if (toIso)   where.createdAt.lte = new Date(toIso)
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip:    (page - 1) * pageSize,
      take:    pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  return NextResponse.json({
    items: items.map(it => ({
      id:         it.id,
      action:     it.action,
      entityType: it.entityType,
      entityId:   it.entityId,
      details:    it.details,
      ipAddress:  it.ipAddress,
      createdAt:  it.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}
