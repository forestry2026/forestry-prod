import { NextResponse }     from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role

  if (role === 'ADMIN' || role === 'MANAGER') {
    const [rfps, accessRequests, customDesigns, enquiries] = await Promise.all([
      // New RFPs awaiting admin action
      prisma.rfp.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } } }),
      // Vendor access requests pending approval
      prisma.accessRequest.count({ where: { status: 'PENDING' } }),
      // Custom design requests pending review
      prisma.customDesignRequest.count({ where: { status: 'pending' } }),
      // Custom size enquiries unread
      prisma.customSizeEnquiry.count({ where: { status: 'new' } }).catch(() => 0),
    ])
    return NextResponse.json({ rfps, accessRequests, customDesigns, enquiries })
  }

  if (role === 'VENDOR') {
    const vendorProfileId = session.user.vendorProfileId
    if (!vendorProfileId) return NextResponse.json({ quotedRfps: 0, enquiry: 0 })

    const [quotedRfps, enquiry] = await Promise.all([
      // Quotes sent by admin, vendor hasn't accepted or rejected yet
      prisma.rfp.count({ where: { vendorProfileId, status: 'QUOTED' } }),
      prisma.enquiryItem.count({ where: { userId: session.user.id } }),
    ])
    return NextResponse.json({ quotedRfps, enquiry })
  }

  return NextResponse.json({})
}
