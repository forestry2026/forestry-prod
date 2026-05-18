'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Search, X, Calendar, ChevronLeft, ChevronRight, Clock, ChevronDown,
  UserCheck, UserX, UserMinus, Mail, Plus, Pencil, Trash2, Copy,
  Sparkles, FileText, Circle, Archive, ArchiveRestore, Play, CheckCircle,
} from 'lucide-react'
import { getActionConfig } from '@/lib/activityLogConfig'

// ── Icon registry ──────────────────────────────────────────────────────────────
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  UserCheck, UserX, UserMinus, Mail, Plus, Pencil, Trash2, Copy,
  Sparkles, FileText, Circle, Archive, ArchiveRestore, Play, CheckCircle,
}

// ── Types ──────────────────────────────────────────────────────────────────────
interface ActivityItem {
  id:         string
  action:     string
  entityType: string
  entityId:   string
  details:    string | null
  actorName:  string | null
  actorRole:  string | null
  ipAddress:  string | null
  createdAt:  string
}

interface ApiResp {
  items:      ActivityItem[]
  total:      number
  page:       number
  pageSize:   number
  totalPages: number
}

interface Props { rfpId: string }

// ── Time helpers ───────────────────────────────────────────────────────────────
const RANGE_PRESETS = [
  { key: '7',   label: 'Last 7 days' },
  { key: '30',  label: 'Last 30 days' },
  { key: 'all', label: 'All time' },
]

function fmtDateTime(iso: string) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ', ' +
    d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
  )
}
function fmtDay(iso: string) {
  const d = new Date(iso)
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const yest  = new Date(today.getTime() - 86_400_000)
  const day   = new Date(d); day.setHours(0, 0, 0, 0)
  if (day.getTime() === today.getTime()) return 'Today'
  if (day.getTime() === yest.getTime())  return 'Yesterday'
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long',
    year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric',
  })
}
function relTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime()
  const m  = Math.round(ms / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 30) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

const ROLE_PILL: Record<string, string> = {
  ADMIN:      'bg-terracotta/10 text-terracotta',
  MANAGER:    'bg-blue-50 text-blue-700',
  VENDOR:     'bg-emerald-50 text-emerald-700',
  PRODUCTION: 'bg-purple-50 text-purple-700',
}

