'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Search, X, ArrowRight, FileText,
  Filter, CalendarDays, Package, Sparkles,
  ChevronLeft, ChevronRight, Plus, Trash2, Loader2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

/* ── Status config ───────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; badge: string }> = {
  DRAFT:         { label: 'Draft',         badge: 'bg-charcoal-100  text-charcoal-600' },
  SUBMITTED:     { label: 'Submitted',     badge: 'bg-blue-50       text-blue-700'     },
  PENDING:       { label: 'Pending',       badge: 'bg-yellow-50     text-yellow-700'   },
  UNDER_REVIEW:  { label: 'Under Review',  badge: 'bg-yellow-50     text-yellow-700'   },
  QUOTED:        { label: 'Quoted',        badge: 'bg-sage/15       text-sage-600'     },
  APPROVED:      { label: 'Approved',      badge: 'bg-green-50      text-green-700'    },
  IN_PRODUCTION: { label: 'In Production', badge: 'bg-terracotta/10 text-terracotta'   },
  COMPLETED:     { label: 'Completed',     badge: 'bg-charcoal-100  text-charcoal-700' },
  REJECTED:      { label: 'Rejected',      badge: 'bg-red-50        text-red-700'      },
}

const STATUS_TABS = [
  { key: 'ALL',          label: 'All'          },
  { key: 'SUBMITTED',    label: 'Submitted'    },
  { key: 'UNDER_REVIEW', label: 'Under Review' },
  { key: 'QUOTED',       label: 'Quoted'       },
  { key: 'APPROVED',     label: 'Approved'     },
  { key: 'IN_PRODUCTION',label: 'In Production'},
  { key: 'COMPLETED',    label: 'Completed'    },
  { key: 'REJECTED',     label: 'Rejected'     },
  { key: 'ARCHIVED',     label: 'Archived'     },
]

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAYS   = ['Su','Mo','Tu','We','Th','Fr','Sa']

/* ── DatePicker ──────────────────────────────────────────────── */
function DatePicker({
  value, onChange, placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [open,       setOpen]       = useState(false)
  const [viewYear,   setViewYear]   = useState(() => value ? new Date(value).getFullYear()  : new Date().getFullYear())
  const [viewMonth,  setViewMonth]  = useState(() => value ? new Date(value).getMonth()     : new Date().getMonth())
  const ref = useRef<HTMLDivElement>(null)

  // Sync view when value changes externally
  useEffect(() => {
    if (value) {
      const d = new Date(value)
      setViewYear(d.getFullYear())
      setViewMonth(d.getMonth())
    }
  }, [value])

  // Outside click
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const selectedDate = value ? new Date(value + 'T00:00:00') : null
  const today        = new Date(); today.setHours(0,0,0,0)

  // Build calendar grid
  const firstDay  = new Date(viewYear, viewMonth, 1).getDay()
  const daysCount = new Date(viewYear, viewMonth + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ]
  // Pad to full rows
  while (cells.length % 7 !== 0) cells.push(null)

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
  }
  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day)
    const iso = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    onChange(iso)
    setOpen(false)
  }

  const displayValue = selectedDate
    ? selectedDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : ''

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-2.5 px-3 py-2.5 bg-[#FAF7F4] border rounded-xl text-sm transition-all text-left ${
          open
            ? 'border-terracotta ring-2 ring-terracotta/10'
            : 'border-[#EDE7DE] hover:border-terracotta/40'
        } ${value ? 'pr-9' : ''}`}
      >
        <CalendarDays className="w-3.5 h-3.5 text-charcoal-400 flex-shrink-0" />
        <span className={displayValue ? 'text-charcoal-800 font-medium' : 'text-charcoal-300'}>
          {displayValue || placeholder || 'Select date'}
        </span>
      </button>
      {/* Clear — sibling, NOT nested inside button */}
      {value && (
        <span
          role="button"
          tabIndex={0}
          onClick={e => { e.stopPropagation(); onChange('') }}
          onKeyDown={e => e.key === 'Enter' && onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-charcoal-200 hover:bg-charcoal-300 flex items-center justify-center transition-colors cursor-pointer z-10"
        >
          <X className="w-2.5 h-2.5 text-charcoal-600" />
        </span>
      )}

      {/* Calendar dropdown */}
      {open && (
        <div className="absolute top-full mt-2 left-0 z-[60] bg-white border border-[#EDE7DE] rounded-2xl shadow-xl shadow-black/10 p-3 w-64">

          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-charcoal-400 hover:bg-[#F5F0EB] hover:text-charcoal-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-charcoal-800">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-charcoal-400 hover:bg-[#F5F0EB] hover:text-charcoal-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-charcoal-300 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((day, i) => {
              if (!day) return <div key={i} />
              const thisDate = new Date(viewYear, viewMonth, day)
              thisDate.setHours(0,0,0,0)
              const isSelected = selectedDate?.getTime() === thisDate.getTime()
              const isToday    = today.getTime() === thisDate.getTime()
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(day)}
                  className={`
                    aspect-square w-full rounded-lg text-xs font-medium transition-all
                    ${isSelected
                      ? 'bg-terracotta text-white font-bold shadow-sm'
                      : isToday
                        ? 'bg-terracotta/10 text-terracotta font-bold'
                        : 'text-charcoal-700 hover:bg-[#F5F0EB] hover:text-charcoal-900'
                    }
                  `}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Main types ──────────────────────────────────────────────── */
interface Rfp {
  id:          string
  rfpNumber:   string
  status:      string
  projectName: string | null
  submittedAt: string | null
  createdAt:   string
  items:       { quantity: number }[]
  isArchived:  boolean
  vendorProfile: { companyName: string; user: { name: string } }
}

interface Props {
  rfps:         Rfp[]
  statusCounts: Record<string, number>
  readonly?:    boolean
}

interface AdvFilters {
  dateFrom: string
  dateTo:   string
  minUnits: string
  newOnly:  boolean
}

const EMPTY_ADV: AdvFilters = { dateFrom: '', dateTo: '', minUnits: '', newOnly: false }

function countAdvActive(f: AdvFilters): number {
  return (f.dateFrom ? 1 : 0) + (f.dateTo ? 1 : 0) + (f.minUnits ? 1 : 0) + (f.newOnly ? 1 : 0)
}

/* ── RfpListClient ───────────────────────────────────────────── */
export function RfpListClient({ rfps, statusCounts, readonly = false }: Props) {
  const router = useRouter()
  const [query,        setQuery]        = useState('')
  const [activeStatus, setActiveStatus] = useState('ALL')
  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [adv,          setAdv]          = useState<AdvFilters>(EMPTY_ADV)
  const [deletingId,   setDeletingId]   = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; rfpNumber: string } | null>(null)

  async function performDelete() {
    if (!confirmDelete) return
    setDeletingId(confirmDelete.id)
    try {
      const res = await fetch(`/api/rfp/${confirmDelete.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Delete failed')
      }
      setConfirmDelete(null)
      router.refresh()
    } catch (err: any) {
      alert(err?.message ?? 'Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const advCount     = countAdvActive(adv)
  const hasAnyFilter = query.trim() || activeStatus !== 'ALL' || advCount > 0

  const filtered = useMemo(() => {
    let list = rfps

    if (activeStatus === 'ARCHIVED') {
      list = list.filter(r => r.isArchived)
    } else {
      // Exclude archived from all other tabs
      list = list.filter(r => !r.isArchived)
      if (activeStatus !== 'ALL') list = list.filter(r => r.status === activeStatus)
    }

    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r =>
        r.rfpNumber.toLowerCase().includes(q)                 ||
        r.vendorProfile.companyName.toLowerCase().includes(q) ||
        r.vendorProfile.user.name.toLowerCase().includes(q)   ||
        (r.projectName ?? '').toLowerCase().includes(q)       ||
        r.status.toLowerCase().includes(q)
      )
    }

    if (adv.dateFrom) {
      const from = new Date(adv.dateFrom + 'T00:00:00').getTime()
      list = list.filter(r => new Date(r.submittedAt ?? r.createdAt).getTime() >= from)
    }
    if (adv.dateTo) {
      const to = new Date(adv.dateTo + 'T00:00:00').getTime() + 86400000
      list = list.filter(r => new Date(r.submittedAt ?? r.createdAt).getTime() <= to)
    }
    if (adv.minUnits) {
      const min = parseInt(adv.minUnits, 10)
      if (!isNaN(min)) list = list.filter(r => r.items.reduce((s, i) => s + i.quantity, 0) >= min)
    }
    if (adv.newOnly) list = list.filter(r => r.status === 'SUBMITTED')

    return list
  }, [rfps, query, activeStatus, adv])

  const needsAction = (statusCounts['SUBMITTED'] ?? 0) + (statusCounts['UNDER_REVIEW'] ?? 0)
  const inProgress  = (statusCounts['QUOTED'] ?? 0) + (statusCounts['APPROVED'] ?? 0) + (statusCounts['IN_PRODUCTION'] ?? 0)

  function clearAll() { setQuery(''); setActiveStatus('ALL'); setAdv(EMPTY_ADV) }

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Admin Portal</p>
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">RFPs</h1>
          <p className="text-sm text-charcoal-400 mt-1.5">All vendor requests for proposal</p>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 mt-1">
          {!readonly && (
            <Link
              href="/admin/rfps/new"
              className="inline-flex items-center gap-1.5 bg-terracotta hover:bg-[#B85C3B] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-card"
            >
              <Plus className="w-4 h-4" /> Create RFP
            </Link>
          )}
          <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
            <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{rfps.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Total</span>
          </div>
          {needsAction > 0 && (
            <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
              <span className="font-heading text-2xl font-bold text-blue-700 leading-none">{needsAction}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-500 mt-0.5">Needs Review</span>
            </div>
          )}
          {inProgress > 0 && (
            <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-terracotta/8 border border-terracotta/15">
              <span className="font-heading text-2xl font-bold text-terracotta leading-none">{inProgress}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-terracotta/70 mt-0.5">In Progress</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Search + Filter button ────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by RFP number, vendor, project name…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 placeholder-charcoal-300 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-500 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(true)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all shadow-card flex-shrink-0 ${
              advCount > 0
                ? 'bg-terracotta text-white border-terracotta'
                : 'bg-white text-charcoal-700 border-[#E8E0D5] hover:border-terracotta/40'
            }`}
          >
            <Filter className="w-4 h-4" />
            Filters
            {advCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-white/25 text-white text-[10px] font-bold flex items-center justify-center">
                {advCount}
              </span>
            )}
          </button>
        </div>

        {/* Active filter chips */}
        {advCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400">Active:</span>
            {adv.dateFrom && <Chip label={`From ${fmtDate(adv.dateFrom)}`} onRemove={() => setAdv(p => ({ ...p, dateFrom: '' }))} />}
            {adv.dateTo   && <Chip label={`To ${fmtDate(adv.dateTo)}`}     onRemove={() => setAdv(p => ({ ...p, dateTo: '' }))}   />}
            {adv.minUnits && <Chip label={`Min ${adv.minUnits} units`}     onRemove={() => setAdv(p => ({ ...p, minUnits: '' }))} />}
            {adv.newOnly  && <Chip label="New only"                        onRemove={() => setAdv(p => ({ ...p, newOnly: false }))} />}
          </div>
        )}

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {STATUS_TABS.map(tab => {
            const count  = tab.key === 'ALL'
              ? rfps.filter(r => !r.isArchived).length
              : tab.key === 'ARCHIVED'
                ? rfps.filter(r => r.isArchived).length
                : (statusCounts[tab.key] ?? 0)
            const active = activeStatus === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => setActiveStatus(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${
                  active
                    ? 'bg-charcoal-900 text-white shadow-sm'
                    : 'bg-white border border-[#E8E0D5] text-charcoal-500 hover:border-charcoal-300 hover:text-charcoal-700'
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none ${active ? 'bg-white/20 text-white' : 'bg-charcoal-100 text-charcoal-500'}`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── RFP List ─────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card">
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-5">
              <FileText className="w-6 h-6 text-terracotta/40" />
            </div>
            <p className="font-heading text-lg font-bold text-charcoal-900 mb-1">
              {hasAnyFilter ? 'No matching RFPs' : 'No RFPs yet'}
            </p>
            <p className="text-sm text-charcoal-400">
              {query
                ? `No results for "${query}"`
                : activeStatus !== 'ALL'
                  ? `No RFPs with status "${STATUS_CFG[activeStatus]?.label ?? activeStatus}"`
                  : advCount > 0 ? 'Try adjusting your filters'
                  : 'RFPs will appear here once vendors submit them.'}
            </p>
            {hasAnyFilter && (
              <button onClick={clearAll} className="mt-4 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
                Clear all filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {hasAnyFilter && (
            <p className="text-xs text-charcoal-400 px-1">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              {query && <> for <span className="font-semibold text-charcoal-600">"{query}"</span></>}
            </p>
          )}

          {filtered.map(rfp => {
            const cfg        = STATUS_CFG[rfp.status] ?? { label: rfp.status, badge: 'bg-charcoal-100 text-charcoal-600' }
            const totalUnits = rfp.items.reduce((s, i) => s + i.quantity, 0)
            const date       = rfp.submittedAt ?? rfp.createdAt
            const isUnopened = rfp.status === 'SUBMITTED' && !rfp.isArchived

            return (
              <Link
                key={rfp.id}
                href={`/admin/rfps/${rfp.id}`}
                className={`group relative flex items-stretch rounded-2xl shadow-card overflow-hidden hover:shadow-warm-sm transition-all duration-200 ${
                  isUnopened
                    ? 'bg-gradient-to-r from-terracotta/8 via-white to-white border-2 border-terracotta/40 hover:border-terracotta'
                    : 'bg-white border border-[#E8E0D5] hover:border-terracotta/30'
                }`}
              >
                {isUnopened && <div className="w-1.5 bg-terracotta flex-shrink-0" aria-hidden />}
                <div className="flex-1 flex items-center gap-5 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      {isUnopened && (
                        <span className="relative flex w-2 h-2 flex-shrink-0" aria-hidden>
                          <span className="absolute inset-0 rounded-full bg-terracotta animate-ping opacity-75" />
                          <span className="relative inline-flex rounded-full w-2 h-2 bg-terracotta" />
                        </span>
                      )}
                      <span className={`font-mono text-sm tracking-tight ${isUnopened ? 'font-extrabold text-charcoal-900' : 'font-bold text-charcoal-900'}`}>
                        {rfp.rfpNumber}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                      {isUnopened && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-[0.15em] bg-terracotta text-white shadow-sm">New</span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${isUnopened ? 'font-bold text-charcoal-900' : 'font-semibold text-charcoal-700'}`}>
                      {rfp.vendorProfile.companyName}
                    </p>
                    {rfp.projectName && (
                      <p className="text-xs text-charcoal-400 truncate mt-0.5">{rfp.projectName}</p>
                    )}
                  </div>

                  <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
                    <div className="text-center">
                      <p className="font-heading text-lg font-bold text-charcoal-900 leading-none">{rfp.items.length}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Lines</p>
                    </div>
                    <div className="w-px h-7 bg-[#E8E0D5]" />
                    <div className="text-center">
                      <p className="font-heading text-lg font-bold text-terracotta leading-none">{totalUnits}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Units</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">
                        {rfp.submittedAt ? 'Submitted' : 'Created'}
                      </p>
                      <p className="text-xs text-charcoal-600 font-medium mt-0.5">
                        {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {!readonly && (
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setConfirmDelete({ id: rfp.id, rfpNumber: rfp.rfpNumber }) }}
                        title="Delete RFP"
                        aria-label={`Delete ${rfp.rfpNumber}`}
                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-cream text-charcoal-400 hover:bg-rose-50 hover:text-rose-600 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-cream group-hover:bg-terracotta/10 transition-colors duration-200 flex-shrink-0">
                      <ArrowRight className="w-4 h-4 text-charcoal-400 group-hover:text-terracotta transition-colors duration-200" />
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Filter Sidebar ────────────────────────────────────── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed right-0 inset-y-0 w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-out flex flex-col overflow-hidden ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ borderLeft: '0.5px solid #e8dcc4' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE7DE]">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-terracotta" />
            <h2 className="font-heading font-bold text-[15px] text-charcoal-900">Filters</h2>
            {advCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-terracotta text-white text-[10px] font-bold flex items-center justify-center">
                {advCount}
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 text-charcoal-400 hover:text-charcoal-700 hover:bg-cream/30 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* Date range */}
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-3">
              <CalendarDays className="w-3 h-3" />
              Date Range
            </p>
            <div className="space-y-2.5">
              <div>
                <label className="text-[11px] font-semibold text-charcoal-500 mb-1.5 block">From</label>
                <DatePicker value={adv.dateFrom} onChange={v => setAdv(p => ({ ...p, dateFrom: v }))} placeholder="Select start date" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-charcoal-500 mb-1.5 block">To</label>
                <DatePicker value={adv.dateTo} onChange={v => setAdv(p => ({ ...p, dateTo: v }))} placeholder="Select end date" />
              </div>
            </div>
          </div>

          {/* Min units */}
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-3">
              <Package className="w-3 h-3" />
              Minimum Total Units
            </p>
            <input
              type="number"
              min={0}
              placeholder="e.g. 100"
              value={adv.minUnits}
              onChange={e => setAdv(p => ({ ...p, minUnits: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[#FAF7F4] border border-[#EDE7DE] rounded-xl text-sm text-charcoal-800 placeholder-charcoal-300 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          {/* New only */}
          <div>
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-3">
              <Sparkles className="w-3 h-3" />
              Submission Type
            </p>
            <button
              type="button"
              onClick={() => setAdv(p => ({ ...p, newOnly: !p.newOnly }))}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                adv.newOnly
                  ? 'bg-terracotta/8 border-terracotta/30 text-terracotta'
                  : 'bg-[#FAF7F4] border-[#EDE7DE] text-charcoal-600 hover:border-charcoal-300'
              }`}
            >
              <span>New submissions only</span>
              <span className={`relative inline-flex w-8 h-4 rounded-full transition-colors duration-200 flex-shrink-0 ${adv.newOnly ? 'bg-terracotta' : 'bg-charcoal-200'}`}>
                <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow-sm transition-transform duration-200 ${adv.newOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </span>
            </button>
          </div>

        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-[#EDE7DE] flex items-center gap-2">
          <button
            onClick={() => { setAdv(EMPTY_ADV); setSidebarOpen(false) }}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#EDE7DE] text-sm font-semibold text-charcoal-600 hover:border-charcoal-300 hover:text-charcoal-800 transition-colors"
          >
            Clear
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-terracotta hover:bg-[#B85C3B] text-white text-sm font-semibold transition-colors"
          >
            Apply
          </button>
        </div>
      </div>

      {/* ── Delete confirmation ─────────────────────────────────── */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 bg-charcoal-900/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => !deletingId && setConfirmDelete(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-warm-sm border border-[#E8E0D5] w-full max-w-md overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-[#F0EBE3]">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-600">Delete RFP</p>
              <h3 className="font-heading text-lg font-bold text-charcoal-900 mt-1">
                Delete <span className="font-mono">{confirmDelete.rfpNumber}</span>?
              </h3>
              <p className="text-sm text-charcoal-500 mt-1.5">
                This permanently removes the RFP and all its items, quote drafts, and notes. Cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={!!deletingId}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-charcoal-700 hover:bg-cream transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={performDelete}
                disabled={!!deletingId}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-60"
              >
                {deletingId
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Deleting…</>
                  : <><Trash2 className="w-4 h-4" /> Delete</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

/* ── Chip ─────────────────────────────────────────────────────── */
function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full bg-charcoal-900 text-white text-[11px] font-semibold">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="w-4 h-4 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors"
        aria-label={`Remove ${label}`}
      >
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  )
}

function fmtDate(iso: string): string {
  try { return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) }
  catch { return iso }
}
