import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { headers }          from 'next/headers'
import Link                 from 'next/link'
import {
  ShoppingCart, FileText, Clock, Package, TrendingUp,
  CheckCircle2, Sparkles, PenLine, ArrowRight, Star,
  AlertCircle, Wand2, LayoutGrid,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard — Vendor Portal' }

/* ── Helpers ─────────────────────────────────────────────────────── */
function initials(name: string | null | undefined) {
  if (!name) return 'V'
  return name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()
}

function greeting(name: string | null | undefined) {
  const h = new Date().getHours()
  const g = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  const first = name?.split(' ')[0] ?? 'there'
  return `${g}, ${first}`
}

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ── RFP status config ───────────────────────────────────────────── */
const RFP_STATUS: Record<string, { label: string; color: string; bar: string }> = {
  DRAFT:        { label: 'Draft',        color: 'text-stone-400',   bar: 'bg-stone-300'   },
  SUBMITTED:    { label: 'Submitted',    color: 'text-sky-600',     bar: 'bg-sky-400'     },
  UNDER_REVIEW: { label: 'Under Review', color: 'text-amber-600',   bar: 'bg-amber-400'   },
  QUOTED:       { label: 'Quote Ready',  color: 'text-violet-600',  bar: 'bg-violet-400'  },
  ACCEPTED:     { label: 'Accepted',     color: 'text-emerald-600', bar: 'bg-emerald-400' },
  REJECTED:     { label: 'Rejected',     color: 'text-rose-500',    bar: 'bg-rose-400'    },
  EXPIRED:      { label: 'Expired',      color: 'text-stone-400',   bar: 'bg-stone-300'   },
}

/* ── Page ────────────────────────────────────────────────────────── */
export default async function VendorDashboard() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const vendorProfileId = session.user.vendorProfileId
  const thirtyDaysAgo   = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    enquiryCount,
    rfps,
    vendor,
    totalProducts,
    newProducts,
    featuredProducts,
    acceptedRfpCount,
    draftRfpCount,
    customRequestCount,
  ] = await Promise.all([
    vendorProfileId
      ? prisma.enquiryItem.count({ where: { userId: session.user.id } })
      : 0,
    vendorProfileId
      ? prisma.rfp.findMany({
          where:   { vendorProfileId },
          orderBy: { createdAt: 'desc' },
          take:    10,
          include: { items: true, quotes: { orderBy: { createdAt: 'desc' }, take: 1 } },
        })
      : [],
    vendorProfileId
      ? prisma.vendorProfile.findUnique({ where: { id: vendorProfileId } })
      : null,
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, createdAt: { gte: thirtyDaysAgo } } }),
    prisma.product.count({ where: { isActive: true, isFeatured: true } }),
    vendorProfileId
      ? prisma.rfp.count({ where: { vendorProfileId, status: 'ACCEPTED' } })
      : 0,
    vendorProfileId
      ? prisma.rfp.count({ where: { vendorProfileId, status: 'DRAFT' } })
      : 0,
    vendorProfileId
      ? prisma.customDesignRequest.count({ where: { vendorProfileId } })
      : 0,
  ])

  const pendingRfps = rfps.filter(r => ['SUBMITTED', 'UNDER_REVIEW'].includes(r.status)).length
  const quotedRfps  = rfps.filter(r => r.status === 'QUOTED').length
  const ini         = initials(session.user.name)
  const recentRfps  = rfps.slice(0, 5)

  /* ── Weather (IP → geo → Open-Meteo) ────────────────────────── */
  let weatherLine: string | null = null
  try {
    const hdrs  = await headers()
    const rawIp = hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip') ?? ''
    const ip    = rawIp.split(',')[0].trim()
    const isLocal = !ip || ip === '127.0.0.1' || ip === '::1'
    if (!isLocal) {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,lat,lon,status`, { next: { revalidate: 3600 } })
      const geo = await geoRes.json()
      if (geo.status === 'success') {
        const wxRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,weather_code&temperature_unit=celsius`,
          { next: { revalidate: 1800 } },
        )
        const wx   = await wxRes.json()
        const temp = Math.round(wx.current?.temperature_2m ?? 0)
        const code = wx.current?.weather_code ?? 0
        const desc = code === 0 ? 'Clear skies' : code <= 3 ? 'Partly cloudy' : code <= 49 ? 'Foggy' :
                     code <= 59 ? 'Drizzling' : code <= 69 ? 'Raining' : code <= 79 ? 'Snowing' :
                     code <= 82 ? 'Rain showers' : code <= 86 ? 'Snow showers' : code <= 99 ? 'Thunderstorm' : 'Cloudy'
        weatherLine = `${desc} · ${temp}°C in ${geo.city}, ${geo.country}`
      }
    }
  } catch { /* non-critical */ }

  return (
    <div className="space-y-6 pb-8">

      {/* ══ HERO WELCOME ════════════════════════════════════════════ */}
      <div className="relative overflow-hidden rounded-2xl border border-[#EDE6DC]"
        style={{ background: 'linear-gradient(135deg, #FDF9F4 0%, #FAF2E8 50%, #F5EBD8 100%)' }}>

        {/* Decorative orbs */}
        <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full opacity-20 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #C86E4B 0%, transparent 70%)' }} />
        <div className="absolute -bottom-8 left-1/3 w-40 h-40 rounded-full opacity-10 pointer-events-none"
          style={{ background: 'radial-gradient(circle, #D4956A 0%, transparent 70%)' }} />

        <div className="relative px-7 py-7 flex items-center gap-6 flex-wrap">

          {/* Logo / avatar */}
          <div className="flex-shrink-0">
            {vendor?.logoUrl ? (
              <div className="w-16 h-16 rounded-2xl border-2 border-white/80 bg-white flex items-center justify-center overflow-hidden shadow-md">
                <img src={vendor.logoUrl} alt={vendor.companyName} className="w-full h-full object-contain p-1.5" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-terracotta to-terracotta-dark flex items-center justify-center shadow-warm">
                <span className="font-heading text-xl font-bold text-white leading-none tracking-wide">{ini}</span>
              </div>
            )}
          </div>

          {/* Greeting */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">
              {vendor?.companyName ?? 'Vendor Portal'}
            </p>
            <h1 className="font-heading text-2xl font-bold text-stone-800 leading-tight mb-1">
              {greeting(session.user.name)}
            </h1>
            <p className="text-sm text-stone-500">
              {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            {weatherLine && (
              <p className="text-sm text-stone-400 mt-0.5 flex items-center gap-1.5">
                <span>🌤</span>
                {weatherLine}
              </p>
            )}
          </div>

          {/* Quick-action CTAs */}
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
            <Link href="/portal/products"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/80 hover:bg-white border border-[#E0D5C8] text-stone-700 text-xs font-semibold rounded-xl transition-all hover:shadow-sm">
              <LayoutGrid className="w-3.5 h-3.5 text-terracotta" />
              Browse Catalog
            </Link>
            <Link href="/portal/rfp/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-terracotta hover:bg-terracotta-dark text-white text-xs font-bold rounded-xl transition-colors shadow-warm-sm">
              <PenLine className="w-3.5 h-3.5" />
              New RFP
            </Link>
            {!vendor?.logoUrl && (
              <Link href="/portal/profile"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/60 border border-dashed border-stone-300 text-stone-400 hover:text-terracotta hover:border-terracotta/50 text-xs font-semibold rounded-xl transition-colors">
                + Upload logo
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ══ PRIMARY STATS ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Enquiry basket */}
        <Link href="/portal/enquiry"
          className="group bg-white rounded-2xl border border-[#EDE6DC] p-5 hover:border-terracotta/30 hover:shadow-warm-sm transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-terracotta" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-terracotta group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-heading text-3xl font-bold text-stone-800 leading-none mb-1">{enquiryCount}</p>
          <p className="text-xs text-stone-400 font-medium">Enquiry items</p>
        </Link>

        {/* Pending RFPs */}
        <Link href="/portal/rfp/history"
          className="group bg-white rounded-2xl border border-[#EDE6DC] p-5 hover:border-amber-200 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-heading text-3xl font-bold text-stone-800 leading-none mb-1">{pendingRfps}</p>
          <p className="text-xs text-stone-400 font-medium">Pending review</p>
        </Link>

        {/* Quotes ready — highlight if > 0 */}
        <Link href="/portal/rfp/history"
          className={`group rounded-2xl border p-5 transition-all ${
            quotedRfps > 0
              ? 'bg-violet-50 border-violet-200 hover:border-violet-300 hover:shadow-sm'
              : 'bg-white border-[#EDE6DC] hover:border-stone-200'
          }`}>
          <div className="flex items-start justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${quotedRfps > 0 ? 'bg-violet-100' : 'bg-stone-50'}`}>
              <TrendingUp className={`w-5 h-5 ${quotedRfps > 0 ? 'text-violet-500' : 'text-stone-400'}`} />
            </div>
            {quotedRfps > 0 && (
              <span className="text-[9px] font-bold uppercase tracking-wider text-violet-500 bg-violet-100 px-1.5 py-0.5 rounded-full">
                Action needed
              </span>
            )}
          </div>
          <p className={`font-heading text-3xl font-bold leading-none mb-1 ${quotedRfps > 0 ? 'text-violet-700' : 'text-stone-800'}`}>
            {quotedRfps}
          </p>
          <p className={`text-xs font-medium ${quotedRfps > 0 ? 'text-violet-500' : 'text-stone-400'}`}>Quotes ready</p>
        </Link>

        {/* Accepted */}
        <Link href="/portal/rfp/history"
          className="group bg-white rounded-2xl border border-[#EDE6DC] p-5 hover:border-emerald-200 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-heading text-3xl font-bold text-stone-800 leading-none mb-1">{acceptedRfpCount}</p>
          <p className="text-xs text-stone-400 font-medium">Accepted RFPs</p>
        </Link>
      </div>

      {/* ══ INSIGHT ROW ═════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

        {/* Catalog spotlight — wider */}
        <Link href="/portal/products"
          className="group md:col-span-2 relative overflow-hidden bg-white rounded-2xl border border-[#EDE6DC] p-6 hover:border-terracotta/30 hover:shadow-warm-sm transition-all">
          {/* Soft bg accent */}
          <div className="absolute right-0 top-0 w-32 h-32 opacity-5 pointer-events-none"
            style={{ background: 'radial-gradient(circle at top right, #C86E4B, transparent 70%)' }} />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FDF2EB] flex items-center justify-center flex-shrink-0">
              <Package className="w-6 h-6 text-terracotta" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 mb-1">Product Catalog</p>
              <div className="flex items-baseline gap-3">
                <span className="font-heading text-4xl font-bold text-stone-800">{totalProducts}</span>
                <span className="text-sm text-stone-400">active products</span>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 rounded-full mb-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span className="text-xs font-bold text-emerald-600">+{newProducts} new</span>
              </div>
              <p className="text-[10px] text-stone-400">this month</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#F0EBE3] flex items-center gap-6">
            <div>
              <p className="font-heading text-lg font-bold text-stone-700">{featuredProducts}</p>
              <p className="text-[10px] text-stone-400 font-medium flex items-center gap-1">
                <Star className="w-3 h-3 text-amber-400" /> Featured this season
              </p>
            </div>
            <div className="h-8 w-px bg-[#EDE6DC]" />
            <p className="text-xs text-stone-400 leading-relaxed">
              Browse the full catalog to discover new arrivals and seasonal highlights.
            </p>
            <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-terracotta group-hover:translate-x-1 transition-all flex-shrink-0 ml-auto" />
          </div>
        </Link>

        {/* Custom design requests */}
        <Link href="/portal/custom-request"
          className="group bg-white rounded-2xl border border-[#EDE6DC] p-6 hover:border-violet-200 hover:shadow-sm transition-all">
          <div className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
            <Wand2 className="w-6 h-6 text-violet-500" />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 mb-2">Custom Designs</p>
          <p className="font-heading text-4xl font-bold text-stone-800 leading-none mb-1">{customRequestCount}</p>
          <p className="text-xs text-stone-400 mt-1 mb-4">requests submitted</p>
          <div className="flex items-center gap-1 text-xs text-violet-500 font-semibold group-hover:gap-2 transition-all">
            New request <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* ══ ACTION NUDGES ═══════════════════════════════════════════ */}
      {(draftRfpCount > 0 || enquiryCount > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {draftRfpCount > 0 && (
            <Link href="/portal/rfp/history"
              className="flex items-center gap-4 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl hover:bg-amber-100/60 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4.5 h-4.5 text-amber-500 w-[18px] h-[18px]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-amber-800">
                  {draftRfpCount} draft RFP{draftRfpCount !== 1 ? 's' : ''} awaiting submission
                </p>
                <p className="text-xs text-amber-600 mt-0.5">Complete and submit to receive quotes from our team.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
            </Link>
          )}
          {enquiryCount > 0 && (
            <Link href="/portal/rfp/new"
              className="flex items-center gap-4 px-5 py-4 bg-[#FDF5EF] border border-[#EDDBCE] rounded-2xl hover:bg-terracotta/5 transition-colors group">
              <div className="w-9 h-9 rounded-xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-[18px] h-[18px] text-terracotta" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-stone-700">
                  {enquiryCount} item{enquiryCount !== 1 ? 's' : ''} ready to quote
                </p>
                <p className="text-xs text-stone-500 mt-0.5">Your enquiry basket is ready — convert it into an RFP.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-terracotta group-hover:translate-x-0.5 transition-all flex-shrink-0" />
            </Link>
          )}
        </div>
      )}

      {/* ══ RECENT RFPs ═════════════════════════════════════════════ */}
      {recentRfps.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#EDE6DC] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0EBE3]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Recent Activity</p>
              <h2 className="font-heading text-base font-bold text-stone-800 mt-0.5">Your RFPs</h2>
            </div>
            <Link href="/portal/rfp/history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-[#F5F0EA]">
            {recentRfps.map(rfp => {
              const cfg = RFP_STATUS[rfp.status] ?? RFP_STATUS.DRAFT
              return (
                <Link key={rfp.id} href={`/portal/rfp/${rfp.id}`}
                  className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#FDFAF7] transition-colors group">

                  {/* Status bar */}
                  <div className={`w-1 h-8 rounded-full flex-shrink-0 ${cfg.bar}`} />

                  {/* RFP info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-mono text-[11px] font-semibold text-stone-400">{rfp.rfpNumber}</span>
                      {rfp.projectName && (
                        <span className="text-sm font-semibold text-stone-700 truncate">{rfp.projectName}</span>
                      )}
                    </div>
                    <p className="text-xs text-stone-400">
                      {rfp.items.length} item{rfp.items.length !== 1 ? 's' : ''} · {fmtDate(rfp.submittedAt ?? rfp.createdAt)}
                    </p>
                  </div>

                  {/* Status pill */}
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${cfg.color} bg-current/10`}
                    style={{ backgroundColor: 'transparent' }}>
                    <span className={`px-2 py-0.5 rounded-full ${
                      rfp.status === 'QUOTED'       ? 'bg-violet-100 text-violet-600'  :
                      rfp.status === 'ACCEPTED'     ? 'bg-emerald-100 text-emerald-600':
                      rfp.status === 'UNDER_REVIEW' ? 'bg-amber-100 text-amber-600'    :
                      rfp.status === 'SUBMITTED'    ? 'bg-sky-100 text-sky-600'        :
                      rfp.status === 'REJECTED'     ? 'bg-rose-100 text-rose-500'      :
                      'bg-stone-100 text-stone-500'
                    }`}>
                      {cfg.label}
                    </span>
                  </span>

                  <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* ══ EMPTY STATE ═════════════════════════════════════════════ */}
      {recentRfps.length === 0 && (
        <div className="text-center px-8 py-14 bg-white rounded-2xl border border-[#EDE6DC]">
          <div className="w-14 h-14 rounded-2xl bg-[#FDF2EB] flex items-center justify-center mx-auto mb-4">
            <Package className="w-7 h-7 text-terracotta/60" />
          </div>
          <h3 className="font-heading font-bold text-lg text-stone-700 mb-1">Ready to get started?</h3>
          <p className="text-sm text-stone-400 mb-6 max-w-xs mx-auto leading-relaxed">
            Browse our catalog, add items to your enquiry, and submit your first RFP to receive a quote.
          </p>
          <Link href="/portal/products"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white text-sm font-bold rounded-xl hover:bg-terracotta-dark transition-colors shadow-warm-sm">
            <Package className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      )}

    </div>
  )
}
