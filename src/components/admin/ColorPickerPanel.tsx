'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, Loader2, X } from 'lucide-react'
import { RAL_CLASSIC, RAL_EFFECT_SOLID, RAL_EFFECT_METALLIC } from '@/lib/ralColors'

/* ─── Color utilities ─────────────────────────────────────────────────────── */

function hsvToHex(h: number, s: number, v: number): string {
  const hh = h / 60, i = Math.floor(hh), ff = hh - i
  const p = v * (1 - s), q = v * (1 - s * ff), t = v * (1 - s * (1 - ff))
  let r: number, g: number, b: number
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    default: r = v; g = p; b = q
  }
  return '#' + [r, g, b].map(n => Math.round(n * 255).toString(16).padStart(2, '0')).join('')
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const c = hex.replace('#', '')
  if (c.length !== 6) return { h: 0, s: 0, v: 1 }
  const r = parseInt(c.slice(0, 2), 16) / 255
  const g = parseInt(c.slice(2, 4), 16) / 255
  const b = parseInt(c.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    else if (max === g) h = ((b - r) / d + 2) * 60
    else h = ((r - g) / d + 4) * 60
  }
  return { h, s: max === 0 ? 0 : d / max, v: max }
}

function isValidHex(hex: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(hex)
}


/* ─── Preset palette ──────────────────────────────────────────────────────── */

const PRESET_COLORS = [
  '#FFFFFF','#F5F0EA','#E8DCC4','#D4C5A9','#C4B49A',
  '#A0785A','#8B5A3C','#6B3A2A','#3D1F10','#1A0A00',
  '#C96B4A','#B85A35','#D4845A','#E8A882','#F2C4A8',
  '#7A9E7E','#5A8A60','#3D6B42','#2A4A2E','#1A3020',
  '#7B8FA1','#5A7A91','#3D6280','#2A4A62','#1A3048',
  '#9B8EA8','#7A6B8A','#5C4F6B','#3E3350','#251D36',
  '#C4A882','#A8846A','#8B6450','#6B4A38','#4A3025',
  '#B0B0B0','#888888','#555555','#333333','#111111',
]

/* ─── Component ───────────────────────────────────────────────────────────── */

interface ColorPickerPanelProps {
  hex: string
  setHex: (hex: string) => void
  name: string
  setName: (name: string) => void
  ralCode?: string
  setRalCode?: (code: string) => void
  onAdd: () => void
  onCancel: () => void
  isLoading: boolean
  error: string | null
}

