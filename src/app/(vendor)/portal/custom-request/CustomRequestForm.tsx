'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  Upload, X, Plus, Minus, CheckCircle2, Loader2,
  ImageIcon, Palette, Layers, Ruler, Droplets, FileText, Send,
  AlertCircle, ChevronDown, Wand2,
} from 'lucide-react'
import { RAL_COLORS, RAL_CATEGORIES, type RalCategory } from '@/lib/ralColors'

/* Color families (Classic only has these meaningful groupings). */
const CLASSIC_GROUPS = ['Yellow', 'Orange', 'Red', 'Violet', 'Blue', 'Green', 'Grey', 'Brown', 'White/Black']

/* Map RAL classic code first digit → group name. */
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

interface Color   { id: string; name: string; hexCode?: string | null }
interface Texture { id: string; name: string; imageUrl?: string | null }
interface Finish  { id: string; name: string }

interface Props {
  colors:   Color[]
  textures: Texture[]
  finishes: Finish[]
}

interface Dim { id: string; label: string; value: string; unit: string }

const uid    = () => Math.random().toString(36).slice(2)
const UNITS  = ['mm', 'cm', 'm', 'in']
const LABELS = ['Top Dia', 'Bottom Dia', 'Height', 'Width', 'Depth', 'Neck Dia', 'Length', 'Diameter']
const HOLES  = ['No Holes', 'Single Drainage Hole', 'Multiple Drainage Holes', 'Custom Hole Pattern']

const SECTIONS = [
  { num: 1, title: 'Design Brief',           icon: FileText  },
  { num: 2, title: 'Dimensions',             icon: Ruler     },
  { num: 3, title: 'Colour',                 icon: Palette   },
  { num: 4, title: 'Texture',                icon: Layers    },
  { num: 5, title: 'Finish & Drainage',      icon: Droplets  },
  { num: 6, title: 'Reference Images',       icon: ImageIcon },
  { num: 7, title: 'Additional Notes',       icon: FileText  },
]

