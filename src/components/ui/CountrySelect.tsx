'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Search, ChevronDown } from 'lucide-react'
import { COUNTRIES } from '@/lib/countries'
import type { Country } from '@/lib/countries'

interface CountrySelectProps {
  value: string          // country code e.g. 'AE'
  onChange: (code: string) => void
  error?: string
}

export default function CountrySelect({ value, onChange, error }: CountrySelectProps) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef    = useRef<HTMLInputElement>(null)

  const selected = COUNTRIES.find(c => c.code === value) ?? COUNTRIES[0]

  const filtered = search
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES

  // Position dropdown relative to trigger — flip upward if near bottom of viewport
  const positionDropdown = useCallback(() => {
    if (!containerRef.current) return
    const rect        = containerRef.current.getBoundingClientRect()
    const DROPDOWN_H  = 320 // approx max height (search bar + list)
    const spaceBelow  = window.innerHeight - rect.bottom
    const spaceAbove  = rect.top
    const openUpward  = spaceBelow < DROPDOWN_H && spaceAbove > spaceBelow

    setDropdownStyle(openUpward ? {
      position: 'fixed',
      bottom:   window.innerHeight - rect.top + 6,
      left:     rect.left,
      width:    rect.width,
      zIndex:   9999,
    } : {
      position: 'fixed',
      top:      rect.bottom + 6,
      left:     rect.left,
      width:    rect.width,
      zIndex:   9999,
    })
  }, [])

  function handleOpen() {
    positionDropdown()
    setOpen(o => !o)
  }

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      const target = e.target as Node
      if (containerRef.current && !containerRef.current.contains(target)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return
    const handler = () => positionDropdown()
    window.addEventListener('scroll', handler, true)
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('scroll', handler, true)
      window.removeEventListener('resize', handler)
    }
  }, [open, positionDropdown])

  // Auto-focus search on open
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  // Highlight matching text
  function renderName(country: Country) {
    if (!search) return (
      <span className="text-[#2D2926] font-medium">{country.name}</span>
    )
    const lower = country.name.toLowerCase()
    const idx   = lower.indexOf(search.toLowerCase())
    if (idx === -1) return (
      <span className="text-[#2D2926] font-medium">{country.name}</span>
    )
    return (
      <span className="text-[#2D2926]">
        {country.name.slice(0, idx)}
        <span className="font-bold text-[#C96B4A]">{country.name.slice(idx, idx + search.length)}</span>
        {country.name.slice(idx + search.length)}
      </span>
    )
  }

  const ringClass = error
    ? 'border-red-400'
    : open
    ? 'border-[#C96B4A] ring-2 ring-[#C96B4A]/20'
    : 'border-[#e8dcc4] hover:border-[#C96B4A]/40'

  const dropdown = open ? (
    <div
      style={dropdownStyle}
      className="rounded-xl border border-[#e8dcc4] overflow-hidden bg-white shadow-xl shadow-black/10"
    >
      {/* Search */}
      <div className="flex items-center gap-2.5 px-3.5 py-2.5 border-b border-[#e8dcc4] bg-[#F5EDE0]/40">
        <Search className="w-3.5 h-3.5 text-[#2D2926]/40 flex-shrink-0" />
        <input
          ref={searchRef}
          type="text"
          placeholder="Search country…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 text-sm text-[#2D2926] placeholder:text-[#2D2926]/30 focus:outline-none bg-transparent"
        />
      </div>

      {/* List */}
      <div className="max-h-64 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="px-4 py-5 text-sm text-center text-[#2D2926]/40">No countries found</div>
        ) : (
          filtered.map(country => {
            const isSelected = country.code === selected.code
            return (
              <button
                key={country.code}
                type="button"
                onMouseDown={e => e.preventDefault()}
                onClick={() => { onChange(country.code); setOpen(false); setSearch('') }}
                className={`w-full flex items-center gap-3 px-3.5 py-2 text-sm text-left transition-colors ${
                  isSelected ? 'bg-[#C96B4A]/8 text-[#C96B4A]' : 'hover:bg-[#F5EDE0]/60'
                }`}
              >
                <span className="text-base leading-none flex-shrink-0">{country.flag}</span>
                <span className="flex-1 min-w-0">{renderName(country)}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C96B4A] flex-shrink-0" />
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  ) : null

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className={`w-full flex items-center gap-2.5 px-3 py-3 rounded-xl border bg-white transition-all text-sm text-left ${ringClass}`}
      >
        <span className="text-lg leading-none flex-shrink-0">{selected.flag}</span>
        <span className="flex-1 text-[#2D2926] font-medium truncate">{selected.name}</span>
        <ChevronDown
          className={`w-4 h-4 text-[#2D2926]/40 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {error && (
        <p className="text-xs mt-1.5 text-red-600 font-medium">{error}</p>
      )}

      {typeof window !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  )
}
