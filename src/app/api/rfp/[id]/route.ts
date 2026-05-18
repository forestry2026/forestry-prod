import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { writeAuditLog, getIp }      from '@/lib/auditLog'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await params

  const rfp = await prisma.rfp.findUnique({ where: { id }, select: { id: true, rfpNumber: true } })
  if (!rfp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Log before delete (record will be gone after)
  await writeAuditLog({
    userId:     session.user.id,
    action:     'RFP_DELETED',
    entityType: 'RFP',
    entityId:   id,
    details:    { actorName: session.user.name, actorRole: session.user.role, rfpNumber: rfp.rfpNumber },
    ipAddress:  getIp(req),
  })

  await prisma.rfp.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
