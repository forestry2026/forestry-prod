'use client'

/**
 * UnitSelect — small custom dropdown for measurement units (cm, mm, m, inches, feet).
 *
 * Replaces the native <select> element so the trigger and option list match
 * the Forestry design system (terracotta accents, cream surfaces, rounded
 * corners) instead of inheriting the OS/browser appearance.
 *
 * Compact (w-16 by default) — drop-in replacement for inline dimension rows.
 */

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Check } from 'lucide-react'

interface UnitSelectProps {
  value:     string
  onChange:  (next: string) => void
  options?:  readonly string[]
  className?: string
  disabled?: boolean
  ariaLabel?: string
}

const DEFAULT_UNITS = ['cm', 'mm', 'm', 'inches', 'feet'] as const

export function UnitSelect({
  value,
  onChange,
  options = DEFAULT_UNITS,
  className = '',
  disabled = false,
  ariaLabel = 'Unit',
}: UnitSelectProps) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  function choose(u: string) {
    onChange(u)
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className={`relative ${className || 'w-20'}`}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`
          w-full flex items-center justify-between gap-1
          border border-charcoal-200 rounded-lg
          px-2.5 py-2 text-sm text-charcoal-900 bg-white
          transition-colors
          ${disabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:border-terracotta/50 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta'}
          ${open ? 'border-terracotta ring-2 ring-terracotta/30' : ''}
        `}
      >
        <span className="truncate">{value || '—'}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-charcoal-400 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 mt-1 left-0 min-w-full bg-white border border-[#E8E0D5] rounded-lg shadow-card py-1 max-h-60 overflow-auto"
        >
          {options.map(u => {
            const selected = u === value
            return (
              <li
                key={u}
                role="option"
                aria-selected={selected}
                onClick={() => choose(u)}
                className={`
                  flex items-center justify-between gap-2
                  px-3 py-1.5 text-sm cursor-pointer
                  ${selected
                    ? 'bg-terracotta/10 text-terracotta font-semibold'
                    : 'text-charcoal-700 hover:bg-cream'}
                `}
              >
                <span>{u}</span>
                {selected && <Check className="w-3.5 h-3.5" />}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