/* ─────────────────────────────────────────────────────── LabelSelect */
function LabelSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open,  setOpen]  = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)

  const position = useCallback(() => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const up = window.innerHeight - r.bottom < 260 && r.top > window.innerHeight - r.bottom
    setStyle(up
      ? { position: 'fixed', bottom: window.innerHeight - r.top + 6, left: r.left, width: Math.max(r.width, 140), zIndex: 9999 }
      : { position: 'fixed', top: r.bottom + 6, left: r.left, width: Math.max(r.width, 140), zIndex: 9999 })
  }, [])

  function handleOpen() { position(); setOpen(o => !o) }

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const dropdown = open ? (
    <div style={style} className="rounded-xl border border-[#E8E0D5] bg-white shadow-xl shadow-black/10 overflow-hidden py-1">
      {LABELS.map(l => (
        <button key={l} type="button"
          onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
          onClick={() => { onChange(l); setOpen(false) }}
          className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors ${
            value === l ? 'bg-terracotta/8 text-terracotta font-semibold' : 'text-charcoal-700 hover:bg-[#F5F0EB]'
          }`}
        >
          {l}
          {value === l && <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />}
        </button>
      ))}
    </div>
  ) : null

  return (
    <div ref={ref} className="relative w-36 flex-shrink-0">
      <button type="button" onClick={handleOpen}
        className={`w-full flex items-center justify-between gap-1 px-3 py-2.5 rounded-xl border text-sm transition-all bg-white ${
          open ? 'border-terracotta ring-2 ring-terracotta/20' : 'border-[#E8E0D5] hover:border-terracotta/50'
        }`}
      >
        <span className={`truncate ${value ? 'font-semibold text-charcoal-800' : 'text-charcoal-300'}`}>
          {value || 'Dimension'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-charcoal-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {typeof window !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── UnitSelect */
function UnitSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open,  setOpen]  = useState(false)
  const [style, setStyle] = useState<React.CSSProperties>({})
  const ref = useRef<HTMLDivElement>(null)

  const position = useCallback(() => {
    if (!ref.current) return
    const r = ref.current.getBoundingClientRect()
    const up = window.innerHeight - r.bottom < 180 && r.top > window.innerHeight - r.bottom
    setStyle(up
      ? { position: 'fixed', bottom: window.innerHeight - r.top + 6, left: r.left, width: Math.max(r.width, 80), zIndex: 9999 }
      : { position: 'fixed', top: r.bottom + 6, left: r.left, width: Math.max(r.width, 80), zIndex: 9999 })
  }, [])

  function handleOpen() { position(); setOpen(o => !o) }

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const dropdown = open ? (
    <div style={style} className="rounded-xl border border-[#E8E0D5] bg-white shadow-xl shadow-black/10 overflow-hidden py-1">
      {UNITS.map(u => (
        <button key={u} type="button"
          onMouseDown={e => { e.preventDefault(); e.stopPropagation() }}
          onClick={() => { onChange(u); setOpen(false) }}
          className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors ${
            value === u ? 'bg-terracotta/8 text-terracotta font-semibold' : 'text-charcoal-700 hover:bg-[#F5F0EB]'
          }`}
        >
          {u}
          {value === u && <span className="w-1.5 h-1.5 rounded-full bg-terracotta" />}
        </button>
      ))}
    </div>
  ) : null

  return (
    <div ref={ref} className="relative w-[72px] flex-shrink-0">
      <button type="button" onClick={handleOpen}
        className={`w-full flex items-center justify-between gap-1 px-3 py-2.5 rounded-xl border text-sm transition-all bg-white ${
          open ? 'border-terracotta ring-2 ring-terracotta/20' : 'border-[#E8E0D5] hover:border-terracotta/50'
        }`}
      >
        <span className="font-semibold text-charcoal-800">{value}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-charcoal-400 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {typeof window !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── CustomColorPicker */
function CustomColorPicker({ hex, name, ral, onHex, onName, onRal }: {
  hex: string; name: string; ral: string
  onHex: (v: string) => void; onName: (v: string) => void; onRal: (v: string) => void
}) {
  const [activeCategory, setActiveCategory] = useState<RalCategory>('Classic')
  const [activeGroup,    setActiveGroup]    = useState<string>(CLASSIC_GROUPS[0])
  const [hoveredRal,     setHoveredRal]     = useState<string | null>(null)

  const groupColors = activeCategory === 'Classic'
    ? RAL_COLORS.filter(c => c.category === 'Classic' && classicGroup(c.code) === activeGroup)
    : RAL_COLORS.filter(c => c.category === activeCategory)

  function selectRal(c: typeof RAL_COLORS[0]) { onHex(c.hex); onRal(c.code); onName(c.name) }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-lg border-2 border-[#EDE7DE] shadow-sm cursor-pointer overflow-hidden relative" style={{ background: hex }}>
            <input type="color" value={hex} onChange={e => { onHex(e.target.value); onRal(''); onName('') }}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" title="Pick a colour" />
          </div>
          <p className="text-[9px] text-charcoal-400 text-center mt-0.5 font-mono">{hex.toUpperCase()}</p>
        </div>
        <div className="flex-1 space-y-1.5">
          <input value={name} onChange={e => onName(e.target.value)} placeholder="Colour name" className="form-input text-xs py-1.5" />
          <input value={ral}  onChange={e => onRal(e.target.value)}  placeholder="RAL code"     className="form-input text-xs py-1.5 font-mono" />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-[#EDE7DE]" />
        <span className="text-[10px] font-semibold text-charcoal-400 uppercase tracking-widest">RAL Range</span>
        <div className="flex-1 h-px bg-[#EDE7DE]" />
      </div>

      {/* Category tabs: Classic / Effect / Metallic */}
      <div className="flex gap-1 flex-wrap">
        {RAL_CATEGORIES.map(cat => (
          <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider transition-all ${
              activeCategory === cat ? 'bg-charcoal-900 text-white' : 'bg-[#F5F0EB] text-charcoal-600 hover:bg-[#EDE7DE]'
            }`}
          >{cat}</button>
        ))}
      </div>

      {/* Color family chips — only meaningful for Classic */}
      {activeCategory === 'Classic' && (
        <div className="flex gap-1 flex-wrap">
          {CLASSIC_GROUPS.map(g => (
            <button key={g} type="button" onClick={() => setActiveGroup(g)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                activeGroup === g ? 'bg-terracotta text-white' : 'bg-[#F5F0EB] text-charcoal-600 hover:bg-[#EDE7DE]'
              }`}
            >{g}</button>
          ))}
        </div>
      )}

      <div className="relative">
        <div className="flex flex-wrap gap-1">
          {groupColors.map(c => {
            const isSelected = ral === c.code
            return (
              <button key={c.code} type="button" onClick={() => selectRal(c)}
                onMouseEnter={() => setHoveredRal(c.code)} onMouseLeave={() => setHoveredRal(null)}
                title={`${c.code} – ${c.name}`}
                className={`w-[55px] h-[55px] rounded-lg transition-all relative ${
                  isSelected ? 'ring-2 ring-terracotta ring-offset-1 scale-105' : 'hover:scale-105 hover:ring-1 hover:ring-charcoal-300'
                }`}
                style={{ background: c.hex }}
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
          <button type="button" onClick={() => { onHex('#C96B4A'); onRal(''); onName('') }} className="text-charcoal-300 hover:text-charcoal-600 transition-colors">
            <X size={12} />
          </button>
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────────────── Section */
function Section({
  id, num, title, icon: Icon, children,
  sectionRef,
}: {
  id: string; num: number; title: string; icon: React.ElementType
  children: React.ReactNode; sectionRef?: (el: HTMLDivElement | null) => void
}) {
  return (
    <div id={id} ref={sectionRef} className="bg-white border border-[#EDE7DE] rounded-2xl overflow-hidden scroll-mt-6">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-[#EDE7DE] bg-[#FAF7F4]">
        <span className="w-7 h-7 rounded-full bg-terracotta text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
          {num}
        </span>
        <Icon className="w-4 h-4 text-terracotta flex-shrink-0" />
        <h2 className="font-heading font-semibold text-[15px] text-charcoal-900">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────── Main */
export function CustomRequestForm({ colors, textures, finishes }: Props) {
  const router = useRouter()

  // Brief
  const [title,       setTitle]       = useState('')
  const [description, setDescription] = useState('')
  const [quantity,    setQuantity]    = useState(1)

  // Dimensions
  const [dims, setDims] = useState<Dim[]>([{ id: uid(), label: '', value: '', unit: 'mm' }])

  /* ── Custom-size pricing (mirrors ProductCustomizer) ────────────────────
     Open-top box surface area × AED 300/m².
        SA = 2(L×H) + 2(W×H) + (L×W)   in m²
     All three (Length, Width, Height) required; any unit accepted. */
  const CUSTOM_RATE_PER_SQM = 300 // AED

  function toMetres(value: number, unit: string): number {
    const u = unit.toLowerCase()
    if (u === 'mm') return value / 1000
    if (u === 'cm') return value / 100
    if (u === 'm')  return value
    if (u === 'in' || u === 'inch' || u === 'inches') return value * 0.0254
    if (u === 'ft' || u === 'feet') return value * 0.3048
    return value
  }

  function findDimByLabel(label: string): { value: number; unit: string } | null {
    const want = label.toLowerCase()
    const d = dims.find(x =>
      x.label.trim().toLowerCase() === want ||
      x.label.trim().toLowerCase() === want.charAt(0)
    )
    if (!d) return null
    const n = parseFloat(d.value)
    if (!Number.isFinite(n) || n <= 0) return null
    return { value: n, unit: d.unit }
  }

  const customPriceCalc = (() => {
    const L = findDimByLabel('length')
    const W = findDimByLabel('width')
    const H = findDimByLabel('height')
    if (!L || !W || !H) return null
    const lM = toMetres(L.value, L.unit)
    const wM = toMetres(W.value, W.unit)
    const hM = toMetres(H.value, H.unit)
    if (lM <= 0 || wM <= 0 || hM <= 0) return null
    const surfaceArea = 2 * (lM * hM) + 2 * (wM * hM) + (lM * wM)
    const unitPrice   = surfaceArea * CUSTOM_RATE_PER_SQM
    return {
      L: { raw: L },
      W: { raw: W },
      H: { raw: H },
      surfaceArea,
      unitPrice,
    }
  })()

  // Finish options
  const [colorMode,       setColorMode]       = useState<'catalog' | 'custom'>('catalog')
  const [selectedColor,   setSelectedColor]   = useState('')
  const [customColorHex,  setCustomColorHex]  = useState('#C96B4A')
  const [customColorName, setCustomColorName] = useState('')
  const [customColorRal,  setCustomColorRal]  = useState('')

  const [textureMode,      setTextureMode]      = useState<'catalog' | 'custom'>('catalog')
  const [selectedTexture,  setSelectedTexture]  = useState('')
  const [customTexture,    setCustomTexture]    = useState('')
  const [customTextureUrl, setCustomTextureUrl] = useState<string | null>(null)
  const [uploadingTex,     setUploadingTex]     = useState(false)
  const textureInputRef = useRef<HTMLInputElement>(null)

  const [selectedFinish, setSelectedFinish] = useState('')
  const [holesOption,    setHolesOption]    = useState('')

  // Reference images
  const [images,       setImages]       = useState<{ url: string; name: string }[]>([])
  const [uploadingImg, setUploadingImg] = useState(false)
  const [dragOver,     setDragOver]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Notes / submit
  const [notes,       setNotes]       = useState('')
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Section nav — active tracking
  const [activeSection, setActiveSection] = useState(0)
  const sectionEls = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    const observers = sectionEls.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveSection(i) },
        { threshold: 0.25, rootMargin: '-80px 0px -60% 0px' }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  function scrollToSection(i: number) {
    sectionEls.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveSection(i)
  }

  /* ── Dimension helpers ── */
  function addDim(label = '') {
    setDims(prev => [...prev, { id: uid(), label, value: '', unit: 'mm' }])
    if (fieldErrors.dimensions) setFieldErrors(p => ({ ...p, dimensions: '' }))
  }
  function updateDim(id: string, field: keyof Omit<Dim, 'id'>, val: string) {
    setDims(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d))
    if (fieldErrors.dimensions) setFieldErrors(p => ({ ...p, dimensions: '' }))
  }
  function removeDim(id: string) { setDims(prev => prev.length > 1 ? prev.filter(d => d.id !== id) : prev) }

  /* ── Image upload ── */
  const uploadImage = useCallback(async (file: File) => {
    if (images.length >= 5) return
    setUploadingImg(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/custom-design/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) { setImages(prev => [...prev, { url: data.url, name: data.name }]); setFieldErrors(p => ({ ...p, images: '' })) }
    } catch {}
    setUploadingImg(false)
  }, [images.length])

  function handleFiles(files: FileList | null) {
    if (!files) return
    Array.from(files).slice(0, 5 - images.length).forEach(uploadImage)
  }
  function removeImage(idx: number) { setImages(prev => prev.filter((_, i) => i !== idx)) }

  async function uploadTextureImage(file: File) {
    setUploadingTex(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/custom-design/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.url) setCustomTextureUrl(data.url)
    } catch {}
    setUploadingTex(false)
  }

  /* ── Submit ── */
  async function handleSubmit() {
    // Validate
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'Design name is required'
    if (!description.trim()) errs.description = 'Description is required'

    const validDims = dims.filter(d => d.label.trim() && d.value.trim())
    if (validDims.length === 0) errs.dimensions = 'Add at least one dimension with a label and value'

    if (colorMode === 'catalog' && !selectedColor) errs.color = 'Select a colour from the catalog'
    if (colorMode === 'custom' && !customColorName.trim()) errs.color = 'Enter a name for your custom colour'

    if (textureMode === 'catalog' && !selectedTexture) errs.texture = 'Select a texture from the catalog'
    if (textureMode === 'custom' && !customTexture.trim()) errs.texture = 'Describe the texture'

    if (!selectedFinish) errs.finish = 'Select a surface finish'
    if (!holesOption) errs.holesOption = 'Select a drainage option'

    if (images.length === 0) errs.images = 'Upload at least one reference image'
    if (!notes.trim()) errs.notes = 'Additional notes are required'

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      const sectionMap: Record<string, number> = {
        title: 0, description: 0,
        dimensions: 1,
        color: 2,
        texture: 3,
        finish: 4, holesOption: 4,
        images: 5,
        notes: 6,
      }
      const firstErrSection = Math.min(...Object.keys(errs).map(k => sectionMap[k] ?? 0))
      scrollToSection(firstErrSection)
      return
    }

    setFieldErrors({})
    setSubmitting(true)
    setError(null)

    const payload = {
      title:           title.trim(),
      description:     description.trim() || null,
      quantity,
      colorId:         colorMode === 'catalog' ? (selectedColor || null) : null,
      textureId:       textureMode === 'catalog' ? (selectedTexture || null) : null,
      finishId:        selectedFinish || null,
      customColorHex:  colorMode === 'custom' ? customColorHex : null,
      customColorName: colorMode === 'custom' ? customColorName : null,
      customColorRal:  colorMode === 'custom' ? customColorRal  : null,
      customTexture:    textureMode === 'custom' ? customTexture    : null,
      customTextureUrl: textureMode === 'custom' ? customTextureUrl : null,
      dimensions:      dims.filter(d => d.label.trim() && d.value.trim()),
      holesOption:     holesOption || null,
      notes:           notes.trim() || null,
      referenceImages: images,
      // Auto-calculated price — only set when L+W+H all present.
      customUnitPrice:   customPriceCalc?.unitPrice    ?? null,
      customSurfaceArea: customPriceCalc?.surfaceArea  ?? null,
      customPriceRate:   customPriceCalc ? CUSTOM_RATE_PER_SQM : null,
    }

    const res = await fetch('/api/custom-design', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    setSubmitting(false)
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError(data.error ? `Error: ${data.error}` : 'Failed to submit. Please try again.')
      return
    }
    router.push('/portal/custom-request?submitted=1')
    router.refresh()
  }

  /* ── Render ── */
  return (
    <div className="flex gap-8 items-start">

      {/* ── Sticky Section Nav ─────────────────────────── */}
      <aside className="hidden lg:flex flex-col gap-1 w-52 flex-shrink-0 sticky top-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-400 px-3 mb-2">Sections</p>
        {SECTIONS.map((s, i) => {
          const Icon = s.icon
          const isActive = activeSection === i
          return (
            <button
              key={s.num}
              type="button"
              onClick={() => scrollToSection(i)}
              className={[
                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all duration-150 group',
                isActive
                  ? 'bg-terracotta/10 text-terracotta'
                  : 'text-charcoal-500 hover:bg-[#F5F0EB] hover:text-charcoal-800',
              ].join(' ')}
            >
              <span className={[
                'w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 transition-colors',
                isActive ? 'bg-terracotta text-white' : 'bg-charcoal-100 text-charcoal-500 group-hover:bg-charcoal-200',
              ].join(' ')}>
                {s.num}
              </span>
              <span className={`text-xs font-medium leading-none truncate ${isActive ? 'font-semibold' : ''}`}>
                {s.title}
              </span>
            </button>
          )
        })}

        {/* Progress bar */}
        <div className="mt-4 px-3">
          <div className="h-1 bg-[#EDE7DE] rounded-full overflow-hidden">
            <div
              className="h-full bg-terracotta rounded-full transition-all duration-300"
              style={{ width: `${((activeSection + 1) / SECTIONS.length) * 100}%` }}
            />
          </div>
          <p className="text-[10px] text-charcoal-400 mt-1.5">
            Step {activeSection + 1} of {SECTIONS.length}
          </p>
        </div>
      </aside>

      {/* ── Form Sections ─────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-5">

        {/* 1 · Brief */}
        <Section id="s1" num={1} title="Design Brief" icon={FileText}
          sectionRef={el => { sectionEls.current[0] = el }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="form-label">Design Name <span className="text-terracotta">*</span></label>
              <input
                value={title}
                onChange={e => { setTitle(e.target.value); if (fieldErrors.title) setFieldErrors(p => ({ ...p, title: '' })) }}
                placeholder="e.g. Tall Tapered Outdoor Planter"
                className={[
                  'form-input transition-colors',
                  fieldErrors.title
                    ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-200'
                    : '',
                ].join(' ')}
              />
              {fieldErrors.title && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {fieldErrors.title}
                </p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="form-label">Description <span className="text-terracotta">*</span></label>
              <textarea
                value={description}
                onChange={e => { setDescription(e.target.value); if (fieldErrors.description) setFieldErrors(p => ({ ...p, description: '' })) }}
                placeholder="Describe what you're looking for — style, purpose, material inspiration, special requirements…"
                rows={4}
                className={['form-input resize-none transition-colors', fieldErrors.description ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-200' : ''].join(' ')}
              />
              {fieldErrors.description && (
                <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{fieldErrors.description}
                </p>
              )}
            </div>
            <div>
              <label className="form-label">Quantity</label>
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-lg border border-[#EDE7DE] flex items-center justify-center text-charcoal-600 hover:bg-cream transition-colors">
                  <Minus size={14} />
                </button>
                <span className="w-12 text-center font-semibold text-charcoal-900 text-base">{quantity}</span>
                <button type="button" onClick={() => setQuantity(q => q + 1)}
                  className="w-9 h-9 rounded-lg border border-[#EDE7DE] flex items-center justify-center text-charcoal-600 hover:bg-cream transition-colors">
                  <Plus size={14} />
                </button>
                <span className="text-sm text-charcoal-400">units</span>
              </div>
            </div>
          </div>
        </Section>

        {/* 2 · Dimensions */}
        <Section id="s2" num={2} title="Dimensions & Specifications" icon={Ruler}
          sectionRef={el => { sectionEls.current[1] = el }}
        >
          <div className="space-y-3">
            {dims.map(d => (
              <div key={d.id} className="flex items-center gap-2">
                <LabelSelect value={d.label} onChange={v => updateDim(d.id, 'label', v)} />
                <input type="number" value={d.value} onChange={e => updateDim(d.id, 'value', e.target.value)}
                  placeholder="0" className="form-input text-sm w-28 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                <UnitSelect value={d.unit} onChange={v => updateDim(d.id, 'unit', v)} />
                <button type="button" onClick={() => removeDim(d.id)} className="p-1.5 text-charcoal-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <X size={14} />
                </button>
              </div>
            ))}
            {fieldErrors.dimensions && (
              <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{fieldErrors.dimensions}
              </p>
            )}

            {/* Auto-calculated price (only when Length, Width, Height all present) */}
            {customPriceCalc && (
              <div className="rounded-xl border border-terracotta/30 bg-terracotta/5 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-terracotta">
                      Calculated Price
                    </p>
                    <p className="text-[11px] text-charcoal-500 mt-1 leading-snug">
                      Surface area{' '}
                      <span className="font-mono font-semibold text-charcoal-800">
                        {customPriceCalc.surfaceArea.toFixed(3)} m²
                      </span>
                      {' '}× AED {CUSTOM_RATE_PER_SQM}/m²
                    </p>
                    <p className="text-[10px] text-charcoal-400 mt-0.5 leading-snug">
                      {customPriceCalc.L.raw.value}{customPriceCalc.L.raw.unit} ×{' '}
                      {customPriceCalc.W.raw.value}{customPriceCalc.W.raw.unit} ×{' '}
                      {customPriceCalc.H.raw.value}{customPriceCalc.H.raw.unit}{' '}
                      (L × W × H)
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[10px] font-semibold text-charcoal-400 uppercase tracking-wider">AED</p>
                    <p className="font-heading text-2xl font-bold text-terracotta leading-none">
                      {customPriceCalc.unitPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                    <p className="text-[10px] text-charcoal-400 mt-0.5">per unit</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              {LABELS.filter(l => !dims.some(d => d.label === l)).map(l => (
                <button key={l} type="button" onClick={() => addDim(l)}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-full border border-[#EDE7DE] text-charcoal-500 hover:border-terracotta hover:text-terracotta transition-colors">
                  + {l}
                </button>
              ))}
              <button type="button" onClick={() => addDim()}
                className="px-2.5 py-1 text-[11px] font-semibold rounded-full border border-dashed border-charcoal-300 text-charcoal-400 hover:border-terracotta hover:text-terracotta transition-colors">
                + Custom
              </button>
            </div>
          </div>
        </Section>

        {/* 3 · Color */}
        <Section id="s3" num={3} title="Colour Preference" icon={Palette}
          sectionRef={el => { sectionEls.current[2] = el }}
        >
          <div className="flex gap-1 p-1 bg-[#F5F0EB] rounded-xl w-fit mb-5">
            {(['catalog', 'custom'] as const).map(m => (
              <button key={m} type="button" onClick={() => setColorMode(m)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  colorMode === m ? 'bg-white shadow-sm text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-700'
                }`}
              >{m === 'catalog' ? 'From Catalog' : 'Custom Color'}</button>
            ))}
          </div>

          {colorMode === 'catalog' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {colors.map(c => (
                <button key={c.id} type="button" onClick={() => { setSelectedColor(selectedColor === c.id ? '' : c.id); if (fieldErrors.color) setFieldErrors(p => ({ ...p, color: '' })) }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    selectedColor === c.id ? 'border-terracotta bg-terracotta/5' : 'border-[#EDE7DE] hover:border-[#D4C4B0]'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full flex-shrink-0 border border-black/10" style={{ background: c.hexCode ?? '#ccc' }} />
                  <span className="text-xs font-medium text-charcoal-700 truncate">{c.name}</span>
                  {selectedColor === c.id && <CheckCircle2 className="w-3.5 h-3.5 text-terracotta flex-shrink-0 ml-auto" />}
                </button>
              ))}
            </div>
          ) : (
            <CustomColorPicker hex={customColorHex} name={customColorName} ral={customColorRal}
              onHex={v => { setCustomColorHex(v); if (fieldErrors.color) setFieldErrors(p => ({ ...p, color: '' })) }}
              onName={v => { setCustomColorName(v); if (fieldErrors.color) setFieldErrors(p => ({ ...p, color: '' })) }}
              onRal={setCustomColorRal} />
          )}
          {fieldErrors.color && (
            <p className="flex items-center gap-1.5 mt-3 text-xs text-red-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{fieldErrors.color}
            </p>
          )}
        </Section>

        {/* 4 · Texture */}
        <Section id="s4" num={4} title="Texture Preference" icon={Layers}
          sectionRef={el => { sectionEls.current[3] = el }}
        >
          <div className="flex gap-1 p-1 bg-[#F5F0EB] rounded-xl w-fit mb-5">
            {(['catalog', 'custom'] as const).map(m => (
              <button key={m} type="button" onClick={() => setTextureMode(m)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  textureMode === m ? 'bg-white shadow-sm text-charcoal-900' : 'text-charcoal-500 hover:text-charcoal-700'
                }`}
              >{m === 'catalog' ? 'From Catalog' : 'Describe Custom'}</button>
            ))}
          </div>

          {textureMode === 'catalog' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {textures.map(t => (
                <button key={t.id} type="button" onClick={() => { setSelectedTexture(selectedTexture === t.id ? '' : t.id); if (fieldErrors.texture) setFieldErrors(p => ({ ...p, texture: '' })) }}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                    selectedTexture === t.id ? 'border-terracotta bg-terracotta/5' : 'border-[#EDE7DE] hover:border-[#D4C4B0]'
                  }`}
                >
                  {t.imageUrl ? (
                    <div className="w-6 h-6 rounded border border-black/10 flex-shrink-0 overflow-hidden">
                      <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded border border-[#EDE7DE] bg-cream flex-shrink-0" />
                  )}
                  <span className="text-xs font-medium text-charcoal-700 truncate">{t.name}</span>
                  {selectedTexture === t.id && <CheckCircle2 className="w-3.5 h-3.5 text-terracotta flex-shrink-0 ml-auto" />}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <textarea value={customTexture} onChange={e => { setCustomTexture(e.target.value); if (fieldErrors.texture) setFieldErrors(p => ({ ...p, texture: '' })) }}
                placeholder="Describe the texture — rough stone, smooth matte, ribbed, pebbled, hammered…"
                rows={3} className={['form-input resize-none text-sm transition-colors', fieldErrors.texture ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-200' : ''].join(' ')} />
              <div>
                <p className="text-xs font-semibold text-charcoal-500 mb-2">Reference Image <span className="font-normal text-charcoal-400">(optional)</span></p>
                {customTextureUrl ? (
                  <div className="relative w-full aspect-video max-h-48 rounded-xl overflow-hidden border border-[#EDE7DE] group">
                    <img src={customTextureUrl} alt="Texture reference" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button type="button" onClick={() => textureInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white text-charcoal-800 text-xs font-semibold rounded-lg shadow">Replace</button>
                      <button type="button" onClick={() => setCustomTextureUrl(null)}
                        className="px-3 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg shadow">Remove</button>
                    </div>
                  </div>
                ) : (
                  <div onClick={() => textureInputRef.current?.click()}
                    className="border-2 border-dashed border-[#D4C4B0] rounded-xl p-6 flex items-center gap-4 cursor-pointer hover:border-terracotta hover:bg-terracotta/3 transition-all group">
                    {uploadingTex
                      ? <Loader2 className="w-7 h-7 text-terracotta animate-spin flex-shrink-0" />
                      : <Upload className="w-7 h-7 text-charcoal-300 group-hover:text-terracotta transition-colors flex-shrink-0" />}
                    <div>
                      <p className="text-sm font-semibold text-charcoal-700">{uploadingTex ? 'Uploading…' : 'Upload texture reference'}</p>
                      <p className="text-xs text-charcoal-400 mt-0.5">PNG, JPG, WEBP — photo, swatch, or material sample</p>
                    </div>
                  </div>
                )}
                <input ref={textureInputRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadTextureImage(f) }} />
              </div>
            </div>
          )}
          {fieldErrors.texture && (
            <p className="flex items-center gap-1.5 mt-3 text-xs text-red-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{fieldErrors.texture}
            </p>
          )}
        </Section>

        {/* 5 · Finish & Drainage */}
        <Section id="s5" num={5} title="Finish & Drainage" icon={Droplets}
          sectionRef={el => { sectionEls.current[4] = el }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Surface finish */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-charcoal-400 mb-3">Surface Finish <span className="text-terracotta normal-case tracking-normal font-normal">*</span></p>
              <div className="grid grid-cols-1 gap-2">
                {finishes.map(f => (
                  <button key={f.id} type="button" onClick={() => { setSelectedFinish(selectedFinish === f.id ? '' : f.id); if (fieldErrors.finish) setFieldErrors(p => ({ ...p, finish: '' })) }}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      selectedFinish === f.id ? 'border-terracotta bg-terracotta/5' : 'border-[#EDE7DE] hover:border-[#D4C4B0]'
                    }`}
                  >
                    <span className="text-xs font-medium text-charcoal-700">{f.name}</span>
                    {selectedFinish === f.id && <CheckCircle2 className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />}
                  </button>
                ))}
              </div>
              {fieldErrors.finish && (
                <p className="flex items-center gap-1.5 mt-2 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{fieldErrors.finish}
                </p>
              )}
            </div>
            {/* Drainage */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-charcoal-400 mb-3">Drainage / Holes <span className="text-terracotta normal-case tracking-normal font-normal">*</span></p>
              <div className="grid grid-cols-1 gap-2">
                {HOLES.map(h => (
                  <button key={h} type="button" onClick={() => { setHolesOption(holesOption === h ? '' : h); if (fieldErrors.holesOption) setFieldErrors(p => ({ ...p, holesOption: '' })) }}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      holesOption === h ? 'border-terracotta bg-terracotta/5' : 'border-[#EDE7DE] hover:border-[#D4C4B0]'
                    }`}
                  >
                    <span className="text-xs font-medium text-charcoal-700">{h}</span>
                    {holesOption === h && <CheckCircle2 className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />}
                  </button>
                ))}
              </div>
              {fieldErrors.holesOption && (
                <p className="flex items-center gap-1.5 mt-2 text-xs text-red-600 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{fieldErrors.holesOption}
                </p>
              )}
            </div>
          </div>
        </Section>

        {/* 6 · Reference Images */}
        <Section id="s6" num={6} title="Reference Images" icon={ImageIcon}
          sectionRef={el => { sectionEls.current[5] = el }}
        >
          <p className="text-xs text-charcoal-400 mb-4">
            Upload up to 5 reference images — mood boards, sketches, inspiration photos, or similar products. <span className="text-terracotta font-medium">*</span>
          </p>
          {fieldErrors.images && (
            <p className="flex items-center gap-1.5 mb-3 text-xs text-red-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{fieldErrors.images}
            </p>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Drop zone */}
            {images.length < 5 && (
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                  dragOver ? 'border-terracotta bg-terracotta/5' : 'border-[#D4C4B0] hover:border-terracotta hover:bg-terracotta/3'
                }`}
              >
                {uploadingImg
                  ? <Loader2 className="w-8 h-8 text-terracotta animate-spin" />
                  : <Upload className="w-8 h-8 text-charcoal-300" />}
                <div className="text-center">
                  <p className="text-sm font-semibold text-charcoal-700">{uploadingImg ? 'Uploading…' : 'Drop images here or browse'}</p>
                  <p className="text-xs text-charcoal-400 mt-0.5">PNG, JPG, WEBP · Max 5 images</p>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden"
                  onChange={e => handleFiles(e.target.files)} />
              </div>
            )}

            {/* Preview grid */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2 content-start">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-[#EDE7DE] group">
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-charcoal-900/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* 7 · Notes */}
        <Section id="s7" num={7} title="Additional Notes" icon={FileText}
          sectionRef={el => { sectionEls.current[6] = el }}
        >
          <label className="form-label mb-2 block">Notes <span className="text-terracotta">*</span></label>
          <textarea
            value={notes}
            onChange={e => { setNotes(e.target.value); if (fieldErrors.notes) setFieldErrors(p => ({ ...p, notes: '' })) }}
            placeholder="Any other requirements, constraints, budget guidance, delivery timeline, or context that would help us understand your project…"
            rows={4}
            className={['form-input resize-none transition-colors', fieldErrors.notes ? 'border-red-400 bg-red-50/40 focus:border-red-500 focus:ring-red-200' : ''].join(' ')}
          />
          {fieldErrors.notes && (
            <p className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600 font-medium">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{fieldErrors.notes}
            </p>
          )}
        </Section>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2.5 bg-terracotta hover:bg-[#B85C3B] text-white font-bold py-4 rounded-2xl text-base tracking-wide transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {submitting
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Submitting…</>
            : <><Send className="w-5 h-5" /> Submit Custom Design Request</>}
        </button>

        <p className="text-center text-xs text-charcoal-400 pb-4">
          Our team will review your request and get back to you within 1–2 business days.
        </p>
      </div>
    </div>
  )
}
