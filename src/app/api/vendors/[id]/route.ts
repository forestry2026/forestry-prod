import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'

// DELETE /api/vendors/[id]  — id is vendorProfile.id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const vendor = await prisma.vendorProfile.findUnique({
    where:   { id },
    include: { user: true, rfps: { select: { id: true } } },
  })
  if (!vendor) return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 })

  // Block deletion if the vendor has RFPs — preserve order history
  if (vendor.rfps.length > 0) {
    return NextResponse.json(
      { error: `Cannot delete — this vendor has ${vendor.rfps.length} RFP(s) on record. Revoke their access instead.` },
      { status: 409 },
    )
  }

  // Delete vendorProfile (cascades to EnquiryBasket) then user
  await prisma.$transaction(async (tx) => {
    await tx.vendorProfile.delete({ where: { id } })
    await tx.user.delete({ where: { id: vendor.userId } })
    await tx.auditLog.create({
      data: {
        userId:     session.user.id,
        action:     'VENDOR_DELETED',
        entityType: 'VendorProfile',
        entityId:   id,
        details:    JSON.stringify({
          companyName: vendor.companyName,
          email:       vendor.user.email,
        }),
      },
    })
  })

  return NextResponse.json({ success: true })
}
