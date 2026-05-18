import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeAuditLog, getIp } from '@/lib/auditLog'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const revisionRequest = body.revisionRequest ?? body.reason ?? null

  const rfp = await prisma.rfp.findUnique({ where: { id } })
  if (!rfp) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (rfp.status !== 'QUOTED') return NextResponse.json({ error: 'Can only request revision on a QUOTED RFP' }, { status: 409 })

  const updated = await prisma.rfp.update({
    where: { id },
    data: { status: 'PENDING', revisionRequest: revisionRequest || null, respondedAt: new Date() },
  })

  await writeAuditLog({
    userId:     session.user.id,
    action:     'RFP_REVISION_REQUESTED',
    entityType: 'RFP',
    entityId:   id,
    details:    {
      actorName:       session.user.name,
      actorRole:       session.user.role,
      rfpNumber:       rfp.rfpNumber,
      revisionRequest: revisionRequest || null,
    },
    ipAddress:  getIp(req),
  })

  return NextResponse.json({ success: true, data: updated })
}
