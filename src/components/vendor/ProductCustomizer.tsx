'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Ruler, Plus, Minus, ShoppingBag, Paintbrush, Layers,
  Upload, X, PlusCircle, Loader2, Check, ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import type { CustomColorValue } from '@/app/(public)/product/[sku]/VendorColorPicker'
import { CustomRalColorPicker } from '@/components/shared/CustomRalColorPicker'
import { UnitSelect } from '@/components/ui/UnitSelect'

/* ── Types ─────────────────────────────────────────────────────────────────── */

interface Variant {
  id: string
  name: string
  price?: number | null
  specifications?: Array<{ name: string; value: number | null; unit?: string }>
}

interface ColorOption   { id: string; name: string; hexCode?: string }
interface TextureOption { id: string; name: string; imageUrl?: string }
interface FinishOption  { id: string; name: string }
interface DimensionOption { id: string; name: string }

interface CustomDim { id: string; label: string; value: string; unit: string }

interface ProductCustomizerProps {
  productId: string
  productName: string
  vendorId: string
  /** Variants parsed from specifications JSON (preferred — same as public page) */
  variants?:  Variant[]
  /** Fallback: linked Dimension table rows (used when no variants exist) */
  dimensions: DimensionOption[]
  colors:     ColorOption[]
  textures:   TextureOption[]
  finishes:   FinishOption[]
}

const uid  = () => Math.random().toString(36).slice(2)
const UNITS = ['mm', 'cm', 'm', 'in']
const PRESET_LABELS = ['Top Dia', 'Bottom Dia', 'Height', 'Width', 'Depth', 'Neck Dia', 'Length', 'Diameter']

/* ── Toast ─────────────────────────────────────────────────────────────────── */
function Toast({ visible }: { visible: boolean }) {
  return (
    <div className={[
      'fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] transition-all duration-300',
      visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
    ].join(' ')}>
      <span className="inline-flex items-center gap-2 bg-cream text-terracotta border border-terracotta/30 font-semibold text-sm px-5 py-2.5 rounded-full shadow-lg">
        <ShoppingBag className="w-4 h-4" />
        Added to enquiry
      </span>
    </div>
  )
}

