'use client'

import { useRouter }                     from 'next/navigation'
import { useState, useRef, useEffect }   from 'react'
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react'

/* ── Helpers ─────────────────────────────────────────────────────── */
const PRESETS = [
  { id: 'today', label: 'Today' },
  { id: '7d',    label: '7D'    },
  { id: '30d',   label: '30D'   },
  { id: 'mtd',   label: 'Month' },
  { id: 'qtd',   label: 'QTD'   },
  { id: '6m',    label: '6M'    },
  { id: '12m',   label: '12M'   },
]

function isoToDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateToIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function fmtShort(d: Date) {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function getDays(year: number, month: number): (Date | null)[] {
  const first   = new Date(year, month, 1)
  const last    = new Date(year, month + 1, 0)
  const padLeft = (first.getDay() + 6) % 7   // Mon = 0
  const days: (Date | null)[] = Array(padLeft).fill(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d))
  return days
}

/* ── Calendar popup ─────────────────────────────────────────────── */
interface CalProps {
  initFrom: Date
  initTo:   Date
  onApply:  (from: Date, to: Date) => void
  onClose:  () => void
}

function CalendarPicker({ initFrom, initTo, onApply, onClose }: CalProps) {
  const [view,   setView]   = useState(new Date(initFrom.getFullYear(), initFrom.getMonth(), 1))
  const [anchor, setAnchor] = useState<Date | null>(initFrom)
  const [hover,  setHover]  = useState<Date | null>(null)
  const [selFrom, setSelFrom] = useState<Date | null>(initFrom)
  const [selTo,   setSelTo]   = useState<Date | null>(initTo)
  const [phase, setPhase]   = useState<'from' | 'to'>('from')

  const today = new Date()
  const days  = getDays(view.getFullYear(), view.getMonth())

  function navMonth(delta: number) {
    setView(v => new Date(v.getFullYear(), v.getMonth() + delta, 1))
  }

  function rangeStart() { return selFrom }
  function rangeEnd()   { return phase === 'to' && hover ? hover : selTo }

  function inRange(d: Date) {
    const s = rangeStart()
    const e = rangeEnd()
    if (!s || !e) return false
    const [lo, hi] = s <= e ? [s, e] : [e, s]
    return d > lo && d < hi
  }

  function isStart(d: Date) { return !!selFrom && sameDay(d, selFrom) }
  function isEnd(d: Date)   { return !!selTo   && sameDay(d, selTo) && phase !== 'to' }

  function handleDay(d: Date) {
    if (phase === 'from') {
      setSelFrom(d); setSelTo(null); setPhase('to')
    } else {
      if (selFrom && d < selFrom) {
        // swap
        setSelTo(selFrom); setSelFrom(d)
      } else {
        setSelTo(d)
      }
      setPhase('from')
    }
  }

  const canApply = selFrom && selTo

  const monthLabel = view.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <div className="absolute top-full left-0 mt-2 z-50 select-none">
      <div className="bg-white rounded-2xl border border-[#ECEAE5] shadow-[0_8px_32px_rgba(0,0,0,0.10)] p-4 w-[300px]">

        {/* Month nav */}
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navMonth(-1)}
            className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-stone-500" />
          </button>
          <span className="text-[13px] font-bold text-stone-700">{monthLabel}</span>
          <button
            onClick={() => navMonth(1)}
            className="w-7 h-7 rounded-lg hover:bg-stone-100 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5 text-stone-500" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Mo','Tu','We','Th','Fr','Sa','Su'].map(d => (
            <div key={d} className="text-center text-[9px] font-bold text-stone-300 py-1 uppercase tracking-wider">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7">
          {days.map((d, i) => {
            if (!d) return <div key={`e${i}`} className="h-9" />

            const start   = isStart(d)
            const end     = isEnd(d)
            const inRng   = inRange(d)
            const isHov   = hover ? sameDay(d, hover) : false
            const isToday = sameDay(d, today)

            return (
              <div key={d.toISOString()} className="relative h-9 flex items-center justify-center">
                {/* Range fill — full-width background strip */}
                {inRng && (
                  <div className="absolute inset-y-1 inset-x-0 bg-terracotta/10" />
                )}
                {/* Half-fill on start */}
                {start && selTo && (
                  <div className="absolute inset-y-1 right-0 left-1/2 bg-terracotta/10" />
                )}
                {/* Half-fill on end */}
                {end && selFrom && (
                  <div className="absolute inset-y-1 left-0 right-1/2 bg-terracotta/10" />
                )}

                {/* Day button */}
                <button
                  onClick={() => handleDay(d)}
                  onMouseEnter={() => setHover(d)}
                  onMouseLeave={() => setHover(null)}
                  className={[
                    'relative z-10 w-8 h-8 rounded-full text-[12px] font-medium transition-all duration-100 leading-none',
                    start || end
                      ? 'bg-terracotta text-white font-bold shadow-sm'
                      : isHov
                      ? 'bg-stone-100 text-stone-700'
                      : inRng
                      ? 'text-terracotta font-semibold'
                      : 'text-stone-600 hover:bg-stone-100',
                    isToday && !start && !end
                      ? 'ring-1 ring-offset-1 ring-terracotta/40'
                      : '',
                  ].join(' ')}
                >
                  {d.getDate()}
                </button>
              </div>
            )
          })}
        </div>

        {/* Range display + actions */}
        <div className="mt-3 pt-3 border-t border-[#ECEAE5]">
          <div className="flex items-center justify-between gap-2">
            {/* Selected range display */}
            <div className="text-[11px] text-stone-400 min-w-0 flex-1 truncate">
              {selFrom && selTo
                ? <><span className="font-semibold text-stone-600">{fmtShort(selFrom)}</span>
                    <span className="mx-1 text-stone-300">→</span>
                    <span className="font-semibold text-stone-600">{fmtShort(selTo)}</span></>
                : selFrom
                ? <><span className="font-semibold text-terracotta">{fmtShort(selFrom)}</span>
                    <span className="text-stone-400 ml-1">— pick end date</span></>
                : <span className="text-stone-300">Pick start date</span>
              }
            </div>

            <div className="flex gap-1.5 flex-shrink-0">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-stone-500 hover:bg-stone-100 transition-colors"
              >
                Cancel
              </button>
              {canApply && (
                <button
                  onClick={() => {
                    const [f, t] = selFrom! <= selTo!
                      ? [selFrom!, selTo!]
                      : [selTo!,   selFrom!]
                    onApply(f, t)
                  }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold bg-terracotta text-white hover:bg-terracotta-dark transition-colors"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────── */
interface Props {
  preset:      string
  fromIso:     string
  toIso:       string
  periodLabel: string
  dayCount:    number
}

export function DateRangeFilter({ preset, fromIso, toIso, periodLabel, dayCount }: Props) {
  const router              = useRouter()
  const [calOpen, setCalOpen] = useState(false)
  const wrapRef             = useRef<HTMLDivElement>(null)

  const fromDate = isoToDate(fromIso)
  const toDate   = isoToDate(toIso)

  function go(p: string, f?: string, t?: string) {
    const qs = new URLSearchParams({ preset: p })
    if (f) qs.set('from', f)
    if (t) qs.set('to',   t)
    router.push(`/admin?${qs}`)
    setCalOpen(false)
  }

  function handleApply(f: Date, t: Date) {
    go('custom', dateToIso(f), dateToIso(t))
  }

  /* Close on outside click */
  useEffect(() => {
    if (!calOpen) return
    function handler(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setCalOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [calOpen])

  const isCustom = preset === 'custom'

  return (
    <div className="bg-white rounded-2xl border border-[#ECEAE5] px-5 py-3 flex items-center gap-3 flex-wrap">

      {/* Period indicator */}
      <div className="flex items-center gap-2 text-xs text-stone-500 min-w-0">
        <Calendar className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />
        <span className="font-semibold truncate">{periodLabel}</span>
        <span className="text-stone-300">·</span>
        <span className="text-[11px] text-stone-400 font-medium whitespace-nowrap">{dayCount}d</span>
      </div>

      <div className="h-4 w-px bg-[#ECEAE5] flex-shrink-0 hidden sm:block" />

      {/* Preset pills */}
      <div className="flex items-center gap-1 flex-wrap">
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => go(p.id)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-150 ${
              preset === p.id
                ? 'bg-terracotta text-white shadow-sm'
                : 'bg-stone-50 text-stone-500 hover:bg-stone-100 border border-[#ECEAE5]'
            }`}
          >
            {p.label}
          </button>
        ))}

        {/* Custom trigger */}
        <div ref={wrapRef} className="relative flex items-center gap-1">
          <button
            onClick={() => setCalOpen(o => !o)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all duration-150 ${
              isCustom || calOpen
                ? 'bg-terracotta text-white shadow-sm'
                : 'bg-stone-50 text-stone-500 hover:bg-stone-100 border border-[#ECEAE5]'
            }`}
          >
            <Calendar className="w-3 h-3" />
            {isCustom
              ? <span>{fmtShort(fromDate)} → {fmtShort(toDate)}</span>
              : <span>Custom</span>
            }
          </button>

          {/* Clear custom — only shown when custom is active */}
          {isCustom && (
            <button
              onClick={() => go('30d')}
              title="Clear custom range"
              className="w-6 h-6 rounded-lg flex items-center justify-center bg-stone-100 hover:bg-rose-50 hover:text-rose-500 text-stone-400 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}

          {calOpen && (
            <CalendarPicker
              initFrom={fromDate}
              initTo={toDate}
              onApply={handleApply}
              onClose={() => setCalOpen(false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
