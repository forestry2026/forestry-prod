import { Metadata }        from 'next'
import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import Link                 from 'next/link'
import { FileText }         from 'lucide-react'
import { VendorRfpHistoryClient } from '@/components/vendor/VendorRfpHistoryClient'

export const metadata: Metadata = { title: 'RFP History — Forestry Vendor Portal' }

export default async function RfpHistoryPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'VENDOR') redirect('/login')

  const rfps = await prisma.rfp.findMany({
    where:   { vendorProfile: { userId: session.user.id }, vendorDeleted: false },
    include: {
      items:  { select: { quantity: true } },
      quotes: { select: { id: true }, orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { submittedAt: { sort: 'desc', nulls: 'last' } },
  })

  // Serialise dates for client component
  const serialised = rfps.map(r => ({
    id:          r.id,
    rfpNumber:   r.rfpNumber,
    status:      r.status,
    projectName: r.projectName,
    submittedAt: r.submittedAt?.toISOString() ?? null,
    createdAt:   r.createdAt.toISOString(),
    items:       r.items,
    quotes:      r.quotes,
  }))

  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-label">Your RFPs</p>
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">RFP History</h1>
          <p className="text-sm text-charcoal-400 mt-1.5">All submitted proposals and their current status</p>
        </div>
        <Link href="/portal/enquiry" className="btn-primary inline-flex items-center gap-2 flex-shrink-0 mt-1">
          <FileText className="w-4 h-4" />
          New RFP
        </Link>
      </div>

      {rfps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card">
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-6">
              <FileText className="w-7 h-7 text-terracotta/40" />
            </div>
            <h3 className="font-heading text-xl font-bold text-charcoal-900 mb-2">No RFPs yet</h3>
            <p className="text-sm text-charcoal-400 max-w-xs mb-8 leading-relaxed">
              Add products to your enquiry basket and submit your first Request for Proposal.
            </p>
            <Link href="/portal/products" className="btn-primary">Browse Products</Link>
          </div>
        </div>
      ) : (
        <VendorRfpHistoryClient rfps={serialised} />
      )}

    </div>
  )
}
