import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { sendRfpWithdrawnNotification } from '@/lib/email'

const WITHDRAWABLE = ['SUBMITTED', 'PENDING']

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
    include: { vendorProfile: { include: { user: true } } },
  })

  if (!rfp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Must belong to this vendor
  if (rfp.vendorProfile.user.id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Only withdrawable before admin quotes
  if (!WITHDRAWABLE.includes(rfp.status)) {
    return NextResponse.json(
      { error: `Cannot withdraw an RFP with status "${rfp.status}"` },
      { status: 409 },
    )
  }

  const updated = await prisma.rfp.update({
    where: { id },
    data:  { status: 'CANCELLED' },
  })

  await prisma.auditLog.create({
    data: {
      userId:     session.user.id,
      action:     'RFP_WITHDRAWN',
      entityType: 'RFP',
      entityId:   rfp.id,
      details:    JSON.stringify({ rfpNumber: rfp.rfpNumber }),
    },
  })

  // Notify admin (fire-and-forget)
  sendRfpWithdrawnNotification(
    rfp.rfpNumber,
    rfp.vendorProfile.user.name ?? 'Vendor',
    rfp.projectName ?? undefined,
  ).catch(console.error)

  return NextResponse.json({ success: true, data: { status: updated.status } })
}
