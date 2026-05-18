'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { RAL_COLORS, RAL_CATEGORIES, type RalCategory, type RalColor, ralHex } from '@/lib/ralColors'

interface Props {
  /** Currently-selected RAL code (e.g. "RAL 9005"). Null = nothing selected. */
  value:    string | null
  onChange: (color: RalColor | null) => void
  /** Optional starting category — defaults to "Classic". */
  initialCategory?: RalCategory
  /** Compact mode shrinks tile size + reduces spacing. */
  compact?: boolean
}

/**
 * RAL-only color picker.
 * Replaces ad-hoc hex pickers + preset chips with a searchable, category-filtered grid.
 * Single source of truth: every color comes from RAL_COLORS in `src/lib/ralColors.ts`.
 */
export function RalColorPicker({ value, onChange, initialCategory = 'Classic', compact = false }: Props) {
  const [category, setCategory] = useState<RalCategory>(initialCategory)
  const [query,    setQuery]    = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return RAL_COLORS.filter(c =>
      c.category === category &&
      (!q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
    )
  }, [category, query])

  const selected = useMemo(() => RAL_COLORS.find(c => c.code === value) ?? null, [value])

  const tileSize = compact ? 'w-10 h-10' : 'w-12 h-12'

  return (
    <div className="space-y-3">
      {/* Header — category tabs + search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex gap-1.5 bg-cream/60 rounded-xl p-1 border border-[#E8E0D5]">
          {RAL_CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                category === cat
                  ? 'bg-terracotta text-white shadow-sm'
                  : 'text-charcoal-600 hover:text-charcoal-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-300" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search RAL code or name…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-[#E8E0D5] bg-white focus:outline-none focus:border-terracotta/60 transition-colors"
          />
        </div>
      </div>

      {/* Selected preview */}
      {selected && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-cream/60 border border-[#E8E0D5]">
          <div
            className="w-10 h-10 rounded-lg border border-charcoal-200 flex-shrink-0"
            style={{ backgroundColor: selected.hex }}
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-mono text-charcoal-500">{selected.code}</p>
            <p className="text-sm font-semibold text-charcoal-900 truncate">{selected.name}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-charcoal-400 hover:text-rose-600 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="border border-[#E8E0D5] rounded-xl bg-white max-h-72 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <p className="text-center text-sm text-charcoal-400 py-8">No matching RAL colors.</p>
        ) : (
          <div className={`grid gap-1.5 ${compact ? 'grid-cols-12' : 'grid-cols-10'}`}>
            {filtered.map(c => {
              const isActive = value === c.code
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => onChange(c)}
                  title={`${c.code} — ${c.name}`}
                  aria-label={`${c.code} ${c.name}`}
                  className={`${tileSize} rounded-lg border-2 transition-all duration-100 ${
                    isActive
                      ? 'border-terracotta scale-110 shadow-md ring-2 ring-terracotta/30'
                      : 'border-transparent hover:border-charcoal-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              )
            })}
          </div>
        )}
      </div>
      <p className="text-[10px] text-charcoal-400">
        {filtered.length} colors · category: <strong className="text-charcoal-600">{category}</strong>
      </p>
    </div>
  )
}

// Re-export for convenience.
export { ralHex }
