import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeAuditLog, getIp } from '@/lib/auditLog'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params
  const rfp = await prisma.rfp.findUnique({ where: { id } })
  if (!rfp) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (rfp.status !== 'APPROVED') return NextResponse.json({ error: 'Can only start production on APPROVED RFP' }, { status: 409 })

  const updated = await prisma.rfp.update({
    where: { id },
    data: { status: 'IN_PRODUCTION', productionStartedAt: new Date() },
  })

  await writeAuditLog({
    userId:     session.user.id,
    action:     'RFP_PRODUCTION_STARTED',
    entityType: 'RFP',
    entityId:   id,
    details:    { actorName: session.user.name, actorRole: session.user.role, rfpNumber: rfp.rfpNumber },
    ipAddress:  getIp(req),
  })

  return NextResponse.json({ success: true, data: updated })
}
