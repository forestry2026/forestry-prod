'use client'

import { useState, useMemo } from 'react'
import Link                  from 'next/link'
import { Search, X, ArrowRight, Wand2, ImageIcon } from 'lucide-react'

/* ── Status config ───────────────────────────────────────────── */
const STATUS_CFG: Record<string, { label: string; badge: string }> = {
  pending:   { label: 'Pending Review', badge: 'bg-amber-50  text-amber-700'  },
  reviewing: { label: 'In Progress',   badge: 'bg-blue-50   text-blue-700'   },
  quoted:    { label: 'Quoted',        badge: 'bg-green-50  text-green-700'  },
  rejected:  { label: 'Not Feasible', badge: 'bg-red-50    text-red-700'    },
}

const STATUS_TABS = [
  { key: 'ALL',       label: 'All'          },
  { key: 'pending',   label: 'Pending'      },
  { key: 'reviewing', label: 'In Progress'  },
  { key: 'quoted',    label: 'Quoted'       },
  { key: 'rejected',  label: 'Not Feasible' },
]

export interface DesignRequest {
  id:              string
  title:           string
  status:          string
  quantity:        number
  createdAt:       string
  referenceImages: { url: string }[]
  dimensions:      { label: string; value: string; unit: string }[]
  vendorProfile:   { companyName: string; user: { name: string } }
}

interface Props {
  requests:     DesignRequest[]
  statusCounts: Record<string, number>
}

export function CustomDesignListClient({ requests, statusCounts }: Props) {
  const [query,        setQuery]        = useState('')
  const [activeStatus, setActiveStatus] = useState('ALL')

  const filtered = useMemo(() => {
    let list = requests
    if (activeStatus !== 'ALL') list = list.filter(r => r.status === activeStatus)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r =>
        r.title.toLowerCase().includes(q)                       ||
        r.vendorProfile.companyName.toLowerCase().includes(q)  ||
        r.vendorProfile.user.name.toLowerCase().includes(q)
      )
    }
    return list
  }, [requests, query, activeStatus])

  const needsAction = statusCounts['pending']   ?? 0
  const inProgress  = (statusCounts['reviewing'] ?? 0) + (statusCounts['quoted'] ?? 0)

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Admin Portal</p>
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Custom Designs</h1>
          <p className="text-sm text-charcoal-400 mt-1.5">All vendor custom design requests</p>
        </div>

        {/* Stat pills */}
        <div className="flex items-center gap-3 flex-shrink-0 mt-1">
          <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
            <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{requests.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Total</span>
          </div>
          {needsAction > 0 && (
            <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <span className="font-heading text-2xl font-bold text-amber-700 leading-none">{needsAction}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-500 mt-0.5">Needs Review</span>
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

      {/* ── Search + Status tabs ─────────────────────────────── */}
      <div className="space-y-3">

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, vendor, company…"
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

        {/* Status tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
          {STATUS_TABS.map(tab => {
            const count  = tab.key === 'ALL' ? requests.length : (statusCounts[tab.key] ?? 0)
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
                  <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none ${
                    active ? 'bg-white/20 text-white' : 'bg-charcoal-100 text-charcoal-500'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── List ─────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card">
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-5">
              <Wand2 className="w-6 h-6 text-terracotta/40" />
            </div>
            <p className="font-heading text-lg font-bold text-charcoal-900 mb-1">
              {query || activeStatus !== 'ALL' ? 'No matching requests' : 'No requests yet'}
            </p>
            <p className="text-sm text-charcoal-400">
              {query
                ? `No results for "${query}"`
                : activeStatus !== 'ALL'
                ? 'No requests with this status'
                : 'Custom design requests will appear here once vendors submit them.'}
            </p>
            {(query || activeStatus !== 'ALL') && (
              <button
                onClick={() => { setQuery(''); setActiveStatus('ALL') }}
                className="mt-4 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {(query || activeStatus !== 'ALL') && (
            <p className="text-xs text-charcoal-400 px-1">
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              {query && <> for <span className="font-semibold text-charcoal-600">"{query}"</span></>}
            </p>
          )}

          {filtered.map(req => {
            const cfg   = STATUS_CFG[req.status] ?? { label: req.status, badge: 'bg-charcoal-100 text-charcoal-600' }
            const thumb = req.referenceImages[0]?.url ?? null

            return (
              <Link
                key={req.id}
                href={`/admin/custom-designs/${req.id}`}
                className="group relative flex items-stretch bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden hover:border-terracotta/30 hover:shadow-warm-sm transition-all duration-200"
              >
                {/* Thumbnail */}
                {thumb ? (
                  <div className="w-16 flex-shrink-0 overflow-hidden bg-cream">
                    <img src={thumb} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 flex-shrink-0 bg-[#FAF7F4] border-r border-[#E8E0D5] flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 text-charcoal-200" />
                  </div>
                )}

                {/* Body */}
                <div className="flex-1 flex items-center gap-5 px-5 py-4">

                  {/* Left: title + vendor */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-heading text-sm font-bold text-charcoal-900 tracking-tight">
                        {req.title}
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-charcoal-700 truncate">
                      {req.vendorProfile.companyName}
                    </p>
                    <p className="text-xs text-charcoal-400 truncate mt-0.5">
                      {req.vendorProfile.user.name}
                    </p>
                  </div>

                  {/* Centre: stats */}
                  <div className="hidden sm:flex items-center gap-5 flex-shrink-0">
                    <div className="text-center">
                      <p className="font-heading text-lg font-bold text-terracotta leading-none">{req.quantity}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Units</p>
                    </div>
                    {req.dimensions.length > 0 && (
                      <>
                        <div className="w-px h-7 bg-[#E8E0D5]" />
                        <div className="text-center">
                          <p className="font-heading text-lg font-bold text-charcoal-900 leading-none">{req.dimensions.length}</p>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Dims</p>
                        </div>
                      </>
                    )}
                    {req.referenceImages.length > 0 && (
                      <>
                        <div className="w-px h-7 bg-[#E8E0D5]" />
                        <div className="text-center">
                          <p className="font-heading text-lg font-bold text-charcoal-900 leading-none">{req.referenceImages.length}</p>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Images</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Right: date + arrow */}
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">Submitted</p>
                      <p className="text-xs text-charcoal-600 font-medium mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
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
    </div>
  )
}
