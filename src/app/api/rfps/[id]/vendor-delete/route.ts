import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'

const DELETABLE_STATUSES = ['DRAFT', 'CANCELLED', 'REJECTED']

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'VENDOR') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const rfp = await prisma.rfp.findUnique({
    where:   { id },
    include: { vendorProfile: { select: { userId: true } } },
  })

  if (!rfp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (rfp.vendorProfile.userId !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!DELETABLE_STATUSES.includes(rfp.status)) {
    return NextResponse.json(
      { error: `Cannot delete an RFP with status "${rfp.status}". Only withdrawn, rejected, or draft RFPs can be removed.` },
      { status: 409 },
    )
  }

  await prisma.rfp.update({
    where: { id },
    data:  { vendorDeleted: true, vendorDeletedAt: new Date() },
  })

  await prisma.auditLog.create({
    data: {
      userId:     session.user.id,
      action:     'RFP_VENDOR_DELETED',
      entityType: 'RFP',
      entityId:   rfp.id,
      details:    JSON.stringify({ rfpNumber: rfp.rfpNumber }),
    },
  })

  return NextResponse.json({ success: true })
}
