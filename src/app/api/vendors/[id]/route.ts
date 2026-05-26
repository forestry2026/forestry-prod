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

  try {
    const vendor = await prisma.vendorProfile.findUnique({
      where:   { id },
      include: {
        user: { select: { id: true, email: true } },
        rfps: { select: { id: true } },
        customDesignRequests: { select: { id: true } },
      },
    })
    if (!vendor) return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 })

    // Block deletion if the vendor has any business records — preserve history
    if (vendor.rfps.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete — this vendor has ${vendor.rfps.length} RFP(s) on record. Revoke their access instead.` },
        { status: 409 },
      )
    }
    if (vendor.customDesignRequests.length > 0) {
      return NextResponse.json(
        { error: `Cannot delete — this vendor has ${vendor.customDesignRequests.length} custom design request(s) on record. Revoke their access instead.` },
        { status: 409 },
      )
    }

    // Check additional FK references via the user account.
    const [quotations, productionOrders, statusLogs, rfpQuotes, rfpNotes, enquiryItems] = await Promise.all([
      prisma.quotation.count({           where: { createdBy:         vendor.user.id } }).catch(() => 0),
      prisma.productionOrder.count({     where: { managerApprovedBy: vendor.user.id } }).catch(() => 0),
      prisma.productionStatusLog.count({ where: { updatedBy:         vendor.user.id } }).catch(() => 0),
      prisma.rfpQuote.count({            where: { quotedById:        vendor.user.id } }).catch(() => 0),
      prisma.rfpNote.count({             where: { userId:            vendor.user.id } }).catch(() => 0),
      prisma.enquiryItem.count({         where: { userId:            vendor.user.id } }).catch(() => 0),
    ])
    const lingering = quotations + productionOrders + statusLogs + rfpQuotes + rfpNotes
    if (lingering > 0) {
      return NextResponse.json(
        { error: 'Cannot delete — this vendor has linked quotations, production records or quotes. Revoke their access instead.' },
        { status: 409 },
      )
    }

    // Clear orphaned enquiry items (safe — they are draft cart data).
    if (enquiryItems > 0) {
      await prisma.enquiryItem.deleteMany({ where: { userId: vendor.user.id } })
    }

    // Delete vendorProfile (cascades to EnquiryBasket) then user
    await prisma.$transaction(async (tx) => {
      await tx.vendorProfile.delete({ where: { id } })
      await tx.user.delete({ where: { id: vendor.user.id } })
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
  } catch (err: any) {
    // P2003 = FK constraint, P2025 = record not found
    const code = err?.code as string | undefined
    if (code === 'P2003') {
      return NextResponse.json(
        { error: 'Cannot delete — this vendor still has linked records. Revoke their access instead.' },
        { status: 409 },
      )
    }
    console.error('[DELETE /api/vendors/[id]]', err)
    return NextResponse.json(
      { error: err?.message ?? 'Failed to delete vendor.' },
      { status: 500 },
    )
  }
}
