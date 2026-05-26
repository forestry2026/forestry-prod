'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, FileText, MessageSquare, Inbox } from 'lucide-react'

interface Counts {
  quotedRfps?: number
  enquiry?:    number
}

interface EventDef {
  key:    keyof Counts
  label:  string
  href:   string
  Icon:   typeof Bell
  accent: string
}

const EVENTS: EventDef[] = [
  { key: 'quotedRfps', label: 'Quotes Ready',   href: '/portal/rfp/history', Icon: FileText,      accent: 'text-terracotta bg-terracotta/10' },
  { key: 'enquiry',    label: 'My Enquiries',    href: '/portal/enquiry', Icon: MessageSquare, accent: 'text-blue-700 bg-blue-100' },
]

export function VendorNotificationBell() {
  const [counts,     setCounts]     = useState<Counts>({})
  const [open,       setOpen]       = useState(false)
  const [clickedKey, setClickedKey] = useState<string | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Poll every 30s
  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const res = await fetch('/api/notifications/badge-counts', { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (alive) setCounts(data)
      } catch {}
    }
    load()
    const id = setInterval(load, 30_000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  // Close on outside click + Escape
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('mousedown', onClick)
      document.addEventListener('keydown', onKey)
    }
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const total     = (counts.quotedRfps ?? 0) + (counts.enquiry ?? 0)
  const hasEvents = total > 0

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={`Notifications ${total > 0 ? `(${total} unread)` : ''}`}
        className="relative grid place-items-center w-[30px] h-[30px] rounded-full border border-cream-darker bg-white hover:bg-cream-dark transition-colors"
      >
        {hasEvents && (
          <>
            <span className="absolute inset-0 rounded-full bg-terracotta/30 animate-ping" aria-hidden />
            <span className="absolute inset-0 rounded-full ring-2 ring-terracotta/40" aria-hidden />
          </>
        )}

        <Bell className={`w-[15px] h-[15px] ${hasEvents ? 'text-terracotta' : 'text-charcoal/60'}`} />

        {hasEvents && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-terracotta text-white text-[9px] font-bold leading-4 text-center shadow-sm ring-2 ring-white">
            {total > 99 ? '99+' : total}
          </span>
        )}
      </button>

      {open && (
        <div
          onMouseLeave={() => setOpen(false)}
          className="absolute right-0 mt-3 w-80 bg-white rounded-2xl border border-cream-darker shadow-2xl overflow-hidden z-50"
        >
          <div className="px-5 py-4 bg-gradient-to-br from-cream to-cream-dark border-b border-cream-darker">
            <p className="font-heading font-bold text-charcoal text-sm tracking-wide uppercase">Activity</p>
            <p className="text-xs text-charcoal/60 mt-0.5">
              {hasEvents ? `${total} item${total === 1 ? '' : 's'} need attention` : 'All caught up'}
            </p>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {hasEvents ? (
              EVENTS.map(({ key, label, href, Icon, accent }) => {
                const n = counts[key] ?? 0
                if (n === 0) return null
                return (
                  <Link
                    key={key}
                    href={href}
                    onClick={e => {
                      // Force navigation even if a parent handler (onMouseLeave
                      // on the dropdown shell) tries to close the panel and
                      // unmount this link mid-click.
                      e.preventDefault()
                      setClickedKey(key)
                      setOpen(false)
                      router.push(href)
                      setTimeout(() => setClickedKey(null), 250)
                    }}
                    className={`
                      flex items-center gap-3 px-5 py-3.5 transition-all border-b border-cream-darker/50 last:border-b-0 group
                      ${clickedKey === key ? 'bg-terracotta/10 scale-[0.98]' : 'hover:bg-cream/50'}
                      ${clickedKey && clickedKey !== key ? 'opacity-40' : ''}
                    `}
                  >
                    <div className={`w-9 h-9 rounded-lg grid place-items-center ${accent} flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-charcoal truncate group-hover:text-terracotta transition-colors">
                        {label}
                      </p>
                      <p className="text-xs text-charcoal/55">{n} pending</p>
                    </div>
                    <span className="text-[11px] font-bold text-charcoal/40 group-hover:text-terracotta transition-colors">
                      VIEW →
                    </span>
                  </Link>
                )
              })
            ) : (
              <div className="px-5 py-10 text-center">
                <div className="w-12 h-12 rounded-full bg-cream-dark grid place-items-center mx-auto mb-3">
                  <Inbox className="w-5 h-5 text-charcoal/40" />
                </div>
                <p className="text-sm font-medium text-charcoal/70">No new activity</p>
                <p className="text-xs text-charcoal/40 mt-1">You'll be notified when new events arrive</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
