import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import Link                 from 'next/link'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import {
  Plus, Clock, CheckCircle2, AlertCircle, Eye, Wand2, FileText,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_MAP: Record<string, { label: string; color: string; dot: string; icon: React.ElementType }> = {
  pending:   { label: 'Under Review', color: 'bg-amber-50  text-amber-700  border-amber-200',  dot: 'bg-amber-400',  icon: Clock        },
  reviewing: { label: 'In Progress',  color: 'bg-blue-50   text-blue-700   border-blue-200',   dot: 'bg-blue-400',   icon: Eye          },
  quoted:    { label: 'Quoted',       color: 'bg-green-50  text-green-700  border-green-200',  dot: 'bg-green-400',  icon: CheckCircle2 },
  rejected:  { label: 'Not Feasible',color: 'bg-red-50    text-red-700    border-red-200',    dot: 'bg-red-400',    icon: AlertCircle  },
}

export default async function CustomRequestListPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string }>
}) {
  const params  = await searchParams
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } })
  if (!vendor) redirect('/portal')

  const requests = await prisma.customDesignRequest.findMany({
    where:   { vendorProfileId: vendor.id },
    orderBy: { createdAt: 'desc' },
  })

  // Stats
  const stats = {
    total:     requests.length,
    pending:   requests.filter(r => r.status === 'pending').length,
    reviewing: requests.filter(r => r.status === 'reviewing').length,
    quoted:    requests.filter(r => r.status === 'quoted').length,
  }

  return (
    <div className="space-y-7">

      {/* Success banner */}
      {params.submitted === '1' && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-xl text-sm">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600" />
          <span><strong>Request submitted!</strong> Our team will review and respond within 1–2 business days.</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Vendor Portal</p>
          <h1 className="font-heading text-3xl font-bold text-charcoal-900 tracking-tight">Custom Designs</h1>
          <p className="text-sm text-charcoal-400 mt-1">
            {requests.length === 0
              ? 'No requests yet — submit your first custom design brief.'
              : `${requests.length} request${requests.length !== 1 ? 's' : ''} submitted`}
          </p>
        </div>
        <Link
          href="/portal/custom-request/new"
          className="inline-flex items-center gap-2 bg-terracotta hover:bg-[#B85C3B] text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Request
        </Link>
      </div>

      {/* Stats row */}
      {requests.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Total',      value: stats.total,     color: 'text-charcoal-900', bg: 'bg-white' },
            { label: 'Under Review', value: stats.pending,  color: 'text-amber-600',    bg: 'bg-amber-50' },
            { label: 'In Progress',  value: stats.reviewing,color: 'text-blue-600',     bg: 'bg-blue-50' },
            { label: 'Quoted',       value: stats.quoted,   color: 'text-green-600',    bg: 'bg-green-50' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border border-[#EDE7DE] rounded-2xl px-5 py-4`}>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400">{s.label}</p>
              <p className={`text-3xl font-bold font-heading mt-1 ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {requests.length === 0 && (
        <div className="bg-white border border-[#EDE7DE] rounded-2xl p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-terracotta/10 flex items-center justify-center mx-auto mb-5">
            <Wand2 className="w-7 h-7 text-terracotta" />
          </div>
          <h2 className="font-heading text-lg font-bold text-charcoal-900 mb-2">No custom requests yet</h2>
          <p className="text-sm text-charcoal-500 mb-6 max-w-sm mx-auto">
            Can&apos;t find what you&apos;re looking for in the catalog? Submit a custom design brief and our team will create it for you.
          </p>
          <Link
            href="/portal/custom-request/new"
            className="inline-flex items-center gap-2 bg-terracotta hover:bg-[#B85C3B] text-white font-semibold px-5 py-3 rounded-xl text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Submit Custom Design
          </Link>
        </div>
      )}

      {/* Request grid */}
      {requests.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {requests.map(req => {
            const st       = STATUS_MAP[req.status] ?? STATUS_MAP.pending
            const StatusIcon = st.icon
            const images   = JSON.parse(req.referenceImages || '[]') as { url: string }[]
            const dims     = JSON.parse(req.dimensions || '[]') as { label: string; value: string; unit: string }[]

            return (
              <Link key={req.id} href={`/portal/custom-request/${req.id}`} className="bg-white border border-[#EDE7DE] rounded-2xl overflow-hidden hover:border-[#D4C4B0] hover:shadow-sm transition-all group block">

                {/* Top: thumbnail strip + header */}
                <div className="flex items-start gap-0">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 flex-shrink-0 bg-[#F5F0EB] border-r border-[#EDE7DE] overflow-hidden relative">
                    {images.length > 0 ? (
                      <img src={images[0].url} alt="reference" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Wand2 className="w-7 h-7 text-charcoal-200" />
                      </div>
                    )}
                    {images.length > 1 && (
                      <span className="absolute bottom-1 right-1 bg-black/50 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                        +{images.length - 1}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-heading font-semibold text-charcoal-900 text-sm leading-tight truncate">{req.title}</h3>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border flex-shrink-0 ${st.color}`}>
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${st.dot}`} />
                        {st.label}
                      </span>
                    </div>

                    {req.description && (
                      <p className="text-xs text-charcoal-400 line-clamp-2 mb-2 leading-relaxed">{req.description}</p>
                    )}

                    {/* Meta chips */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5F0EB] rounded-md text-[10px] font-medium text-charcoal-600">
                        Qty: <strong>{req.quantity}</strong>
                      </span>
                      {dims.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5F0EB] rounded-md text-[10px] font-medium text-charcoal-600">
                          {dims.length} dim{dims.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {images.length > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#F5F0EB] rounded-md text-[10px] font-medium text-charcoal-600">
                          {images.length} img{images.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom bar */}
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#EDE7DE] bg-[#FAFAF9]">
                  <span className="text-[10px] text-charcoal-400">
                    {new Date(req.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {req.adminNotes && (
                    <div className="flex items-center gap-1.5 text-[10px] text-blue-600 font-medium">
                      <FileText className="w-3 h-3" />
                      Team note available
                    </div>
                  )}
                </div>

                {/* Admin notes inline */}
                {req.adminNotes && (
                  <div className="px-4 py-2.5 bg-blue-50/70 border-t border-blue-100 text-xs text-blue-700">
                    <strong>Team note:</strong> {req.adminNotes}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