// ── Component ──────────────────────────────────────────────────────────────────
export function RfpActivityLog({ rfpId }: Props) {
  const [open,    setOpen]    = useState(false)
  const [data,    setData]    = useState<ApiResp | null>(null)
  const [loading, setLoading] = useState(false)
  const [page,    setPage]    = useState(1)
  const [q,       setQ]       = useState('')
  const [debQ,    setDebQ]    = useState('')
  const [range,   setRange]   = useState('all')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebQ(q), 250)
    return () => clearTimeout(t)
  }, [q])

  // Fetch (only when open)
  useEffect(() => {
    if (!open) return
    let alive = true
    setLoading(true)
    const sp = new URLSearchParams()
    sp.set('page', String(page))
    sp.set('pageSize', '25')
    if (debQ)         sp.set('q', debQ)
    if (range !== 'all') sp.set('recentDays', range)

    fetch(`/api/rfp/${rfpId}/activity?${sp}`, { cache: 'no-store' })
      .then(r => r.json())
      .then(d => { if (alive) setData(d) })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [rfpId, page, debQ, range, open])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [debQ, range])

  // Group by day
  const grouped = useMemo(() => {
    if (!data?.items) return [] as { day: string; items: ActivityItem[] }[]
    const map = new Map<string, ActivityItem[]>()
    for (const it of data.items) {
      const key = fmtDay(it.createdAt)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(it)
    }
    return Array.from(map.entries()).map(([day, items]) => ({ day, items }))
  }, [data])

  const isFiltered = debQ || range !== 'all'

  return (
    <div className="bg-white rounded-2xl border border-cream-darker shadow-card overflow-hidden">

      {/* ── Header (always visible, clickable toggle) ── */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 bg-gradient-to-br from-cream/40 to-white hover:from-cream/60 transition-colors group"
        aria-expanded={open}
      >
        <div className="flex items-center gap-3">
          <div className="text-left">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta">Audit Trail</p>
            <h2 className="font-heading text-base font-bold text-charcoal-900 leading-tight">Activity Log</h2>
          </div>
          {data && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white border border-cream-darker">
              <Clock className="w-3 h-3 text-charcoal-400" />
              <span className="text-[11px] font-semibold text-charcoal-700">{data.total} event{data.total !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-charcoal-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {/* ── Collapsible body ── */}
      {open && (
        <>
          {/* Filters */}
          <div className="px-6 py-4 border-t border-b border-cream-darker bg-white">
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300 pointer-events-none" />
              <input
                type="text"
                value={q}
                onChange={e => setQ(e.target.value)}
                placeholder="Search actions or details…"
                className="w-full pl-10 pr-9 py-2.5 bg-white border border-cream-darker rounded-xl text-sm text-charcoal-900 placeholder-charcoal-300 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
              />
              {q && (
                <button
                  onClick={() => setQ('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 grid place-items-center rounded-full bg-cream-dark hover:bg-cream-darker text-charcoal-500 transition-colors"
                  aria-label="Clear"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Date range */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 px-1 py-1 rounded-lg bg-white border border-cream-darker">
                <Calendar className="w-3.5 h-3.5 text-charcoal-400 ml-1.5" />
                {RANGE_PRESETS.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setRange(r.key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                      range === r.key
                        ? 'bg-charcoal-900 text-white'
                        : 'text-charcoal-500 hover:text-charcoal-900'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {isFiltered && (
                <button
                  onClick={() => { setQ(''); setRange('all') }}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-charcoal-400 hover:text-terracotta transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* ── Body ── */}
          <div className="px-6 py-5 max-h-[480px] overflow-y-auto">
            {loading && !data && (
              <div className="py-16 text-center text-sm text-charcoal-400">Loading activity…</div>
            )}

            {data && data.items.length === 0 && (
              <div className="py-16 text-center">
                <div className="w-12 h-12 rounded-2xl bg-cream-dark grid place-items-center mx-auto mb-3">
                  <Clock className="w-5 h-5 text-charcoal-300" />
                </div>
                <p className="text-sm font-semibold text-charcoal-700">No activity yet</p>
                <p className="text-xs text-charcoal-400 mt-1">
                  {isFiltered ? 'Try clearing filters.' : 'Actions on this RFP will appear here.'}
                </p>
              </div>
            )}

            {data && data.items.length > 0 && (
              <div className="space-y-6">
                {grouped.map(g => (
                  <div key={g.day}>
                    {/* Day separator */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="font-heading text-[11px] font-bold uppercase tracking-[0.18em] text-charcoal-700">
                        {g.day}
                      </div>
                      <div className="flex-1 h-px bg-cream-darker" />
                      <span className="text-[10px] font-semibold text-charcoal-400">
                        {g.items.length} event{g.items.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {/* Timeline */}
                    <ul className="relative space-y-2 ml-1.5">
                      <span className="absolute left-[7px] top-2 bottom-2 w-px bg-cream-darker" aria-hidden />

                      {g.items.map(item => {
                        const cfg  = getActionConfig(item.action)
                        const Icon = ICONS[cfg.icon] ?? Circle
                        let parsed: Record<string, unknown> | null = null
                        if (item.details) { try { parsed = JSON.parse(item.details) } catch {} }

                        const displayDetails = parsed
                          ? Object.entries(parsed).filter(([k]) => !['actorName', 'actorRole', 'rfpNumber'].includes(k))
                          : []

                        const rolePill = item.actorRole ? (ROLE_PILL[item.actorRole] ?? 'bg-charcoal-100 text-charcoal-600') : null

                        return (
                          <li key={item.id} className="relative flex gap-3 pl-6 group">
                            {/* Dot */}
                            <span className={`absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full ring-4 ring-white grid place-items-center ${cfg.accent}`}>
                              <Icon className="w-2 h-2" />
                            </span>

                            {/* Card */}
                            <div className="flex-1 min-w-0 px-4 py-3 rounded-xl bg-white border border-cream-darker hover:border-terracotta/30 hover:shadow-warm-sm transition-all">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-bold text-charcoal-900 mb-1">{cfg.label}</p>

                                  {item.actorName && (
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <span className="text-xs text-charcoal-500">by</span>
                                      <span className="text-xs font-semibold text-charcoal-800">{item.actorName}</span>
                                      {rolePill && (
                                        <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${rolePill}`}>
                                          {item.actorRole}
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {displayDetails.length > 0 && (
                                    <div className="space-y-0.5 mt-1">
                                      {displayDetails.slice(0, 4).map(([k, v]) => (
                                        <div key={k} className="text-[11px] text-charcoal-500 leading-snug">
                                          <span className="font-semibold text-charcoal-700 capitalize">{k.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                                          <span className="font-mono">
                                            {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {item.ipAddress && (
                                    <p className="text-[10px] text-charcoal-400 mt-1.5 font-mono">IP {item.ipAddress}</p>
                                  )}
                                </div>

                                <div className="flex-shrink-0 text-right">
                                  <p className="text-xs font-semibold text-charcoal-700 whitespace-nowrap">{fmtDateTime(item.createdAt)}</p>
                                  <p className="text-[10px] text-charcoal-400 mt-0.5">{relTime(item.createdAt)}</p>
                                </div>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Pagination ── */}
          {data && data.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-cream-darker bg-cream/30 flex items-center justify-between">
              <span className="text-xs text-charcoal-400">
                Page {data.page} of {data.totalPages} · {data.total} total
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={data.page <= 1 || loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Newer
                </button>
                <button
                  onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}
                  disabled={data.page >= data.totalPages || loading}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-charcoal-700 hover:bg-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Older
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
