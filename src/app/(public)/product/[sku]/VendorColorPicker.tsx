'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Check, X } from 'lucide-react'
import { RAL_CLASSIC, RAL_EFFECT_SOLID, RAL_EFFECT_METALLIC } from '@/lib/ralColors'

/* ─── Color utilities ─────────────────────────────────────────────────────── */

function hsvToHex(h: number, s: number, v: number): string {
  const hh = h / 60, i = Math.floor(hh), ff = hh - i
  const p = v * (1 - s), q = v * (1 - s * ff), t = v * (1 - s * (1 - ff))
  let r: number, g: number, b: number
  switch (i % 6) {
    case 0:  r = v; g = t; b = p; break
    case 1:  r = q; g = v; b = p; break
    case 2:  r = p; g = v; b = t; break
    case 3:  r = p; g = q; b = v; break
    case 4:  r = t; g = p; b = v; break
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

function isValidHex(hex: string) { return /^#[0-9A-Fa-f]{6}$/.test(hex) }

/* ─── Presets ─────────────────────────────────────────────────────────────── */

const PRESETS = [
  '#FFFFFF','#F5F0EA','#E8DCC4','#D4C5A9','#C4B49A',
  '#A0785A','#8B5A3C','#6B3A2A','#3D1F10','#1A0A00',
  '#C96B4A','#B85A35','#D4845A','#E8A882','#F2C4A8',
  '#7A9E7E','#5A8A60','#3D6B42','#2A4A2E','#1A3020',
  '#7B8FA1','#5A7A91','#3D6280','#2A4A62','#1A3048',
  '#9B8EA8','#7A6B8A','#5C4F6B','#3E3350','#251D36',
  '#C4A882','#A8846A','#8B6450','#6B4A38','#4A3025',
  '#B0B0B0','#888888','#555555','#333333','#111111',
]

/* ─── Props ───────────────────────────────────────────────────────────────── */

export interface CustomColorValue {
  hex: string
  name: string
  ralCode: string
}

interface VendorColorPickerProps {
  onConfirm: (color: CustomColorValue) => void
  onCancel: () => void
}

/* ─── Component ───────────────────────────────────────────────────────────── */

export function VendorColorPicker({ onConfirm, onCancel }: VendorColorPickerProps) {
  // Vendor flow only exposes the RAL picker (HSV picker and presets are
  // hidden so vendors choose from the catalogue palette instead).
  const [tab] = useState<'picker' | 'presets' | 'ral'>('ral')
  const [ralSystem, setRalSystem] = useState<'classic' | 'effect' | 'metallic'>('classic')
  const [ralSearch, setRalSearch] = useState('')

  const [hex, setHexState] = useState('#C96B4A')
  const [name, setName] = useState('')
  const [ralCode, setRalCode] = useState('')

  const [hue, setHue] = useState(0)
  const [sat, setSat] = useState(1)
  const [val, setVal] = useState(1)

  useEffect(() => {
    const { h, s, v } = hexToHsv(hex)
    setHue(h); setSat(s); setVal(v)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const setHex = useCallback((h: string) => {
    setHexState(h)
    setRalCode('')   // clear RAL when manually picking
  }, [])

  const updateFromHsv = useCallback((h: number, s: number, v: number) => {
    setHue(h); setSat(s); setVal(v)
    setHexState(hsvToHex(h, s, v))
    setRalCode('')
  }, [])

  /* SV square */
  const svRef = useRef<HTMLDivElement>(null)
  const applySv = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!svRef.current) return
    const rect = svRef.current.getBoundingClientRect()
    const s = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const v = Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / rect.height))
    updateFromHsv(hue, s, v)
  }, [hue, updateFromHsv])

  const onSvDown = (e: React.MouseEvent) => {
    e.preventDefault(); applySv(e)
    const move = (ev: MouseEvent) => applySv(ev)
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  /* Hue bar */
  const hueRef = useRef<HTMLDivElement>(null)
  const applyHue = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!hueRef.current) return
    const rect = hueRef.current.getBoundingClientRect()
    const h = Math.max(0, Math.min(360, ((e.clientX - rect.left) / rect.width) * 360))
    updateFromHsv(h, sat, val)
  }, [sat, val, updateFromHsv])

  const onHueDown = (e: React.MouseEvent) => {
    e.preventDefault(); applyHue(e)
    const move = (ev: MouseEvent) => applyHue(ev)
    const up = () => { document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', up) }
    document.addEventListener('mousemove', move)
    document.addEventListener('mouseup', up)
  }

  /* Hex text input */
  const handleHexInput = (raw: string) => {
    const v = raw.replace(/[^0-9A-Fa-f]/g, '').slice(0, 6)
    const full = '#' + v
    setHexState(full)
    setRalCode('')
    if (v.length === 6) {
      const { h, s, v: vv } = hexToHsv(full)
      setHue(h); setSat(s); setVal(vv)
    }
  }

  /* RAL */
  const ralSource = ralSystem === 'classic' ? RAL_CLASSIC : ralSystem === 'effect' ? RAL_EFFECT_SOLID : RAL_EFFECT_METALLIC
  const filteredRal = ralSource.filter(c =>
    c.code.toLowerCase().includes(ralSearch.toLowerCase()) ||
    c.name.toLowerCase().includes(ralSearch.toLowerCase())
  )
  const selectRal = (c: typeof RAL_CLASSIC[0]) => {
    setHexState(c.hex)
    setRalCode(c.code)
    if (!name) setName(c.name)
    const { h, s, v } = hexToHsv(c.hex)
    setHue(h); setSat(s); setVal(v)
  }

  const hueColor = `hsl(${hue}deg 100% 50%)`

  function handleConfirm() {
    if (!isValidHex(hex)) return
    onConfirm({ hex, name: name.trim() || hex.toUpperCase(), ralCode })
  }

  return (
    <div className="bg-[#F5EDE0] border border-[#C96B4A]/20 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#C96B4A]/15">
        <span className="text-[10px] font-semibold text-[#C96B4A] uppercase tracking-wider">Custom Colour</span>
        <button type="button" onClick={onCancel} className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#C96B4A]/10 text-[#2D2926]/40 hover:text-[#2D2926] transition-colors">
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Tabs hidden — vendor picker is RAL-only */}

      <div className="p-4 space-y-3">
        {/* ── PICKER ── */}
        {tab === 'picker' && (
          <div className="space-y-2">
            <div
              ref={svRef}
              onMouseDown={onSvDown}
              className="relative w-full rounded-lg cursor-crosshair select-none"
              style={{ height: 140, background: `linear-gradient(to bottom, transparent, #000), linear-gradient(to right, #fff, ${hueColor})` }}
            >
              <div
                className="absolute w-4 h-4 rounded-full border-2 border-white pointer-events-none -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${sat * 100}%`, top: `${(1 - val) * 100}%`, backgroundColor: hex, boxShadow: '0 0 0 1px rgba(0,0,0,0.3),0 2px 6px rgba(0,0,0,0.4)' }}
              />
            </div>
            <div
              ref={hueRef}
              onMouseDown={onHueDown}
              className="relative h-3.5 rounded-full cursor-pointer select-none"
              style={{ background: 'linear-gradient(to right,#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' }}
            >
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white pointer-events-none"
                style={{ left: `${(hue / 360) * 100}%`, backgroundColor: hueColor, boxShadow: '0 0 0 1px rgba(0,0,0,0.25),0 2px 4px rgba(0,0,0,0.3)' }}
              />
            </div>
          </div>
        )}

        {/* ── PRESETS ── */}
        {tab === 'presets' && (
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => { setHexState(c); setRalCode(''); const { h, s, v } = hexToHsv(c); setHue(h); setSat(s); setVal(v) }}
                title={c}
                className={`w-6 h-6 rounded-md border-2 transition-all hover:scale-110 flex-shrink-0 ${hex.toLowerCase() === c.toLowerCase() ? 'border-[#C96B4A] shadow-md scale-110' : 'border-transparent hover:border-[#C96B4A]/40'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}

        {/* ── RAL ── */}
        {tab === 'ral' && (
          <div className="space-y-2">
            <div className="flex gap-1 bg-white/60 p-0.5 rounded-lg border border-[#C96B4A]/15">
              {([
                { key: 'classic',  label: 'Classic',  count: RAL_CLASSIC.length },
                { key: 'effect',   label: 'Effect',   count: RAL_EFFECT_SOLID.length },
                { key: 'metallic', label: 'Metallic', count: RAL_EFFECT_METALLIC.length },
              ] as const).map(s => (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => { setRalSystem(s.key); setRalSearch('') }}
                  className={`flex-1 py-1 text-[10px] font-semibold rounded-md transition-all ${
                    ralSystem === s.key ? 'bg-white text-[#C96B4A] shadow-sm' : 'text-[#2D2926]/40 hover:text-[#2D2926]'
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
              className="w-full px-3 py-1.5 text-xs border border-[#D9D0C7] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#C96B4A]/30 focus:border-[#C96B4A] placeholder:text-[#2D2926]/30"
            />
            <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto px-0.5 pt-0.5 -mx-0.5">
              {filteredRal.map(c => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => selectRal(c)}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-all hover:bg-white/80 ${ralCode === c.code ? 'ring-2 ring-[#C96B4A] bg-[#C96B4A]/5' : ''}`}
                >
                  <div className="w-5 h-5 rounded flex-shrink-0 border border-black/10" style={{ backgroundColor: c.hex }} />
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-[#2D2926] truncate">{c.code}</p>
                    <p className="text-[9px] text-[#2D2926]/50 truncate">{c.name}</p>
                  </div>
                </button>
              ))}
              {filteredRal.length === 0 && (
                <p className="col-span-2 text-xs text-[#2D2926]/40 text-center py-4">No colours found</p>
              )}
            </div>
          </div>
        )}

        {/* ── Preview row ── */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#C96B4A]/15">
          <div className="w-9 h-9 rounded-lg border border-[#C96B4A]/20 shadow-sm flex-shrink-0" style={{ backgroundColor: hex }} />
          <div className="flex items-center gap-1 bg-white border border-[#D9D0C7] rounded-lg px-2 py-1.5 w-24 focus-within:ring-2 focus-within:ring-[#C96B4A]/30 focus-within:border-[#C96B4A]">
            <span className="text-[#2D2926]/30 text-xs font-mono select-none">#</span>
            <input
              type="text"
              value={hex.replace('#', '').toUpperCase()}
              onChange={e => handleHexInput(e.target.value)}
              className="w-full bg-transparent text-xs font-mono text-[#2D2926] focus:outline-none uppercase"
              placeholder="C96B4A"
              maxLength={6}
            />
          </div>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleConfirm() } }}
            className="flex-1 px-2.5 py-1.5 bg-white border border-[#D9D0C7] rounded-lg text-xs text-[#2D2926] placeholder:text-[#2D2926]/30 focus:outline-none focus:ring-2 focus:ring-[#C96B4A]/30 focus:border-[#C96B4A]"
            placeholder="Colour name (optional)"
          />
        </div>

        {ralCode && (
          <p className="text-[10px] text-[#2D2926]/40 -mt-1 pl-11">
            RAL: <span className="font-semibold text-[#2D2926]/70">{ralCode}</span>
          </p>
        )}

        {/* Confirm */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={!isValidHex(hex)}
          className="w-full flex items-center justify-center gap-1.5 bg-[#C96B4A] hover:bg-[#B85C3B] text-white text-xs font-bold py-2.5 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          Use This Colour
        </button>
      </div>
    </div>
  )
}