export function ColorPickerPanel({
  hex, setHex, name, setName,
  ralCode = '', setRalCode,
  onAdd, onCancel, isLoading, error,
}: ColorPickerPanelProps) {
  const [tab, setTab] = useState<'picker' | 'presets' | 'ral'>('picker')
  const [ralSystem, setRalSystem] = useState<'classic' | 'effect' | 'metallic'>('classic')
  const [ralSearch, setRalSearch] = useState('')

  // HSV state — driven from hex prop
  const [hue, setHue] = useState(0)
  const [sat, setSat] = useState(1)
  const [val, setVal] = useState(1)

  // Sync hex → HSV on mount and external hex changes
  useEffect(() => {
    if (isValidHex(hex)) {
      const { h, s, v } = hexToHsv(hex)
      setHue(h); setSat(s); setVal(v)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Emit hex whenever HSV sliders change
  const updateFromHsv = useCallback((h: number, s: number, v: number) => {
    setHue(h); setSat(s); setVal(v)
    setHex(hsvToHex(h, s, v))
  }, [setHex])

  /* ── SV square drag ── */
  const svRef = useRef<HTMLDivElement>(null)

  const applySvPos = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!svRef.current) return
    const rect = svRef.current.getBoundingClientRect()
    const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
    updateFromHsv(hue, s, v)
  }, [hue, updateFromHsv])

  const handleSvMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    applySvPos(e)
    const move = (ev: MouseEvent) => applySvPos(ev)
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  /* ── Hue bar drag ── */
  const hueRef = useRef<HTMLDivElement>(null)

  const applyHuePos = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!hueRef.current) return
    const rect = hueRef.current.getBoundingClientRect()
    const h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360))
    updateFromHsv(h, sat, val)
  }, [sat, val, updateFromHsv])

  const handleHueMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    applyHuePos(e)
    const move = (ev: MouseEvent) => applyHuePos(ev)
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  /* ── Hex text input ── */
  const handleHexInput = (raw: string) => {
    const v = raw.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)
    const full = '#' + v
    setHex(full)
    if (v.length === 6) {
      const { h, s, vv } = { ...hexToHsv(full), vv: hexToHsv(full).v }
      setHue(h); setSat(s); setVal(vv)
    }
  }

  /* ── RAL selection ── */
  const ralSourceMap = {
    classic: RAL_CLASSIC,
    effect: RAL_EFFECT_SOLID,
    metallic: RAL_EFFECT_METALLIC,
  }
  const ralSource = ralSourceMap[ralSystem]

  const filteredRal = ralSource.filter(c =>
    c.code.toLowerCase().includes(ralSearch.toLowerCase()) ||
    c.name.toLowerCase().includes(ralSearch.toLowerCase())
  )

  const selectRal = (c: typeof RAL_CLASSIC[0]) => {
    setHex(c.hex)
    if (setRalCode) setRalCode(c.code)
    if (!name) setName(c.name)
    const { h, s, v } = hexToHsv(c.hex)
    setHue(h); setSat(s); setVal(v)
  }

  const hueColor = `hsl(${hue}deg 100% 50%)`

  return (
    <div className="mt-4 rounded-xl border border-[#e8dcc4] bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8dcc4] bg-cream/30">
        <span className="text-xs font-semibold text-charcoal uppercase tracking-widest">New Colour</span>
        <button type="button" onClick={onCancel}
          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-charcoal/10 transition-colors text-charcoal/40 hover:text-charcoal">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#e8dcc4]">
        {(['picker', 'presets', 'ral'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold transition-colors capitalize ${
              tab === t
                ? 'text-terracotta border-b-2 border-terracotta bg-terracotta/5'
                : 'text-charcoal/50 hover:text-charcoal hover:bg-gray-50'
            }`}
          >
            {t === 'ral' ? 'RAL Classic' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-4">
        {/* ── PICKER TAB ── */}
        {tab === 'picker' && (
          <div className="space-y-3">
            {/* SV square */}
            <div
              ref={svRef}
              onMouseDown={handleSvMouseDown}
              className="relative w-full rounded-lg cursor-crosshair select-none"
              style={{
                height: 160,
                background: `linear-gradient(to bottom, transparent, #000),
                             linear-gradient(to right, #fff, ${hueColor})`,
              }}
            >
              {/* Cursor */}
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{
                  left: `${sat * 100}%`,
                  top: `${(1 - val) * 100}%`,
                  backgroundColor: hex,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.3), 0 2px 6px rgba(0,0,0,0.4)',
                }}
              />
            </div>

            {/* Hue bar */}
            <div
              ref={hueRef}
              onMouseDown={handleHueMouseDown}
              className="relative h-4 rounded-full cursor-pointer select-none"
              style={{
                background: 'linear-gradient(to right, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)',
              }}
            >
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-md pointer-events-none"
                style={{
                  left: `${(hue / 360) * 100}%`,
                  backgroundColor: hueColor,
                  boxShadow: '0 0 0 1px rgba(0,0,0,0.25), 0 2px 4px rgba(0,0,0,0.3)',
                }}
              />
            </div>
          </div>
        )}

        {/* ── PRESETS TAB ── */}
        {tab === 'presets' && (
          <div className="flex flex-wrap gap-1.5">
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setHex(c)
                  const { h, s, v } = hexToHsv(c)
                  setHue(h); setSat(s); setVal(v)
                }}
                title={c}
                className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 flex-shrink-0 ${
                  hex.toLowerCase() === c.toLowerCase()
                    ? 'border-charcoal shadow-md scale-110'
                    : 'border-transparent hover:border-charcoal/30'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {/* ── RAL TAB ── */}
        {tab === 'ral' && (
          <div className="space-y-2">
            {/* Sub-system selector */}
            <div className="flex gap-1 bg-cream/40 p-0.5 rounded-lg border border-[#e8dcc4]">
              {([
                { key: 'classic', label: 'Classic', count: RAL_CLASSIC.length },
                { key: 'effect', label: 'Effect', count: RAL_EFFECT_SOLID.length },
                { key: 'metallic', label: 'Metallic', count: RAL_EFFECT_METALLIC.length },
              ] as const).map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => { setRalSystem(s.key); setRalSearch('') }}
                  className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${
                    ralSystem === s.key
                      ? 'bg-white text-terracotta shadow-sm'
                      : 'text-charcoal/50 hover:text-charcoal'
                  }`}
                >
                  {s.label} <span className="opacity-60">({s.count})</span>
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search code or name…"
              value={ralSearch}
              onChange={e => setRalSearch(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-[#e8dcc4] rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all bg-white placeholder:text-charcoal/30"
            />
            <div className="grid grid-cols-2 gap-1 max-h-44 overflow-y-auto pr-1">
              {filteredRal.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => selectRal(c)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all hover:bg-cream/60 ${
                    ralCode === c.code ? 'ring-2 ring-terracotta bg-terracotta/5' : ''
                  }`}
                >
                  <div
                    className="w-6 h-6 rounded flex-shrink-0 border border-black/10 shadow-sm"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-charcoal truncate">{c.code}</p>
                    <p className="text-[9px] text-charcoal/50 truncate">{c.name}</p>
                  </div>
                </button>
              ))}
              {filteredRal.length === 0 && (
                <p className="col-span-2 text-xs text-charcoal/40 text-center py-4">No colours found</p>
              )}
            </div>
          </div>
        )}

        {/* ── Preview + inputs ── */}
        <div className="flex items-center gap-3 pt-1 border-t border-[#e8dcc4]">
          {/* Swatch preview */}
          <div
            className="w-10 h-10 rounded-xl border border-[#e8dcc4] shadow-sm flex-shrink-0"
            style={{ backgroundColor: hex }}
          />
          {/* Hex */}
          <div className="flex items-center gap-1 bg-cream/40 border border-[#e8dcc4] rounded-lg px-2.5 py-2 w-28 focus-within:ring-2 focus-within:ring-terracotta/40 focus-within:border-terracotta transition-all">
            <span className="text-charcoal/30 text-xs font-mono select-none">#</span>
            <input
              type="text"
              value={hex.replace('#', '').toUpperCase()}
              onChange={e => handleHexInput(e.target.value)}
              className="w-full bg-transparent text-xs font-mono text-charcoal focus:outline-none uppercase"
              placeholder="C96B4A"
              maxLength={6}
            />
          </div>
          {/* Name */}
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onAdd() } }}
            className="flex-1 px-3 py-2 bg-white border border-[#e8dcc4] rounded-lg text-sm text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-terracotta/40 focus:border-terracotta transition-all"
            placeholder="Colour name (e.g. Desert Sand)"
            autoFocus
          />
        </div>

        {/* RAL code display */}
        {ralCode && (
          <p className="text-xs text-charcoal/50 -mt-2 pl-[52px]">
            RAL: <span className="font-semibold text-charcoal">{ralCode}</span>
          </p>
        )}

        {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onAdd}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-5 py-2 bg-terracotta text-white text-xs font-semibold rounded-lg hover:bg-terracotta/90 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {isLoading ? 'Adding…' : 'Add Colour'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2 border border-[#e8dcc4] text-charcoal/60 text-xs font-semibold rounded-lg hover:bg-cream/60 hover:text-charcoal transition-all"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
