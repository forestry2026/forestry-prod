import Link                  from 'next/link'
import { Suspense }           from 'react'
import { headers }            from 'next/headers'
import { getServerSession }   from 'next-auth'
import { redirect }           from 'next/navigation'
import { authOptions }        from '@/lib/auth'
import { prisma }             from '@/lib/prisma'
import {
  Package, Truck, Users, FileText,
  Inbox, AlertTriangle, ArrowRight, UserPlus,
  Globe, Wand2, TrendingUp, TrendingDown, CheckCircle2,
  Clock, Star, Banknote, Trophy, Flame,
  ShieldCheck, ShieldAlert, Activity, Zap,
  Hammer, AlertOctagon, Layers, Calendar,
  Factory, Eye, Target, Hourglass,
} from 'lucide-react'
import { RfpInbox }           from '@/components/rfps/RfpInbox'
import { DateRangeFilter }    from '@/components/admin/DateRangeFilter'
import { parsePermissions, canAccess } from '@/lib/portal-permissions'

/* ── Helpers ─────────────────────────────────────────────────────── */
function fmtCurrency(n: number) {
  if (n >= 1_000_000) return `AED ${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000)     return `AED ${(n / 1_000).toFixed(1)}K`
  return `AED ${n.toFixed(0)}`
}
function fmtNumber(n: number) { return n.toLocaleString('en-GB') }
function fmtPct(n: number)    { return `${n.toFixed(0)}%` }

function trend(curr: number, prev: number): { label: string; up: boolean; pct: number } {
  if (prev === 0) return { label: curr > 0 ? `+${curr} new` : 'No change', up: curr >= 0, pct: 0 }
  const pct = Math.round(((curr - prev) / prev) * 100)
  return { label: `${pct >= 0 ? '+' : ''}${pct}%`, up: pct >= 0, pct }
}

function daysBetween(a: Date, b: Date) {
  return Math.max(Math.round((+b - +a) / (1000 * 60 * 60 * 24)), 1)
}

function relTime(d: Date) {
  const diff = Math.round((Date.now() - +d) / (1000 * 60 * 60 * 24))
  if (diff === 0) return 'today'
  if (diff === 1) return 'yesterday'
  if (diff < 7)   return `${diff}d ago`
  if (diff < 30)  return `${Math.round(diff / 7)}w ago`
  if (diff < 365) return `${Math.round(diff / 30)}mo ago`
  return `${Math.round(diff / 365)}y ago`
}

function fmtDisplayDate(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/* ── Period resolution ──────────────────────────────────────────── */
function resolvePeriod(
  preset: string,
  customFrom?: string,
  customTo?: string,
): { from: Date; to: Date } {
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000)
  const now = new Date()

  switch (preset) {
    case 'today': {
      const startOfToday = new Date()
      startOfToday.setHours(0, 0, 0, 0)
      return { from: startOfToday, to: endOfToday }
    }
    case '7d':  return { from: daysAgo(7),   to: endOfToday }
    case 'mtd': return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: endOfToday }
    case 'qtd': {
      const qm = Math.floor(now.getMonth() / 3) * 3
      return { from: new Date(now.getFullYear(), qm, 1), to: endOfToday }
    }
    case '6m':  return { from: daysAgo(182), to: endOfToday }
    case '12m': return {
      from: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()),
      to:   endOfToday,
    }
    case 'custom': {
      const f = customFrom ? new Date(customFrom) : daysAgo(30)
      const t = customTo
        ? (() => { const d = new Date(customTo); d.setHours(23,59,59,999); return d })()
        : endOfToday
      return { from: f, to: t }
    }
    default: return { from: daysAgo(30), to: endOfToday } // 30d
  }
}

/* ── Page ────────────────────────────────────────────────────────── */
export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ preset?: string; from?: string; to?: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userRec   = await prisma.user.findUnique({ where: { id: session.user.id }, select: { permissions: true } })
  const userPerms = parsePermissions(userRec?.permissions)
  if (!canAccess(session.user.role, userPerms, 'dashboard')) redirect('/login')

  const params = await searchParams
  const now = new Date()

  /* ── Date filter ─────────────────────────────────────────────── */
  const activePreset = params.preset ?? '30d'
  const { from: periodFrom, to: periodTo } = resolvePeriod(activePreset, params.from, params.to)

  const periodDays    = daysBetween(periodFrom, periodTo)
  const prevPeriodTo  = new Date(periodFrom.getTime() - 1)
  const prevPeriodFrom = new Date(prevPeriodTo.getTime() - periodDays * 86_400_000)

  const periodLabel = `${fmtDisplayDate(periodFrom)} – ${fmtDisplayDate(periodTo)}`
  const fromIso     = periodFrom.toISOString().split('T')[0]
  const toIso       = periodTo.toISOString().split('T')[0]

  /* ── Static date anchors ─────────────────────────────────────── */
  const startOfMonth  = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLast   = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sevenDaysAgo  = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000)
  const twelveMonths  = new Date(now.getFullYear(), now.getMonth() - 11, 1)

  const greeting = (() => {
    // Always use UAE local time — server runs UTC on Vercel.
    const h = Number(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Dubai', hour: '2-digit', hour12: false }).format(now))
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const dateLabel = now.toLocaleDateString('en-GB', {
    timeZone: 'Asia/Dubai',
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  /* ── Weather (IP → geo → Open-Meteo) ────────────────────────── */
  let weatherLine: string | null = null
  try {
    const hdrs   = await headers()
    const rawIp  = hdrs.get('x-forwarded-for') ?? hdrs.get('x-real-ip') ?? ''
    const ip     = rawIp.split(',')[0].trim()
    const isLocal = !ip || ip === '127.0.0.1' || ip === '::1'

    if (!isLocal) {
      const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=city,country,lat,lon,status`, {
        next: { revalidate: 3600 },
      })
      const geo = await geoRes.json()
      if (geo.status === 'success') {
        const wxRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}&current=temperature_2m,weather_code&temperature_unit=celsius`,
          { next: { revalidate: 1800 } },
        )
        const wx   = await wxRes.json()
        const temp = Math.round(wx.current?.temperature_2m ?? 0)
        const code = wx.current?.weather_code ?? 0
        const desc = (() => {
          if (code === 0)              return 'Clear skies'
          if (code <= 3)               return 'Partly cloudy'
          if (code <= 49)              return 'Foggy'
          if (code <= 59)              return 'Drizzling'
          if (code <= 69)              return 'Raining'
          if (code <= 79)              return 'Snowing'
          if (code <= 82)              return 'Rain showers'
          if (code <= 86)              return 'Snow showers'
          if (code <= 99)              return 'Thunderstorm'
          return 'Cloudy'
        })()
        weatherLine = `${desc} · ${temp}°C in ${geo.city}, ${geo.country}`
      }
    }
  } catch {
    // weather is non-critical — fail silently
  }

  /* ── BATCH 1: Counts, aggregates, period-aware queries ───────── */
  const [
    productCount, featuredProductCount,
    productsNoPrice, productsNoCategory,

    approvedVendorCount, pendingVendorCount, rejectedVendorCount,
    newVendorThisMonth, newVendorLastMonth,
    vendorsByCountry,

    totalRfpCount,
    rfpDraft, rfpSubmitted, rfpUnderReview, rfpQuoted, rfpAccepted, rfpRejected,
    rfpStale, rfpRevisionRequested,

    pendingAppCount, openRfpCount,
    customDesignTotal, customDesignPending,

    userCount,

    quoteAggregateAll,
    quoteAggregateAccepted,

    productionQueued, productionInProgress, productionOnHold,
    productionCompleted, productionLate, productionUrgent,

    /* ── Period-aware ────────────────────────────────────────────── */
    rfpInPeriod,
    rfpInPrevPeriod,
    newVendorInPeriod,
    newVendorInPrevPeriod,
    newProductInPeriod,
    quoteAggregatePeriod,
    quoteAggregatePrevPeriod,
    rfpAcceptedInPeriod,
    rfpRejectedInPeriod,
    customDesignInPeriod,
  ] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { isActive: true, isFeatured: true } }),
    prisma.product.count({ where: { isActive: true, basePrice: null } }),
    prisma.product.count({ where: { isActive: true, category: null } }),

    prisma.vendorProfile.count({ where: { status: 'APPROVED' } }),
    prisma.vendorProfile.count({ where: { status: 'PENDING'  } }),
    prisma.vendorProfile.count({ where: { status: 'REJECTED' } }),
    prisma.vendorProfile.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.vendorProfile.count({ where: { createdAt: { gte: startOfLast, lt: startOfMonth } } }),
    prisma.vendorProfile.groupBy({
      by: ['country'], where: { status: 'APPROVED' },
      _count: { id: true }, orderBy: { _count: { id: 'desc' } }, take: 6,
    }),

    prisma.rfp.count(),
    prisma.rfp.count({ where: { status: 'DRAFT'        } }),
    prisma.rfp.count({ where: { status: 'SUBMITTED'    } }),
    prisma.rfp.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.rfp.count({ where: { status: 'QUOTED'       } }),
    prisma.rfp.count({ where: { status: 'ACCEPTED'     } }),
    prisma.rfp.count({ where: { status: { in: ['REJECTED', 'DECLINED'] } } }),
    prisma.rfp.count({ where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] }, submittedAt: { lt: sevenDaysAgo } } }),
    prisma.rfp.count({ where: { status: 'REVISION_REQUESTED' } }),

    prisma.accessRequest.count({ where: { status: 'PENDING' } }),
    prisma.rfp.count({ where: { status: { in: ['SUBMITTED', 'PENDING'] } } }),

    prisma.customDesignRequest.count(),
    prisma.customDesignRequest.count({ where: { status: 'pending' } }),

    prisma.user.count({ where: { role: { not: 'VENDOR' } } }),

    prisma.rfpQuote.aggregate({ _sum: { total: true, discount: true, tax: true }, _avg: { total: true } }),
    prisma.rfpQuote.aggregate({ _sum: { total: true }, where: { rfp: { status: 'ACCEPTED' } } }),

    prisma.productionOrder.count({ where: { status: 'QUEUED'      } }).catch(() => 0),
    prisma.productionOrder.count({ where: { status: 'IN_PROGRESS' } }).catch(() => 0),
    prisma.productionOrder.count({ where: { status: 'ON_HOLD'     } }).catch(() => 0),
    prisma.productionOrder.count({ where: { status: 'COMPLETED'   } }).catch(() => 0),
    prisma.productionOrder.count({
      where: { estimatedCompletion: { lt: now }, status: { notIn: ['COMPLETED', 'CANCELLED'] } }
    }).catch(() => 0),
    prisma.productionOrder.count({ where: { priority: { in: ['HIGH', 'URGENT'] } } }).catch(() => 0),

    /* Period-aware */
    prisma.rfp.count({ where: { createdAt: { gte: periodFrom, lte: periodTo } } }),
    prisma.rfp.count({ where: { createdAt: { gte: prevPeriodFrom, lte: prevPeriodTo } } }),
    prisma.vendorProfile.count({ where: { createdAt: { gte: periodFrom, lte: periodTo } } }),
    prisma.vendorProfile.count({ where: { createdAt: { gte: prevPeriodFrom, lte: prevPeriodTo } } }),
    prisma.product.count({ where: { isActive: true, createdAt: { gte: periodFrom, lte: periodTo } } }),
    prisma.rfpQuote.aggregate({ _sum: { total: true }, where: { createdAt: { gte: periodFrom, lte: periodTo } } }),
    prisma.rfpQuote.aggregate({ _sum: { total: true }, where: { createdAt: { gte: prevPeriodFrom, lte: prevPeriodTo } } }),
    prisma.rfp.count({ where: { status: 'ACCEPTED', updatedAt: { gte: periodFrom, lte: periodTo } } }),
    prisma.rfp.count({ where: { status: { in: ['REJECTED', 'DECLINED'] }, updatedAt: { gte: periodFrom, lte: periodTo } } }),
    prisma.customDesignRequest.count({ where: { createdAt: { gte: periodFrom, lte: periodTo } } }),
  ])

  /* ── BATCH 2: Heavier joins / timeseries ─────────────────────── */
  const [
    quotesWithRfp,
    activeVendorIds,
    rfpTimeseries,
    topProductsRaw,
    quoteResponseSample,
    productionStages,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.rfpQuote.findMany({
      select: {
        total: true, createdAt: true,
        rfp: { select: {
          status: true,
          vendorProfile: { select: { id: true, companyName: true, country: true, logoUrl: true } },
        } },
      },
      take: 1000,
      orderBy: { createdAt: 'desc' },
    }),

    prisma.rfp.findMany({
      where: { createdAt: { gte: thirtyDaysAgo } },
      select: { vendorProfileId: true },
      distinct: ['vendorProfileId'],
    }),

    prisma.rfp.findMany({
      where: { createdAt: { gte: twelveMonths } },
      select: { createdAt: true, status: true },
      take: 5000,
    }),

    prisma.rfpItem.groupBy({
      by: ['productId'],
      where: { productId: { not: null } },
      _count: { id: true },
      _sum: { quantity: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),

    prisma.rfp.findMany({
      where: { submittedAt: { not: null }, respondedAt: { not: null } },
      select: { submittedAt: true, respondedAt: true },
      take: 100,
      orderBy: { respondedAt: 'desc' },
    }),

    prisma.productionOrder.groupBy({
      by: ['currentStage'],
      _count: { id: true },
      where: { status: { notIn: ['COMPLETED', 'CANCELLED'] } },
    }).catch(() => [] as { currentStage: string; _count: { id: number } }[]),

    prisma.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 6 }),
  ])

  /* ── Derived calculations ────────────────────────────────────── */

  const totalQuoteValue    = quoteAggregateAll._sum.total       ?? 0
  const acceptedRevenue    = quoteAggregateAccepted._sum.total  ?? 0
  const avgQuoteValue      = quoteAggregateAll._avg.total       ?? 0

  /* Period-specific values */
  const periodQuoteValue     = quoteAggregatePeriod._sum.total     ?? 0
  const prevPeriodQuoteValue = quoteAggregatePrevPeriod._sum.total ?? 0

  const rfpTrend       = trend(rfpInPeriod,      rfpInPrevPeriod)
  const vendorTrend    = trend(newVendorInPeriod, newVendorInPrevPeriod)
  const quoteTrend     = trend(periodQuoteValue,  prevPeriodQuoteValue)

  /* Win rate — for selected period */
  const periodDecisionTotal = rfpAcceptedInPeriod + rfpRejectedInPeriod
  const periodWinRate       = periodDecisionTotal > 0
    ? (rfpAcceptedInPeriod / periodDecisionTotal) * 100
    : 0

  /* All-time win rate */
  const decisionTotal = rfpAccepted + rfpRejected
  const winRate       = decisionTotal > 0 ? (rfpAccepted / decisionTotal) * 100 : 0

  /* Avg response time */
  const responseDeltas = quoteResponseSample.map(r =>
    daysBetween(r.submittedAt as Date, r.respondedAt as Date)
  ).filter(d => d >= 0)
  const avgResponseDays = responseDeltas.length
    ? Math.round(responseDeltas.reduce((s, d) => s + d, 0) / responseDeltas.length)
    : 0

  /* Vendor activity */
  const activeVendorRecentCount = activeVendorIds.length
  const dormantVendorCount      = approvedVendorCount - activeVendorRecentCount
  const vendorRetentionRate     = approvedVendorCount > 0 ? (activeVendorRecentCount / approvedVendorCount) * 100 : 0

  /* Top vendors by revenue */
  const vendorRevenueMap = new Map<string, {
    id: string; name: string; country: string; logoUrl: string | null;
    revenue: number; rfpCount: number; acceptedRevenue: number;
  }>()
  for (const q of quotesWithRfp) {
    const vp = q.rfp?.vendorProfile
    if (!vp) continue
    const existing = vendorRevenueMap.get(vp.id) ?? {
      id: vp.id, name: vp.companyName, country: vp.country, logoUrl: vp.logoUrl,
      revenue: 0, rfpCount: 0, acceptedRevenue: 0,
    }
    existing.revenue += q.total
    existing.rfpCount += 1
    if (q.rfp?.status === 'ACCEPTED') existing.acceptedRevenue += q.total
    vendorRevenueMap.set(vp.id, existing)
  }
  const topVendors = [...vendorRevenueMap.values()]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const top3Revenue      = topVendors.slice(0, 3).reduce((s, v) => s + v.revenue, 0)
  const concentrationPct = totalQuoteValue > 0 ? (top3Revenue / totalQuoteValue) * 100 : 0

  /* 12-month bar chart */
  const monthBuckets = new Map<string, { rfps: number; accepted: number }>()
  for (let i = 11; i >= 0; i--) {
    const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    monthBuckets.set(key, { rfps: 0, accepted: 0 })
  }
  for (const r of rfpTimeseries) {
    const k = `${r.createdAt.getFullYear()}-${String(r.createdAt.getMonth() + 1).padStart(2, '0')}`
    const b = monthBuckets.get(k)
    if (b) { b.rfps += 1; if (r.status === 'ACCEPTED') b.accepted += 1 }
  }
  const monthSeries = [...monthBuckets.entries()].map(([key, val]) => {
    const [y, m] = key.split('-')
    const d = new Date(parseInt(y), parseInt(m) - 1, 1)
    return { label: d.toLocaleDateString('en-GB', { month: 'short' }), key, ...val }
  })
  const maxMonthRfp = Math.max(...monthSeries.map(m => m.rfps), 1)

  /* Top products */
  const topProductIds  = topProductsRaw.map(t => t.productId).filter((x): x is string => !!x)
  const topProductData = topProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: topProductIds } },
        select: { id: true, name: true, sku: true, category: true, basePrice: true,
          images: { select: { url: true }, take: 1 } },
      })
    : []
  const productMap = new Map(topProductData.map(p => [p.id, p]))
  const topProducts = topProductsRaw.map(t => ({
    product:  t.productId ? productMap.get(t.productId) : null,
    rfpCount: t._count.id,
    qty:      t._sum.quantity ?? 0,
  })).filter(t => t.product)
  const maxProductRfp = Math.max(...topProducts.map(t => t.rfpCount), 1)

  const productsNoImage = await prisma.product.count({
    where: { isActive: true, images: { none: {} } }
  }).catch(() => 0)

  /* Pipeline */
  const pipelineTotal = rfpSubmitted + rfpUnderReview + rfpQuoted + rfpAccepted || 1
  const pipeline = [
    { label: 'Submitted',    count: rfpSubmitted,    color: 'bg-sky-400',     text: 'text-sky-600'     },
    { label: 'Under Review', count: rfpUnderReview,  color: 'bg-amber-400',   text: 'text-amber-600'   },
    { label: 'Quoted',       count: rfpQuoted,       color: 'bg-violet-400',  text: 'text-violet-600'  },
    { label: 'Accepted',     count: rfpAccepted,     color: 'bg-emerald-400', text: 'text-emerald-600' },
  ]

  const totalVendors    = approvedVendorCount + pendingVendorCount + rejectedVendorCount
  const maxCountryCount = vendorsByCountry[0]?._count?.id ?? 1
  const productionTotal = productionQueued + productionInProgress + productionOnHold + productionCompleted

  const STAGE_LABELS: Record<string, string> = {
    PENDING: 'Pending', MOLDING: 'Molding', DRYING: 'Drying',
    FINISHING: 'Finishing', GLAZING: 'Glazing', QUALITY_CHECK: 'QC',
    PACKAGING: 'Packaging', READY: 'Ready',
  }

  return (
    <div className="space-y-5 pb-8">

      {/* ══ HEADER ══════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between gap-4 pt-1">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-terracotta mb-1.5">Admin Portal</p>
          <h1 className="font-heading text-3xl font-bold text-stone-800 tracking-tight leading-tight">
            {greeting}, {session.user.name ?? 'Admin'}
          </h1>
          <p className="text-sm text-stone-400 mt-1">{dateLabel}</p>
          {weatherLine && (
            <p className="text-sm text-stone-400 mt-0.5 flex items-center gap-1.5">
              <span>🌤</span>
              {weatherLine}
            </p>
          )}
        </div>

        {(openRfpCount > 0 || pendingAppCount > 0 || rfpStale > 0) && (
          <div className="flex items-center gap-2 flex-shrink-0 mt-1 flex-wrap">
            {rfpStale > 0 && (
              <Link href="/admin/rfps"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors">
                <span className="font-heading text-xl font-bold text-rose-500 leading-none">{rfpStale}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500/80">Stale RFPs</span>
              </Link>
            )}
            {openRfpCount > 0 && (
              <Link href="/admin/rfps"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-terracotta/10 border border-terracotta/25 hover:bg-terracotta/15 transition-colors">
                <span className="font-heading text-xl font-bold text-terracotta leading-none">{openRfpCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-terracotta/70">Open RFPs</span>
              </Link>
            )}
            {pendingAppCount > 0 && (
              <Link href="/admin/vendors"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-50 border border-amber-200 hover:bg-amber-100 transition-colors">
                <span className="font-heading text-xl font-bold text-amber-700 leading-none">{pendingAppCount}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600/80">Applications</span>
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ══ DATE RANGE FILTER ═══════════════════════════════════════ */}
      <DateRangeFilter
        preset={activePreset}
        fromIso={fromIso}
        toIso={toIso}
        periodLabel={periodLabel}
        dayCount={periodDays}
      />

      {/* ══ ALERT STRIP ═════════════════════════════════════════════ */}
      {(openRfpCount > 0 || pendingAppCount > 0 || rfpStale > 0 || productionLate > 0) && (
        <div className="flex items-center gap-4 px-5 py-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex-wrap">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-amber-800 flex-1 min-w-0">
            {[
              rfpStale > 0       && `${rfpStale} stale RFP${rfpStale !== 1 ? 's' : ''} (>7 days)`,
              openRfpCount > 0    && `${openRfpCount} awaiting review`,
              pendingAppCount > 0 && `${pendingAppCount} pending application${pendingAppCount !== 1 ? 's' : ''}`,
              productionLate > 0  && `${productionLate} production order${productionLate !== 1 ? 's' : ''} overdue`,
            ].filter(Boolean).join(' · ')}
          </p>
          <Link href="/admin/rfps"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 transition-colors">
            <FileText className="w-3 h-3" /> Review
          </Link>
        </div>
      )}

      {/* ══ ROW 1 — PERIOD KPIs (big number = period, footnote = all-time) ══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* Quotes issued in period */}
        <div className="bg-white rounded-2xl border border-[#ECEAE5] p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-emerald-600" />
            </div>
            <p className={`text-[10px] font-semibold flex items-center gap-0.5 ${quoteTrend.up ? 'text-emerald-600' : 'text-rose-400'}`}>
              {quoteTrend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {quoteTrend.label}
            </p>
          </div>
          <p className="font-heading text-2xl font-bold text-stone-800 leading-none mb-1">{fmtCurrency(periodQuoteValue)}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Quotes Issued</p>
          <p className="text-[10px] text-stone-400">
            All-time: <span className="font-semibold text-stone-500">{fmtCurrency(totalQuoteValue)}</span>
            {' · '}<span className="text-emerald-600 font-semibold">{fmtCurrency(acceptedRevenue)}</span> accepted
          </p>
        </div>

        {/* Win rate in period */}
        <div className="bg-white rounded-2xl border border-[#ECEAE5] p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Target className="w-5 h-5 text-violet-500" />
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span className="text-emerald-600 font-semibold">{rfpAcceptedInPeriod}W</span>
              <span className="text-stone-300">/</span>
              <span className="text-rose-400 font-semibold">{rfpRejectedInPeriod}L</span>
            </div>
          </div>
          <p className="font-heading text-3xl font-bold text-stone-800 leading-none mb-1">{fmtPct(periodWinRate)}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Win Rate</p>
          <p className="text-[10px] text-stone-400">
            All-time: <span className="font-semibold text-stone-500">{fmtPct(winRate)}</span>
            {' · '}{decisionTotal} decided
          </p>
        </div>

        {/* Response SLA — inherently all-time avg, label it clearly */}
        <div className="bg-white rounded-2xl border border-[#ECEAE5] p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center">
              <Hourglass className="w-5 h-5 text-sky-500" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-sky-50 text-sky-500 border border-sky-100">avg all-time</span>
          </div>
          <p className="font-heading text-3xl font-bold text-stone-800 leading-none mb-1">
            {avgResponseDays}<span className="text-base text-stone-400 font-normal ml-1">days</span>
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Response SLA</p>
          <p className="text-[10px] text-stone-400">submitted → quoted</p>
        </div>

        {/* RFPs submitted in period */}
        <Link href="/admin/rfps"
          className="group bg-white rounded-2xl border border-[#ECEAE5] p-5 hover:border-violet-200 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <FileText className="w-5 h-5 text-violet-500" />
            </div>
            <p className={`text-[10px] font-semibold flex items-center gap-0.5 ${rfpTrend.up ? 'text-emerald-600' : 'text-rose-400'}`}>
              {rfpTrend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {rfpTrend.label}
            </p>
          </div>
          <p className="font-heading text-3xl font-bold text-stone-800 leading-none mb-1">{rfpInPeriod}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">RFPs Submitted</p>
          <p className="text-[10px] text-stone-400">
            All-time: <span className="font-semibold text-stone-500">{totalRfpCount}</span>
            {' · '}{openRfpCount} open
          </p>
        </Link>
      </div>

      {/* ══ ROW 2 — SECONDARY PERIOD STATS ════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">

        {/* New vendors in period */}
        <Link href="/admin/vendors"
          className="group bg-white rounded-2xl border border-[#ECEAE5] p-5 hover:border-sage/40 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-amber-500" />
            </div>
            <p className={`text-[10px] font-semibold flex items-center gap-0.5 ${vendorTrend.up ? 'text-emerald-600' : 'text-rose-400'}`}>
              {vendorTrend.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {vendorTrend.label}
            </p>
          </div>
          <p className="font-heading text-3xl font-bold text-stone-800 leading-none mb-1">{newVendorInPeriod}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">New Vendors</p>
          <p className="text-[10px] text-stone-400">
            Approved: <span className="font-semibold text-stone-500">{approvedVendorCount}</span>
            {pendingVendorCount > 0 && <span className="text-amber-600 font-semibold"> · {pendingVendorCount} pending</span>}
          </p>
        </Link>

        {/* Active Products (current state + period additions) */}
        <Link href="/admin/products"
          className="group bg-white rounded-2xl border border-[#ECEAE5] p-5 hover:border-terracotta/30 hover:shadow-warm-sm transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center">
              <Package className="w-5 h-5 text-terracotta" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-terracotta group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-heading text-3xl font-bold text-stone-800 leading-none mb-1">{productCount}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Active Products</p>
          <div className="flex items-center gap-2 text-[10px] text-stone-400">
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{featuredProductCount} featured</span>
            {newProductInPeriod > 0 && <span className="text-emerald-600 font-semibold">+{newProductInPeriod} period</span>}
          </div>
        </Link>

        {/* Custom Designs in period */}
        <Link href="/admin/custom-designs"
          className="group bg-white rounded-2xl border border-[#ECEAE5] p-5 hover:border-violet-200 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-violet-500" />
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-violet-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <p className="font-heading text-3xl font-bold text-stone-800 leading-none mb-1">{customDesignInPeriod}</p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Custom Designs</p>
          <p className="text-[10px] text-stone-400">
            All-time: <span className="font-semibold text-stone-500">{customDesignTotal}</span>
            {customDesignPending > 0 && <span className="text-amber-600 font-semibold"> · {customDesignPending} pending</span>}
          </p>
        </Link>

        {/* Vendor engagement (always 30d — current health signal) */}
        <Link href="/admin/vendors"
          className="group bg-white rounded-2xl border border-[#ECEAE5] p-5 hover:border-sage/40 hover:shadow-sm transition-all">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl bg-sage/15 flex items-center justify-center">
              <Activity className="w-5 h-5 text-sage-600" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-stone-50 text-stone-400 border border-[#ECEAE5]">30d</span>
          </div>
          <p className="font-heading text-3xl font-bold text-stone-800 leading-none mb-1">
            {activeVendorRecentCount}<span className="text-stone-300 font-normal text-xl">/{approvedVendorCount}</span>
          </p>
          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">Active Vendors</p>
          <p className="text-[10px] text-stone-400">
            {fmtPct(vendorRetentionRate)} engagement · {dormantVendorCount} dormant
          </p>
        </Link>
      </div>

      {/* ══ ROW 3 — REVENUE TREND CHART (12-MONTH, always fixed) ════ */}
      <div className="bg-white rounded-2xl border border-[#ECEAE5] p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 mb-0.5">12-Month Trend</p>
            <h2 className="font-heading text-base font-bold text-stone-800">RFP Activity & Wins</h2>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-stone-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-stone-300" /> RFPs received</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Accepted</span>
          </div>
        </div>

        <div className="flex items-end justify-between gap-1.5 h-40">
          {monthSeries.map((m, i) => {
            const totalH    = (m.rfps     / maxMonthRfp) * 100
            const acceptedH = (m.accepted / maxMonthRfp) * 100
            /* Highlight months that overlap with selected period */
            const monthStart = new Date(parseInt(m.key.split('-')[0]), parseInt(m.key.split('-')[1]) - 1, 1)
            const monthEnd   = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0, 23, 59, 59)
            const inPeriod   = monthStart <= periodTo && monthEnd >= periodFrom
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="w-full h-full flex items-end relative">
                  <div
                    className={`w-full rounded-md relative overflow-hidden transition-all ${inPeriod ? 'bg-terracotta/20 ring-1 ring-terracotta/30' : 'bg-stone-100'}`}
                    style={{ height: `${Math.max(totalH, 4)}%` }}
                  >
                    <div
                      className={`absolute bottom-0 left-0 right-0 rounded-md ${inPeriod ? 'bg-terracotta' : 'bg-emerald-300'}`}
                      style={{ height: `${(acceptedH / Math.max(totalH, 1)) * 100}%` }}
                    />
                  </div>
                  <span className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-stone-700 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none bg-white border border-[#ECEAE5] rounded-md px-1.5 py-0.5 shadow-sm">
                    {m.rfps} ({m.accepted} won)
                  </span>
                </div>
                <span className={`text-[9px] font-semibold ${inPeriod ? 'text-terracotta' : 'text-stone-400'}`}>{m.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ ROW 4 — PIPELINE + VENDOR BREAKDOWN ═════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#ECEAE5] p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 mb-0.5">Pipeline Overview</p>
              <h2 className="font-heading text-base font-bold text-stone-800">{totalRfpCount} Total RFPs</h2>
            </div>
            <Link href="/admin/rfps"
              className="inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 mb-5">
            {pipeline.map(p => (
              <div key={p.label} className={`${p.color} rounded-full transition-all`}
                style={{ width: `${(p.count / pipelineTotal) * 100}%`, minWidth: p.count > 0 ? '4px' : '0' }} />
            ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {pipeline.map(p => (
              <div key={p.label} className="text-center p-3 rounded-xl bg-stone-50">
                <p className={`font-heading text-2xl font-bold leading-none mb-1 ${p.text}`}>{p.count}</p>
                <p className="text-[10px] font-semibold text-stone-400 leading-tight">{p.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-[#F0EBE8] grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-heading text-lg font-bold text-stone-700">{rfpDraft}</p>
              <p className="text-[10px] text-stone-400 font-medium">Drafts</p>
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-rose-500">{rfpStale}</p>
              <p className="text-[10px] text-stone-400 font-medium">Stale (&gt;7d)</p>
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-amber-600">{rfpRevisionRequested}</p>
              <p className="text-[10px] text-stone-400 font-medium">Revision Requested</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-[#ECEAE5] p-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 mb-0.5">Vendor Registry</p>
          <h2 className="font-heading text-base font-bold text-stone-800 mb-5">{totalVendors} Total</h2>

          <div className="space-y-3">
            {[
              { icon: ShieldCheck, label: 'Approved', count: approvedVendorCount, bg: 'bg-emerald-50', icColor: 'text-emerald-500', barColor: 'bg-emerald-400', text: 'text-emerald-600' },
              { icon: Clock,       label: 'Pending',  count: pendingVendorCount,  bg: 'bg-amber-50',   icColor: 'text-amber-500',   barColor: 'bg-amber-400',   text: 'text-amber-600' },
              { icon: ShieldAlert, label: 'Rejected', count: rejectedVendorCount, bg: 'bg-rose-50',    icColor: 'text-rose-400',    barColor: 'bg-rose-400',    text: 'text-rose-400' },
            ].map(row => {
              const Icon = row.icon
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${row.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-4 h-4 ${row.icColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-stone-600">{row.label}</span>
                      <span className={`font-heading text-sm font-bold ${row.text}`}>{row.count}</span>
                    </div>
                    <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
                      <div className={`h-full ${row.barColor} rounded-full`} style={{ width: `${totalVendors ? (row.count / totalVendors) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 pt-4 border-t border-[#F0EBE8] grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="font-heading text-lg font-bold text-emerald-600">{activeVendorRecentCount}</p>
              <p className="text-[10px] text-stone-400 font-medium">Active 30d</p>
            </div>
            <div>
              <p className="font-heading text-lg font-bold text-stone-400">{dormantVendorCount}</p>
              <p className="text-[10px] text-stone-400 font-medium">Dormant</p>
            </div>
          </div>
        </div>
      </div>

      {/* ══ ROW 5 — TOP VENDORS + TOP PRODUCTS ══════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">

        <div className="bg-white rounded-2xl border border-[#ECEAE5] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-4 h-4 text-amber-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Key Accounts</p>
              <h2 className="font-heading text-sm font-bold text-stone-800">Top vendors by quote value</h2>
            </div>
            {concentrationPct > 40 && (
              <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-200">
                ⚠ {fmtPct(concentrationPct)} concentration
              </span>
            )}
          </div>

          {topVendors.length > 0 ? (
            <div className="space-y-2.5">
              {topVendors.map((v, i) => {
                const pct = (v.revenue / topVendors[0].revenue) * 100
                return (
                  <Link key={v.id} href={`/admin/vendors/${v.id}`}
                    className="flex items-center gap-3 px-3 py-2 -mx-3 rounded-xl hover:bg-stone-50 transition-colors group">
                    <span className="text-[10px] font-bold text-stone-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                    {v.logoUrl ? (
                      <div className="w-8 h-8 rounded-lg border border-[#ECEAE5] bg-white overflow-hidden flex-shrink-0">
                        <img src={v.logoUrl} alt={v.name} className="w-full h-full object-contain p-0.5" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-terracotta/15 flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold text-terracotta">{v.name.slice(0,2).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-700 truncate">{v.name}</p>
                      <div className="h-1 bg-stone-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: i === 0 ? '#C86E4B' : i === 1 ? '#D4956A' : '#E0B896' }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-stone-700">{fmtCurrency(v.revenue)}</p>
                      <p className="text-[10px] text-stone-400">{v.rfpCount} quote{v.rfpCount !== 1 ? 's' : ''}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-stone-400 italic">No quote data yet.</p>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-[#ECEAE5] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-4 h-4 text-orange-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Demand Signal</p>
              <h2 className="font-heading text-sm font-bold text-stone-800">Most requested products</h2>
            </div>
          </div>

          {topProducts.length > 0 ? (
            <div className="space-y-2">
              {topProducts.slice(0, 6).map((t, i) => {
                const pct = (t.rfpCount / maxProductRfp) * 100
                return (
                  <Link key={t.product!.id} href={`/admin/products/${t.product!.id}`}
                    className="flex items-center gap-3 px-3 py-2 -mx-3 rounded-xl hover:bg-stone-50 transition-colors">
                    <span className="text-[10px] font-bold text-stone-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                    {t.product!.images?.[0]?.url ? (
                      <div className="w-9 h-9 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0">
                        <img src={t.product!.images[0].url} alt={t.product!.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 text-stone-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-700 truncate">{t.product!.name}</p>
                      <div className="h-1 bg-stone-100 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-orange-300 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-stone-700">{t.rfpCount}×</p>
                      <p className="text-[10px] text-stone-400">{t.qty} units</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-stone-400 italic">No product RFPs yet.</p>
          )}
        </div>
      </div>

      {/* ══ ROW 6 — VENDOR GEOGRAPHY + SECONDARY ════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">

        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#ECEAE5] p-6">
          <div className="flex items-center gap-2 mb-5">
            <Globe className="w-4 h-4 text-terracotta" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Vendor Geography</p>
              <h2 className="font-heading text-sm font-bold text-stone-800">Top markets by approved vendors</h2>
            </div>
          </div>

          {vendorsByCountry.length > 0 ? (
            <div className="space-y-3">
              {vendorsByCountry.map((row, i) => {
                const pct = Math.round((row._count.id / maxCountryCount) * 100)
                return (
                  <div key={row.country} className="flex items-center gap-3">
                    <span className="text-[10px] font-bold text-stone-300 w-4 text-right flex-shrink-0">{i + 1}</span>
                    <span className="text-sm font-semibold text-stone-700 w-24 flex-shrink-0 truncate">{row.country || 'Unknown'}</span>
                    <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: i === 0 ? '#C86E4B' : i === 1 ? '#D4956A' : '#E0B896' }} />
                    </div>
                    <span className="text-sm font-bold text-stone-600 w-6 text-right flex-shrink-0">{row._count.id}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-stone-400 italic">No approved vendors yet.</p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/admin/users"
            className="group flex items-center gap-4 bg-white rounded-2xl border border-[#ECEAE5] px-5 py-4 hover:border-stone-300 hover:shadow-sm transition-all">
            <div className="w-10 h-10 rounded-xl bg-stone-100 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-stone-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-heading text-2xl font-bold text-stone-800 leading-none">{userCount}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">System Users</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
          </Link>

          <Link
            href="/admin/vendors"
            className={`group flex items-center gap-4 rounded-2xl border px-5 py-4 transition-all ${
              pendingAppCount > 0
                ? 'bg-amber-50 border-amber-200 hover:bg-amber-100'
                : 'bg-white border-[#ECEAE5] hover:border-stone-300 hover:shadow-sm'
            }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${pendingAppCount > 0 ? 'bg-amber-100' : 'bg-stone-100'}`}>
              <UserPlus className={`w-5 h-5 ${pendingAppCount > 0 ? 'text-amber-600' : 'text-stone-500'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`font-heading text-2xl font-bold leading-none ${pendingAppCount > 0 ? 'text-amber-700' : 'text-stone-800'}`}>
                {pendingAppCount}
              </p>
              <p className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 ${pendingAppCount > 0 ? 'text-amber-600' : 'text-stone-400'}`}>
                Pending Applications
              </p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>

      {/* ══ ROW 7 — CATALOG HEALTH ══════════════════════════════════ */}
      <div className="bg-white rounded-2xl border border-[#ECEAE5] p-6">
        <div className="flex items-center gap-2 mb-5">
          <Layers className="w-4 h-4 text-terracotta" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Catalog Health</p>
            <h2 className="font-heading text-sm font-bold text-stone-800">Quality gaps and completeness</h2>
          </div>
          <Link href="/admin/products"
            className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
            Manage <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'No images',   value: productsNoImage,    Icon: AlertOctagon, color: productsNoImage    > 0 ? 'text-rose-500'  : 'text-emerald-500' },
            { label: 'No price',    value: productsNoPrice,    Icon: Banknote,     color: productsNoPrice    > 0 ? 'text-amber-500' : 'text-emerald-500' },
            { label: 'No category', value: productsNoCategory, Icon: Layers,       color: productsNoCategory > 0 ? 'text-amber-500' : 'text-emerald-500' },
            { label: 'Featured',    value: featuredProductCount, Icon: Star,       color: 'text-amber-500' },
          ].map(g => {
            const Icon = g.Icon
            return (
              <div key={g.label} className="p-4 rounded-xl bg-stone-50 border border-stone-100">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${g.color}`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider text-stone-400">{g.label}</span>
                </div>
                <p className={`font-heading text-2xl font-bold leading-none ${g.color}`}>{g.value}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ══ ROW 8 — PRODUCTION OVERVIEW ═════════════════════════════ */}
      {productionTotal > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="lg:col-span-2 bg-white rounded-2xl border border-[#ECEAE5] p-6">
            <div className="flex items-center gap-2 mb-5">
              <Factory className="w-4 h-4 text-stone-600" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Production Floor</p>
                <h2 className="font-heading text-sm font-bold text-stone-800">{productionTotal} orders tracked</h2>
              </div>
              {productionLate > 0 && (
                <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-500 border border-rose-200">
                  ⚠ {productionLate} overdue
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              {[
                { label: 'Queued',      value: productionQueued,     color: 'text-stone-600',   bg: 'bg-stone-50' },
                { label: 'In Progress', value: productionInProgress, color: 'text-violet-600',  bg: 'bg-violet-50' },
                { label: 'On Hold',     value: productionOnHold,     color: 'text-amber-600',   bg: 'bg-amber-50' },
                { label: 'Completed',   value: productionCompleted,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
              ].map(s => (
                <div key={s.label} className={`text-center p-3 rounded-xl ${s.bg}`}>
                  <p className={`font-heading text-2xl font-bold leading-none mb-1 ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] font-semibold text-stone-500 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>

            {productionStages.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-2">Active Stages</p>
                <div className="flex flex-wrap gap-2">
                  {productionStages.map(s => (
                    <span key={s.currentStage} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-50 border border-stone-100 text-xs">
                      <Hammer className="w-3 h-3 text-stone-400" />
                      <span className="font-semibold text-stone-700">{STAGE_LABELS[s.currentStage] ?? s.currentStage}</span>
                      <span className="font-bold text-stone-500">{s._count.id}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-[#ECEAE5] p-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400 mb-1">Production Risk</p>
            <h2 className="font-heading text-sm font-bold text-stone-800 mb-5">Action signals</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50">
                <Zap className="w-4 h-4 text-rose-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-rose-600">{productionLate} overdue</p>
                  <p className="text-[10px] text-rose-400">past estimated date</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50">
                <Flame className="w-4 h-4 text-orange-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-orange-600">{productionUrgent} high priority</p>
                  <p className="text-[10px] text-orange-400">requires attention</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50">
                <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-amber-600">{productionOnHold} on hold</p>
                  <p className="text-[10px] text-amber-400">awaiting resolution</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ ROW 9 — RECENT ACTIVITY ═════════════════════════════════ */}
      {recentAuditLogs.length > 0 && (
        <div className="bg-white rounded-2xl border border-[#ECEAE5] p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-stone-500" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-400">Audit Trail</p>
              <h2 className="font-heading text-sm font-bold text-stone-800">Recent system activity</h2>
            </div>
          </div>
          <div className="space-y-2">
            {recentAuditLogs.map(log => (
              <div key={log.id} className="flex items-center gap-3 px-3 py-2 -mx-3 rounded-lg hover:bg-stone-50 transition-colors">
                <div className="w-1 h-6 rounded-full bg-terracotta/40 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-700 truncate">
                    <span className="font-mono text-stone-400">{log.action}</span>
                    <span className="text-stone-400 mx-1.5">·</span>
                    <span className="text-stone-500">{log.entityType}</span>
                  </p>
                </div>
                <span className="text-[10px] text-stone-400 flex-shrink-0">{relTime(log.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ RFP INBOX ═══════════════════════════════════════════════ */}
      <Suspense
        fallback={
          <div className="bg-white rounded-2xl border border-[#ECEAE5] px-6 py-10 text-center">
            <Inbox className="w-6 h-6 text-stone-300 mx-auto mb-2" />
            <p className="text-sm text-stone-400">Loading RFP inbox…</p>
          </div>
        }
      >
        <RfpInbox />
      </Suspense>

    </div>
  )
}
