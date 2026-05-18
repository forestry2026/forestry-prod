import { prisma }     from '@/lib/prisma'
import Link           from 'next/link'
import { InboxIcon, ArrowRight, Clock } from 'lucide-react'

/* ── helpers ─────────────────────────────────────────────────── */
function relativeTime(date: Date | null | undefined): string {
  if (!date) return '—'
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs  = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'SUBMITTED') return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700">
      Submitted
    </span>
  )
  if (status === 'PENDING') return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700">
      Pending
    </span>
  )
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-charcoal-100 text-charcoal-500">
      {status}
    </span>
  )
}

/* ── component ───────────────────────────────────────────────── */
export async function RfpInbox() {
  const [rfps, count] = await Promise.all([
    prisma.rfp.findMany({
      where:   { status: { in: ['SUBMITTED', 'PENDING'] } },
      include: { vendorProfile: { include: { user: true } } },
      orderBy: { submittedAt: 'desc' },
      take: 6,
    }),
    prisma.rfp.count({ where: { status: { in: ['SUBMITTED', 'PENDING'] } } }),
  ])

  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-cream border-b border-[#E8E0D5]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center">
            <InboxIcon className="w-4 h-4 text-terracotta" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-charcoal-900 leading-none">RFP Inbox</h2>
            <p className="text-[11px] text-charcoal-400 mt-0.5">Pending review</p>
          </div>
          {count > 0 && (
            <span className="inline-flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-terracotta text-white text-[10px] font-bold leading-none">
              {count > 99 ? '99+' : count}
            </span>
          )}
        </div>
        <Link
          href="/admin/rfps"
          className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors"
        >
          View all <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Empty state */}
      {rfps.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 px-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-4">
            <InboxIcon className="w-5 h-5 text-terracotta/40" />
          </div>
          <p className="font-heading text-base font-bold text-charcoal-900 mb-1">Inbox clear</p>
          <p className="text-sm text-charcoal-400">No RFPs pending review right now</p>
        </div>
      ) : (
        <ul className="divide-y divide-[#E8E0D5]">
          {rfps.map(rfp => (
            <li key={rfp.id}>
              <Link
                href={`/admin/rfps/${rfp.id}`}
                className="group flex items-center gap-4 px-6 py-4 hover:bg-cream/40 transition-colors"
              >
                {/* RFP number + company */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-mono text-sm font-bold text-charcoal-900 tracking-tight">
                      {rfp.rfpNumber}
                    </span>
                    <StatusBadge status={rfp.status} />
                  </div>
                  <p className="text-xs text-charcoal-500 truncate font-medium">
                    {rfp.vendorProfile.companyName}
                  </p>
                </div>

                {/* Time + arrow */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="hidden sm:flex items-center gap-1 text-[11px] text-charcoal-400">
                    <Clock className="w-3 h-3" />
                    {relativeTime(rfp.submittedAt)}
                  </div>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-cream group-hover:bg-terracotta/10 transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-terracotta transition-colors" />
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* Overflow footer */}
      {count > 6 && (
        <div className="px-6 py-3 border-t border-[#E8E0D5] bg-cream/40">
          <Link
            href="/admin/rfps"
            className="text-xs font-semibold text-charcoal-400 hover:text-terracotta transition-colors"
          >
            +{count - 6} more pending RFPs →
          </Link>
        </div>
      )}
    </div>
  )
}
