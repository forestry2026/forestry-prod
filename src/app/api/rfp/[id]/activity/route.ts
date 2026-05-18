import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id }     = await ctx.params
  const sp         = req.nextUrl.searchParams
  const page       = Math.max(1, parseInt(sp.get('page')     ?? '1',  10))
  const pageSize   = Math.min(100, Math.max(5, parseInt(sp.get('pageSize') ?? '20', 10)))
  const q          = (sp.get('q') ?? '').trim()
  const recentDays = parseInt(sp.get('recentDays') ?? '0', 10)

  const where: any = { entityType: { in: ['RFP', 'Rfp'] }, entityId: id }

  if (q) {
    where.OR = [
      { action:  { contains: q } },
      { details: { contains: q } },
    ]
  }

  if (recentDays > 0) {
    where.createdAt = { gte: new Date(Date.now() - recentDays * 86_400_000) }
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ])

  // Enrich with actor name (userId → User.name)
  const userIds = [...new Set(items.map(i => i.userId).filter(Boolean))] as string[]
  const users   = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, role: true } })
    : []
  const userMap = Object.fromEntries(users.map(u => [u.id, u]))

  return NextResponse.json({
    items: items.map(it => {
      const actor = it.userId ? userMap[it.userId] : null
      let parsed: Record<string, unknown> | null = null
      if (it.details) { try { parsed = JSON.parse(it.details) } catch {} }
      // Merge actorName from details (if stored there) or from user join
      const actorName = (parsed as any)?.actorName ?? actor?.name ?? null
      const actorRole = (parsed as any)?.actorRole ?? actor?.role ?? null
      return {
        id:         it.id,
        action:     it.action,
        entityType: it.entityType,
        entityId:   it.entityId,
        details:    it.details,
        actorName,
        actorRole,
        ipAddress:  it.ipAddress,
        createdAt:  it.createdAt.toISOString(),
      }
    }),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  })
}