/* ── Main component ─────────────────────────────────────────────────────────── */
export function ProductCustomizer({
  productId, productName, vendorId,
  dimensions, colors, textures, finishes, variants = [],
}: ProductCustomizerProps) {

  // Prefer variants from specifications JSON; fall back to Dimension table rows
  const useVariants = (variants ?? []).length > 0

  const router = useRouter()
  const [isLoading,    setIsLoading]    = useState(false)
  const [toastVisible, setToastVisible] = useState(false)
  const [addedCount,   setAddedCount]   = useState(0)
  const [error,        setError]        = useState<string | null>(null)

  /* ── size / variant ── */
  // variant mode (from specs JSON)
  const [selectedVariantId, setSelectedVariantId] = useState((variants ?? [])[0]?.id ?? '')
  // dimension mode (fallback — Dimension table)
  const [selectedDimId,  setSelectedDimId]  = useState(dimensions[0]?.id ?? '')
  const [isCustomSize,   setIsCustomSize]   = useState(false)
  const [customDims,     setCustomDims]     = useState<CustomDim[]>([
    { id: uid(), label: '', value: '', unit: 'cm' },
  ])

  const selectedVariant = useVariants
    ? (variants ?? []).find(v => v.id === selectedVariantId) ?? null
    : null

  /* ── colour ── */
  const [selectedColorId, setSelectedColorId] = useState(colors[0]?.id ?? '')
  const [isCustomColor,   setIsCustomColor]   = useState(false)
  const [customColor,     setCustomColor]     = useState<CustomColorValue | null>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  /* ── texture ── */
  const [selectedTexId,      setSelectedTexId]      = useState(textures[0]?.id ?? '')
  const [isCustomTexture,    setIsCustomTexture]    = useState(false)
  const [customTextureFile,  setCustomTextureFile]  = useState<File | null>(null)
  const [customTexturePreview, setCustomTexturePreview] = useState<string | null>(null)
  const [texDragOver,        setTexDragOver]        = useState(false)
  const texInputRef = useRef<HTMLInputElement>(null)

  /* ── finish ── */
  const [selectedFinishId,  setSelectedFinishId]  = useState(finishes[0]?.id ?? '')
  const [isCustomFinish,    setIsCustomFinish]    = useState(false)
  const [customFinishDesc,  setCustomFinishDesc]  = useState('')
  const finishInputRef = useRef<HTMLInputElement>(null)

  /* ── holes ── */
  const [holesOption, setHolesOption] = useState<'with_holes' | 'without_holes' | null>(null)

  /* ── quantity / notes ── */
  const [quantity, setQuantity] = useState(1)
  const [notes,    setNotes]    = useState('')

  /* revoke blob URLs on unmount */
  useEffect(() => {
    return () => {
      if (customTexturePreview?.startsWith('blob:')) URL.revokeObjectURL(customTexturePreview)
    }
  }, [customTexturePreview])

  /* ── texture file handler ── */
  function handleTextureFile(file: File) {
    if (!file.type.startsWith('image/')) return
    if (customTexturePreview?.startsWith('blob:')) URL.revokeObjectURL(customTexturePreview)
    setCustomTextureFile(file)
    setCustomTexturePreview(URL.createObjectURL(file))
  }

  /* ── custom-size pricing ─────────────────────────────────────────────────
     Open-top box surface area:
        SA = 2(L×H) + 2(W×H) + (L×W)   in m²   (Height includes +5 cm allowance)

     Rate is tiered on the surface area:
        SA ≤ 1.5 m²              → AED 300 / m²
        1.5 m² < SA ≤ 2.0 m²     → AED 350 / m²
        SA > 2.0 m²              → AED 400 / m²

     L/W/H matched case-insensitively against the dimension `label`. All
     three required; any unit (mm/cm/m/in/inches/feet) accepted. */
  function rateForArea(sa: number): number {
    if (sa > 2.0) return 400
    if (sa > 1.5) return 350
    return 300
  }

  function toMetres(value: number, unit: string): number {
    const u = unit.toLowerCase()
    if (u === 'mm') return value / 1000
    if (u === 'cm') return value / 100
    if (u === 'm')  return value
    if (u === 'in' || u === 'inch' || u === 'inches') return value * 0.0254
    if (u === 'ft' || u === 'feet') return value * 0.3048
    return value // unknown unit → treat as metres
  }

  function findDim(label: string): { value: number; unit: string } | null {
    const want = label.toLowerCase()
    const d = customDims.find(x =>
      x.label.trim().toLowerCase() === want ||
      x.label.trim().toLowerCase() === want.charAt(0) // also match single-letter L/W/H
    )
    if (!d) return null
    const n = parseFloat(d.value)
    if (!Number.isFinite(n) || n <= 0) return null
    return { value: n, unit: d.unit }
  }

  const customPriceCalc = (() => {
    if (!isCustomSize) return null
    const L = findDim('length')
    const W = findDim('width')
    const H = findDim('height')
    if (!L || !W || !H) return null
    const lM = toMetres(L.value, L.unit)
    const wM = toMetres(W.value, W.unit)
    // Fixed +5 cm (0.05 m) allowance added to Height before SA calculation.
    const hM = toMetres(H.value, H.unit) + 0.05
    if (lM <= 0 || wM <= 0 || hM <= 0) return null
    const surfaceArea = 2 * (lM * hM) + 2 * (wM * hM) + (lM * wM)
    const rate        = rateForArea(surfaceArea)
    const unitPrice   = surfaceArea * rate
    return {
      L:           { metres: lM, raw: L },
      W:           { metres: wM, raw: W },
      H:           { metres: hM, raw: H },
      surfaceArea, // m²
      rate,        // AED / m²  (300 | 350 | 400)
      unitPrice,   // AED, single unit
    }
  })()

  /* ── custom dim helpers ── */
  function addDim(label = '') {
    setCustomDims(prev => [...prev, { id: uid(), label, value: '', unit: 'cm' }])
  }
  function updateDim(id: string, field: keyof Omit<CustomDim,'id'>, val: string) {
    setCustomDims(prev => prev.map(d => d.id === id ? { ...d, [field]: val } : d))
  }
  function removeDim(id: string) {
    setCustomDims(prev => prev.length > 1 ? prev.filter(d => d.id !== id) : prev)
  }
  function addPreset(label: string) {
    const empty = customDims.find(d => !d.label.trim())
    if (empty) updateDim(empty.id, 'label', label)
    else addDim(label)
  }

  /* ── resolved labels ── */
  const resolvedColorName = isCustomColor
    ? (customColor?.name ?? 'Custom Colour')
    : colors.find(c => c.id === selectedColorId)?.name

  const resolvedTextureName = isCustomTexture
    ? (customTextureFile ? `Custom: ${customTextureFile.name}` : 'Custom Texture')
    : textures.find(t => t.id === selectedTexId)?.name

  const resolvedFinishName = isCustomFinish
    ? (customFinishDesc.trim() ? `Custom: ${customFinishDesc.trim()}` : 'Custom Finish')
    : finishes.find(f => f.id === selectedFinishId)?.name

  const showToast = useCallback(() => {
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 2000)
  }, [])

  /* ── submit ── */
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Upload custom texture first (if any)
      let customTextureUrl: string | undefined
      if (isCustomTexture && customTextureFile) {
        const fd = new window.FormData()
        fd.append('file', customTextureFile)
        const upRes = await fetch('/api/upload', { method: 'POST', body: fd })
        const upJson = await upRes.json()
        if (!upRes.ok) throw new Error(upJson.error || 'Texture upload failed')
        customTextureUrl = upJson.path
      }

      const payload: Record<string, unknown> = {
        productId,
        quantity: Math.max(1, quantity),
        notes: notes || undefined,
        // holes
        holesOption: holesOption ?? undefined,
      }

      // Size / dimension / variant
      if (isCustomSize) {
        const filled = customDims.filter(d => d.label.trim() && d.value.trim())
        payload.isCustomSize     = true
        payload.customDimensions = JSON.stringify(filled)
        // Auto-calculated price (L×W×H formula) — surface area × AED 300/m².
        // Only sent when all three dims are present and valid.
        if (customPriceCalc) {
          payload.customUnitPrice    = customPriceCalc.unitPrice
          payload.customSurfaceArea  = customPriceCalc.surfaceArea
          payload.customPriceRate    = customPriceCalc.rate
        }
      } else if (useVariants && selectedVariant) {
        payload.variantName  = selectedVariant.name
        payload.variantPrice = selectedVariant.price ?? undefined
      } else {
        payload.dimensionId = selectedDimId || undefined
      }

      // Colour
      if (isCustomColor && customColor) {
        payload.customColorHex  = customColor.hex
        payload.customColorRal  = customColor.ralCode || undefined
        payload.customColorName = customColor.name    || undefined
      } else {
        payload.colorId = selectedColorId || undefined
      }

      // Texture
      if (isCustomTexture) {
        payload.customTextureUrl = customTextureUrl || customTextureFile?.name || 'Custom texture'
      } else {
        payload.textureId = selectedTexId || undefined
      }

      // Finish
      if (isCustomFinish) {
        payload.customFinishDesc = customFinishDesc.trim() || undefined
      } else {
        payload.finishId = selectedFinishId || undefined
      }

      const res = await fetch('/api/enquiry', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })

      if (!res.ok) {
        let msg = `Server error (${res.status})`
        try { const d = await res.json(); msg = d.error || msg } catch {}
        throw new Error(msg)
      }

      showToast()
      setAddedCount(c => c + quantity)
      router.refresh() // refresh server layout so sidebar enquiry count updates
      // Reset
      setSelectedVariantId((variants ?? [])[0]?.id ?? '')
      setSelectedDimId(dimensions[0]?.id ?? '')
      setIsCustomSize(false)
      setCustomDims([{ id: uid(), label: '', value: '', unit: 'cm' }])
      setIsCustomColor(false)
      setCustomColor(null)
      setSelectedColorId(colors[0]?.id ?? '')
      setIsCustomTexture(false)
      setCustomTextureFile(null)
      setCustomTexturePreview(null)
      setSelectedTexId(textures[0]?.id ?? '')
      setIsCustomFinish(false)
      setCustomFinishDesc('')
      setSelectedFinishId(finishes[0]?.id ?? '')
      setHolesOption(null)
      setQuantity(1)
      setNotes('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  /* ─────────────────────────────── RENDER ──────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="space-y-7">
      <Toast visible={toastVisible} />

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {/* ── 1. SIZE / VARIANT ────────────────────────────────────────────────── */}
      {(useVariants || dimensions.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal-900 uppercase tracking-wide text-xs">
              Size / Variant
            </h3>
            {/* Price moved into the dimensions panel below */}
          </div>

          <div className="flex flex-wrap gap-2">
            {useVariants
              /* ── Variant chips from specifications JSON ── */
              ? (variants ?? []).map(v => {
                  const specs = (v.specifications ?? []).filter(s => s.value != null)
                  const hint = specs.slice(0, 2).map(s => `${s.value}${s.unit ?? ''}`).join(' × ')
                  const isSelected = !isCustomSize && selectedVariantId === v.id
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setSelectedVariantId(v.id); setIsCustomSize(false) }}
                      className={[
                        'px-3 py-2 rounded-lg text-xs font-semibold transition-colors border flex flex-col items-start gap-0.5',
                        isSelected
                          ? 'bg-terracotta text-white border-terracotta'
                          : 'bg-white text-charcoal-900 border-charcoal-200 hover:border-terracotta hover:text-terracotta',
                      ].join(' ')}
                    >
                      <span>{v.name}</span>
                      {hint && (
                        <span className={`text-[9px] font-medium leading-none ${isSelected ? 'text-white/65' : 'text-charcoal-400'}`}>
                          {hint}
                        </span>
                      )}
                    </button>
                  )
                })
              /* ── Dimension chips from Dimension table (fallback) ── */
              : dimensions.map(dim => (
                  <button
                    key={dim.id}
                    type="button"
                    onClick={() => { setSelectedDimId(dim.id); setIsCustomSize(false) }}
                    className={[
                      'px-3 py-2 rounded-lg text-xs font-semibold transition-colors border',
                      !isCustomSize && selectedDimId === dim.id
                        ? 'bg-terracotta text-white border-terracotta'
                        : 'bg-white text-charcoal-900 border-charcoal-200 hover:border-terracotta hover:text-terracotta',
                    ].join(' ')}
                  >
                    {dim.name}
                  </button>
                ))
            }

            {/* Custom size chip */}
            <button
              type="button"
              onClick={() => { setIsCustomSize(true); setSelectedDimId('') }}
              className={[
                'border-2 border-dashed font-semibold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5',
                isCustomSize
                  ? 'border-terracotta bg-terracotta/10 text-terracotta'
                  : 'border-terracotta/50 text-terracotta hover:bg-terracotta/5',
              ].join(' ')}
            >
              <Ruler className="w-3.5 h-3.5" />
              Custom Size
            </button>
          </div>

          {/* B: Animated inline spec panel for selected variant */}
          {useVariants && (
            <div
              className={[
                'overflow-hidden transition-all duration-300 ease-in-out',
                !isCustomSize && selectedVariant && (selectedVariant.specifications ?? []).filter(s => s.value != null).length > 0
                  ? 'max-h-40 opacity-100'
                  : 'max-h-0 opacity-0',
              ].join(' ')}
            >
              {selectedVariant && (
                <div className="rounded-xl border border-charcoal-100 bg-cream px-4 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-charcoal-400 uppercase tracking-wider mb-2">
                      {selectedVariant.name} · Dimensions
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-2">
                      {(selectedVariant.specifications ?? []).filter(s => s.value != null).map((s, i) => (
                        <div key={i} className="flex flex-col">
                          <span className="text-[9px] font-medium text-charcoal-400 uppercase tracking-wide leading-none">{s.name}</span>
                          <span className="text-sm font-bold text-charcoal-900 font-mono mt-0.5 leading-none">
                            {s.value}
                            {s.unit && <span className="text-[11px] font-normal text-charcoal-400 ml-0.5">{s.unit}</span>}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Right-side variant price */}
                  {selectedVariant.price != null && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[9px] font-bold text-charcoal-400 uppercase tracking-wider mb-1">AED</p>
                      <p className="font-heading text-xl font-bold text-terracotta leading-none">
                        {Number(selectedVariant.price).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Custom size builder */}
          {isCustomSize && (
            <div className="bg-cream border border-terracotta/20 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-terracotta uppercase tracking-wide">
                  Custom Dimensions
                </p>
                <button
                  type="button"
                  onClick={() => { setIsCustomSize(false); setSelectedVariantId((variants ?? [])[0]?.id ?? ''); setSelectedDimId(dimensions[0]?.id ?? '') }}
                  className="w-6 h-6 flex items-center justify-center rounded-md text-charcoal-400 hover:text-terracotta hover:bg-terracotta/10 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Preset quick-add */}
              <div>
                <p className="text-[10px] font-medium text-charcoal-400 uppercase tracking-wide mb-2">
                  Quick add
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_LABELS.map(label => (
                    <button
                      key={label}
                      type="button"
                      onClick={() => addPreset(label)}
                      className="px-2.5 py-1 rounded-full border border-terracotta/40 text-terracotta text-[11px] font-semibold hover:bg-terracotta/10 transition-colors"
                    >
                      + {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dimension rows */}
              <div className="space-y-2">
                {customDims.map((dim, idx) => (
                  <div key={dim.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder={idx === 0 ? 'e.g. Top Dia' : 'Label'}
                      value={dim.label}
                      onChange={e => updateDim(dim.id, 'label', e.target.value)}
                      className="flex-1 min-w-0 border border-charcoal-200 rounded-lg px-3 py-2 text-sm text-charcoal-900 bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta placeholder:text-charcoal-400"
                    />
                    <input
                      type="number"
                      min={0}
                      placeholder="Value"
                      value={dim.value}
                      onChange={e => updateDim(dim.id, 'value', e.target.value)}
                      className="w-24 border border-charcoal-200 rounded-lg px-3 py-2 text-sm text-charcoal-900 bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta placeholder:text-charcoal-400"
                    />
                    <UnitSelect
                      value={dim.unit}
                      onChange={u => updateDim(dim.id, 'unit', u)}
                      options={UNITS}
                      className="w-20 flex-shrink-0"
                    />
                    <button
                      type="button"
                      onClick={() => removeDim(dim.id)}
                      disabled={customDims.length === 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg text-charcoal-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addDim()}
                className="flex items-center gap-1.5 text-terracotta text-xs font-semibold hover:underline"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add another dimension
              </button>

              {/* ── Auto-calculated price (only when L, W and H all present) ── */}
              {customPriceCalc && (
                <div className="mt-4 rounded-xl border border-terracotta/30 bg-terracotta/5 px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-terracotta">
                        Calculated Price
                      </p>
                      <p className="text-[11px] text-charcoal-500 mt-1.5 leading-snug">
                        {customDims
                          .filter(d => d.label.trim() && parseFloat(d.value) > 0)
                          .map(d => `${d.label.trim()} ${d.value}${d.unit}`)
                          .join(' × ')}
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
            </div>
          )}
        </div>
      )}

      {/* ── 2. COLOR ─────────────────────────────────────────────────────────── */}
      {colors.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal-900 uppercase tracking-wide text-xs">Color</h3>
            <span className="text-xs text-charcoal-600">
              {isCustomColor
                ? [customColor?.name, customColor?.ralCode || ''].filter(Boolean).join(' · ')
                : colors.find(c => c.id === selectedColorId)?.name}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-[15px] gap-y-4 items-center">
            {colors.map(c => {
              const isSelected = !isCustomColor && selectedColorId === c.id
              const ringColor  = isSelected ? '#C96B4A' : '#B8BEBE'
              return (
                <div key={c.id} className="relative group/swatch">
                  <button
                    type="button"
                    onClick={() => { setSelectedColorId(c.id); setIsCustomColor(false); setCustomColor(null) }}
                    aria-label={c.name}
                    className={[
                      'w-10 h-10 rounded-xl transition-all',
                      isSelected ? 'scale-105 shadow-md' : '',
                    ].join(' ')}
                    style={{
                      backgroundColor: c.hexCode ?? '#ccc',
                      // CSS outline + outline-offset gives a TRUE transparent
                      // gap (unlike box-shadow which always paints). 1 px ring
                      // sits 3 px outside the swatch.
                      outline:       `${isSelected ? '1.5px' : '1px'} solid ${ringColor}`,
                      outlineOffset: '3px',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) e.currentTarget.style.outline = `1px solid #C96B4A`
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) e.currentTarget.style.outline = `1px solid #B8BEBE`
                    }}
                  />
                  {/* Hover label tooltip */}
                  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-7 whitespace-nowrap rounded-md bg-charcoal-900 text-white text-[10px] font-semibold px-2 py-1 opacity-0 group-hover/swatch:opacity-100 transition-opacity z-20">
                    {c.name}
                  </span>
                </div>
              )
            })}

            {/* Custom colour chip */}
            <button
              type="button"
              onClick={() => {
                setIsCustomColor(true)
                setSelectedColorId('')
                setTimeout(() => colorPickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
              }}
              className={[
                'flex items-center gap-1.5 border-2 border-dashed font-semibold text-xs px-3 h-9 rounded-xl transition-colors',
                isCustomColor
                  ? 'border-terracotta bg-terracotta/10 text-terracotta'
                  : 'border-terracotta/50 text-terracotta hover:bg-terracotta/5',
              ].join(' ')}
            >
              {customColor && isCustomColor ? (
                <>
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                    style={{ backgroundColor: customColor.hex }}
                  />
                  {customColor.ralCode || customColor.name}
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
                    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
                    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                  </svg>
                  Custom Colour
                </>
              )}
            </button>
          </div>

          {/* Inline colour picker — same Custom Colour setup as the vendor
              Custom Design Request: Classic / Effect / Metallic tabs, live
              search, family chips and the catalogue-style swatch grid. */}
          {isCustomColor && (
            <div ref={colorPickerRef} className="bg-cream border border-terracotta/20 rounded-xl p-4">
              <CustomRalColorPicker
                hex={customColor?.hex     ?? '#C96B4A'}
                name={customColor?.name    ?? ''}
                ral={customColor?.ralCode ?? ''}
                onHex={v => setCustomColor(prev => ({
                  hex:     v,
                  name:    prev?.name    ?? '',
                  ralCode: prev?.ralCode ?? '',
                }))}
                onName={v => setCustomColor(prev => ({
                  hex:     prev?.hex     ?? '#C96B4A',
                  name:    v,
                  ralCode: prev?.ralCode ?? '',
                }))}
                onRal={v => setCustomColor(prev => ({
                  hex:     prev?.hex     ?? '#C96B4A',
                  name:    prev?.name    ?? '',
                  ralCode: v,
                }))}
              />
            </div>
          )}

          {/* Confirmed colour preview */}
          {isCustomColor && customColor && (
            <div className="flex items-center gap-3 bg-cream border border-terracotta/20 rounded-xl px-4 py-2.5">
              <div className="w-8 h-8 rounded-lg border border-terracotta/20 flex-shrink-0" style={{ backgroundColor: customColor.hex }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-charcoal-900 truncate">{customColor.name}</p>
                {customColor.ralCode && <p className="text-[10px] text-charcoal-400">{customColor.ralCode}</p>}
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCustomColor(true)
                  setTimeout(() => colorPickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
                }}
                className="text-xs text-terracotta font-semibold hover:underline flex-shrink-0"
              >
                Change
              </button>
              <button
                type="button"
                onClick={() => { setIsCustomColor(false); setCustomColor(null); setSelectedColorId(colors[0]?.id ?? '') }}
                className="text-charcoal-400 hover:text-terracotta transition-colors flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 3. TEXTURE ───────────────────────────────────────────────────────── */}
      {textures.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal-900 uppercase tracking-wide text-xs">Texture</h3>
            <span className="text-xs text-charcoal-600">{resolvedTextureName}</span>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {textures.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => { setSelectedTexId(t.id); setIsCustomTexture(false) }}
                title={t.name}
                className={[
                  'w-9 h-9 rounded-xl border-2 overflow-hidden transition-all flex items-center justify-center',
                  !isCustomTexture && selectedTexId === t.id
                    ? 'border-terracotta scale-110 shadow-md'
                    : 'border-charcoal-200 hover:border-terracotta/50 hover:scale-105',
                ].join(' ')}
              >
                {t.imageUrl ? (
                  <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] font-bold text-charcoal-400 uppercase leading-tight text-center px-0.5">
                    {t.name.slice(0, 3)}
                  </span>
                )}
              </button>
            ))}

            {/* Custom texture chip */}
            <button
              type="button"
              onClick={() => { setIsCustomTexture(true); setSelectedTexId('') }}
              className={[
                'h-9 border-2 border-dashed font-semibold text-xs px-3 rounded-xl transition-colors flex items-center gap-1.5',
                isCustomTexture
                  ? 'border-terracotta bg-terracotta/10 text-terracotta'
                  : 'border-terracotta/50 text-terracotta hover:bg-terracotta/5',
              ].join(' ')}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              Custom
            </button>
          </div>

          {/* Custom texture upload */}
          {isCustomTexture && (
            <div className="space-y-2">
              <input
                ref={texInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleTextureFile(f) }}
              />
              {customTexturePreview ? (
                <div className="bg-cream border border-terracotta/20 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-terracotta/30 flex-shrink-0">
                    <img src={customTexturePreview} alt="Custom texture" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-charcoal-900 truncate">{customTextureFile?.name}</p>
                    <button type="button" onClick={() => texInputRef.current?.click()} className="text-xs text-terracotta hover:underline mt-0.5">
                      Replace image
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsCustomTexture(false); setCustomTextureFile(null); setCustomTexturePreview(null); setSelectedTexId(textures[0]?.id ?? '') }}
                    className="text-charcoal-400 hover:text-terracotta transition-colors flex-shrink-0 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => texInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setTexDragOver(true) }}
                  onDragLeave={() => setTexDragOver(false)}
                  onDrop={e => { e.preventDefault(); setTexDragOver(false); const f = e.dataTransfer.files?.[0]; if (f) handleTextureFile(f) }}
                  className={[
                    'border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
                    texDragOver ? 'border-terracotta bg-terracotta/10' : 'border-terracotta/30 bg-cream/50 hover:border-terracotta/60 hover:bg-cream',
                  ].join(' ')}
                >
                  <div className="w-9 h-9 rounded-full bg-terracotta/10 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-terracotta" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-charcoal-900">Upload texture reference</p>
                    <p className="text-[10px] text-charcoal-400 mt-0.5">Click or drag · JPG, PNG, WEBP</p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => { setIsCustomTexture(false); setCustomTextureFile(null); setCustomTexturePreview(null); setSelectedTexId(textures[0]?.id ?? '') }}
                className="text-charcoal-400 hover:text-terracotta text-xs font-semibold transition-colors"
              >
                ← Back to standard textures
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 4. FINISH ────────────────────────────────────────────────────────── */}
      {finishes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal-900 uppercase tracking-wide text-xs">Finish</h3>
            <span className="text-xs text-charcoal-600">{resolvedFinishName}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {finishes.map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => { setSelectedFinishId(f.id); setIsCustomFinish(false) }}
                className={[
                  'px-3 h-9 rounded-xl text-xs font-semibold transition-colors border',
                  !isCustomFinish && selectedFinishId === f.id
                    ? 'bg-terracotta text-white border-terracotta'
                    : 'bg-white text-charcoal-900 border-charcoal-200 hover:border-terracotta hover:text-terracotta',
                ].join(' ')}
              >
                {f.name}
              </button>
            ))}

            {/* Custom finish chip */}
            <button
              type="button"
              onClick={() => { setIsCustomFinish(true); setSelectedFinishId(''); setTimeout(() => finishInputRef.current?.focus(), 50) }}
              className={[
                'border-2 border-dashed font-semibold text-xs px-3 h-9 rounded-xl transition-colors flex items-center gap-1.5',
                isCustomFinish
                  ? 'border-terracotta bg-terracotta/10 text-terracotta'
                  : 'border-terracotta/50 text-terracotta hover:bg-terracotta/5',
              ].join(' ')}
            >
              <Layers className="w-3.5 h-3.5" />
              Custom
            </button>
          </div>

          {/* Custom finish input */}
          {isCustomFinish && (
            <div className="bg-cream border border-terracotta/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <Layers className="w-4 h-4 text-terracotta flex-shrink-0" />
              <input
                ref={finishInputRef}
                type="text"
                placeholder="Describe your custom finish (e.g. powder-coated matte black…)"
                value={customFinishDesc}
                onChange={e => setCustomFinishDesc(e.target.value)}
                className="flex-1 bg-transparent text-sm text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => { setIsCustomFinish(false); setCustomFinishDesc(''); setSelectedFinishId(finishes[0]?.id ?? '') }}
                className="text-charcoal-400 hover:text-terracotta text-xs font-semibold transition-colors flex-shrink-0"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 5. DRAINAGE HOLES ────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-charcoal-900 uppercase tracking-wide text-xs">Drainage Holes</h3>
          {holesOption && (
            <span className="text-xs text-charcoal-600">
              {holesOption === 'with_holes' ? 'With Holes' : 'Without Holes'}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {(['with_holes', 'without_holes'] as const).map(opt => (
            <button
              key={opt}
              type="button"
              onClick={() => setHolesOption(prev => prev === opt ? null : opt)}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-xs font-semibold transition-colors',
                holesOption === opt
                  ? 'border-terracotta bg-terracotta/10 text-terracotta'
                  : 'border-charcoal-200 text-charcoal-900 hover:border-terracotta/50 hover:text-terracotta',
              ].join(' ')}
            >
              {opt === 'with_holes' ? (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" opacity="0.4" />
                  <circle cx="7"  cy="8"  r="1.2" fill="currentColor" stroke="none" />
                  <circle cx="17" cy="8"  r="1.2" fill="currentColor" stroke="none" />
                  <circle cx="7"  cy="16" r="1.2" fill="currentColor" stroke="none" />
                  <circle cx="17" cy="16" r="1.2" fill="currentColor" stroke="none" />
                </svg>
              ) : (
                <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9" />
                  <line x1="8" y1="12" x2="16" y2="12" strokeWidth="2.5" />
                </svg>
              )}
              {opt === 'with_holes' ? 'With Holes' : 'Without Holes'}
            </button>
          ))}
        </div>
      </div>

      {/* ── 6. QUANTITY ──────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <h3 className="font-semibold text-charcoal-900 uppercase tracking-wide text-xs">Quantity</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-lg border border-charcoal-200 flex items-center justify-center hover:border-terracotta hover:text-terracotta transition-colors text-charcoal-900"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-bold text-charcoal-900 text-lg tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity(q => q + 1)}
            className="w-9 h-9 rounded-lg border border-charcoal-200 flex items-center justify-center hover:border-terracotta hover:text-terracotta transition-colors text-charcoal-900"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 7. NOTES ─────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <h3 className="font-semibold text-charcoal-900 uppercase tracking-wide text-xs">
          Notes <span className="normal-case font-normal text-charcoal-400">(optional)</span>
        </h3>
        <textarea
          rows={2}
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Any special requirements or notes…"
          className="w-full border border-charcoal-200 rounded-lg px-3 py-2 text-sm text-charcoal-900 bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta placeholder:text-charcoal-400 resize-none"
        />
      </div>

      {/* ── View Basket banner (appears after first add) ─────────────────────── */}
      {addedCount > 0 && (
        <div className="flex items-center justify-between bg-sage/10 border border-sage/30 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-sage" />
            <span className="text-sm font-semibold text-charcoal-900">
              {addedCount} unit{addedCount !== 1 ? 's' : ''} added to basket
            </span>
          </div>
          <Link
            href="/portal/enquiry"
            className="flex items-center gap-1 text-sm font-bold text-terracotta hover:underline"
          >
            View Basket
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* ── 8. SUBMIT ────────────────────────────────────────────────────────── */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-terracotta hover:bg-terracotta-dark text-white font-bold py-3.5 rounded-xl text-sm tracking-wide transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Adding…
          </>
        ) : (
          <>
            <ShoppingBag className="w-4 h-4" />
            Add to Enquiry
          </>
        )}
      </button>

      <p className="text-xs text-charcoal-400 text-center -mt-3">
        Items are added to your enquiry basket. Review before submitting an RFP.
      </p>
    </form>
  )
}
