'use client'

/**
 * CustomRalColorPicker — RAL palette picker used by the vendor custom
 * design request and vendor product detail (Custom Colour) flows.
 *
 * Mirrors the catalogue swatch ring style:
 *   40 × 40 rounded-xl, 1 px charcoal-200 outline + 3 px transparent gap.
 *   Selected: 1.5 px terracotta outline + scale-105 + shadow-md.
 *
 * Features:
 *  - Category tabs: Classic / Effect / Metallic
 *  - Live search input (right of the Metallic button) — bypasses family
 *    chip and searches the whole active category when non-empty
 *  - Classic family chips (Yellow / Orange / …) shown only for Classic
 *  - Native colour input on the swatch preview (free hex pick)
 *  - Optional manual Colour name + RAL code text inputs
 *  - Selected summary chip at the bottom
 */

import { useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
import { RAL_COLORS, RAL_CATEGORIES, type RalCategory } from '@/lib/ralColors'

const CLASSIC_GROUPS = ['Yellow', 'Orange', 'Red', 'Violet', 'Blue', 'Green', 'Grey', 'Brown', 'White/Black']

function classicGroup(code: string): string {
  const m = code.match(/^RAL (\d)/)
  if (!m) return 'Other'
  switch (m[1]) {
    case '1': return 'Yellow'
    case '2': return 'Orange'
    case '3': return 'Red'
    case '4': return 'Violet'
    case '5': return 'Blue'
    case '6': return 'Green'
    case '7': return 'Grey'
    case '8': return 'Brown'
    case '9': return 'White/Black'
    default:  return 'Other'
  }
}

interface CustomRalColorPickerProps {
  hex:     string
  name:    string
  ral:     string
  onHex:   (v: string) => void
  onName:  (v: string) => void
  onRal:   (v: string) => void
}

export function CustomRalColorPicker({
  hex, name, ral, onHex, onName, onRal,
}: CustomRalColorPickerProps) {
  const [activeCategory, setActiveCategory] = useState<RalCategory>('Classic')
  const [activeGroup,    setActiveGroup]    = useState<string>(CLASSIC_GROUPS[0])
  const [ralSearch,      setRalSearch]      = useState<string>('')
  const [hoveredRal,     setHoveredRal]     = useState<string | null>(null)

  // Active-category / family filter, narrowed further by live search.
  const q = ralSearch.trim().toLowerCase()
  const categoryColors = activeCategory === 'Classic'
    ? RAL_COLORS.filter(c => c.category === 'Classic' && (q ? true : classicGroup(c.code) === activeGroup))
    : RAL_COLORS.filter(c => c.category === activeCategory)
  const groupColors = q
    ? categoryColors.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    : categoryColors

  function selectRal(c: typeof RAL_COLORS[0]) {
    onHex(c.hex)
    onRal(c.code)
    onName(c.name)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0">
          <div
            className="w-10 h-10 rounded-lg border-2 border-[#EDE7DE] shadow-sm cursor-pointer overflow-hidden relative"
            style={{ background: hex }}
          >
            <input
              type="color"
              value={hex}
              onChange={e => { onHex(e.target.value); onRal(''); onName('') }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              title="Pick a colour"
            />
          </div>
          <p className="text-[9px] text-charcoal-400 text-center mt-0.5 font-mono">{hex.toUpperCase()}</p>
        </div>
        <div className="flex-1 space-y-1.5">
          <input
            value={name}
            onChange={e => onName(e.target.value)}
            placeholder="Colour name"
            className="form-input text-xs py-1.5"
          />
          <input
            value={ral}
            onChange={e => onRal(e.target.value)}
            placeholder="RAL code"
            className="form-input text-xs py-1.5 font-mono"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-[#EDE7DE]" />
        <span className="text-[10px] font-semibold text-charcoal-400 uppercase tracking-widest">RAL Range</span>
        <div className="flex-1 h-px bg-[#EDE7DE]" />
      </div>

      {/* Category tabs + inline live search */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex gap-1 flex-wrap">
          {RAL_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeCategory === cat ? 'bg-charcoal-900 text-white' : 'bg-[#F5F0EB] text-charcoal-600 hover:bg-[#EDE7DE]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <input
          type="text"
          value={ralSearch}
          onChange={e => setRalSearch(e.target.value)}
          placeholder="Search RAL code or name…"
          className="flex-1 min-w-[180px] form-input text-xs py-1.5"
        />
      </div>

      {/* Family chips — Classic only */}
      {activeCategory === 'Classic' && (
        <div className="flex gap-1 flex-wrap">
          {CLASSIC_GROUPS.map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setActiveGroup(g)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                activeGroup === g ? 'bg-terracotta text-white' : 'bg-[#F5F0EB] text-charcoal-600 hover:bg-[#EDE7DE]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="flex flex-wrap gap-x-[15px] gap-y-4 items-center pt-1">
          {groupColors.map(c => {
            const isSelected = ral === c.code
            const ringColor  = isSelected ? '#C96B4A' : '#B8BEBE'
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => selectRal(c)}
                onMouseEnter={e => {
                  setHoveredRal(c.code)
                  if (!isSelected) e.currentTarget.style.outline = `1px solid #C96B4A`
                }}
                onMouseLeave={e => {
                  setHoveredRal(null)
                  if (!isSelected) e.currentTarget.style.outline = `1px solid #B8BEBE`
                }}
                aria-label={`${c.code} – ${c.name}`}
                className={`w-10 h-10 rounded-xl transition-all relative ${isSelected ? 'scale-105 shadow-md z-10' : ''}`}
                style={{
                  background:    c.hex,
                  outline:       `${isSelected ? '1.5px' : '1px'} solid ${ringColor}`,
                  outlineOffset: '3px',
                }}
              >
                {isSelected && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <CheckCircle2 className="w-2.5 h-2.5 text-white drop-shadow" />
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {hoveredRal && (() => {
          const c = RAL_COLORS.find(x => x.code === hoveredRal)
          if (!c) return null
          return (
            <div className="mt-3 flex items-center gap-2.5 px-3 py-2 bg-charcoal-900 text-white rounded-xl text-xs w-fit">
              <div className="w-4 h-4 rounded flex-shrink-0 border border-white/20" style={{ background: c.hex }} />
              <span className="font-mono font-semibold">{c.code}</span>
              <span className="text-white/70">–</span>
              <span>{c.name}</span>
              <span className="font-mono text-white/50">{c.hex.toUpperCase()}</span>
            </div>
          )
        })()}
      </div>

      {ral && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 bg-terracotta/5 border border-terracotta/20 rounded-lg">
          <div className="w-5 h-5 rounded flex-shrink-0 border border-black/10" style={{ background: hex }} />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-charcoal-800 leading-tight">{name}</p>
            <p className="text-[10px] font-mono text-charcoal-500 leading-tight">{ral} · {hex.toUpperCase()}</p>
          </div>
          <button
            type="button"
            onClick={() => { onHex('#C96B4A'); onRal(''); onName('') }}
            className="text-charcoal-300 hover:text-charcoal-600 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
