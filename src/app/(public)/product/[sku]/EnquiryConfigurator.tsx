'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Ruler, Plus, Minus, ShoppingBag, Paintbrush, Layers, Upload, X, PlusCircle, Loader2, CheckCircle2, ArrowRight, FileText, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { useBasket } from '@/lib/basket/useBasket'
import type { CustomDimension } from '@/lib/basket/useBasket'
import { VendorColorPicker } from './VendorColorPicker'
import type { CustomColorValue } from './VendorColorPicker'

interface Variant {
  id: string
  name: string
  price?: number | null
  specifications: Array<{ name: string; value: number | null; unit?: string }>
}

interface Color {
  id: string
  name: string
  hexCode?: string | null
}

interface Texture {
  id: string
  name: string
  imageUrl?: string | null
}

interface Finish {
  id: string
  name: string
}

interface Props {
  productId: string
  productSku: string
  productName: string
  variants: Variant[]
  colors: Color[]
  textures: Texture[]
  finishes: Finish[]
}

const uid = () => Math.random().toString(36).slice(2)

const PRESET_LABELS = ['Top Dia', 'Bottom Dia', 'Height', 'Width', 'Depth', 'Neck Dia', 'Length', 'Diameter']
const UNITS = ['mm', 'cm', 'm', 'in']


// ── Process steps ─────────────────────────────────────────────────
const STEPS = [
  { icon: ShoppingBag, label: 'Add Products',    sub: 'Build your enquiry basket' },
  { icon: FileText,    label: 'Submit Enquiry',  sub: 'Fill in project details'   },
  { icon: Sparkles,    label: 'Receive Quote',   sub: "We'll price & confirm"     },
  { icon: CheckCircle2,label: 'Approve & Order', sub: 'Accept to begin production'},
]

interface ConfirmDrawerProps {
  visible:     boolean
  productName: string
  variantName?: string | null
  quantity:    number
  basketCount: number
  colorHex?:   string | null
  colorName?:  string | null
  onClose:     () => void
}

function ConfirmDrawer({
  visible, productName, variantName, quantity, basketCount, colorHex, colorName, onClose,
}: ConfirmDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={[
          'fixed inset-0 z-[190] bg-black/20 transition-opacity duration-300',
          visible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Drawer */}
      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-[200] transition-transform duration-400 ease-[cubic-bezier(0.32,0.72,0,1)]',
          visible ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
        style={{ maxWidth: '100vw' }}
      >
        <div className="mx-auto max-w-lg w-full px-4 pb-6">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E8DDD0]">

            {/* ── Top: confirmation ── */}
            <div className="relative px-5 pt-5 pb-4 bg-[#F9F5F0]">
              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full bg-[#2D2926]/8 text-[#2D2926]/40 hover:text-[#2D2926] hover:bg-[#2D2926]/12 transition-colors"
                aria-label="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Check + product */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C96B4A] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0 pr-8">
                  <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#C96B4A] mb-0.5">
                    Added to Enquiry
                  </p>
                  <p className="font-semibold text-[#2D2926] text-sm leading-snug truncate">{productName}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {variantName && (
                      <span className="text-[11px] text-[#2D2926]/50 font-medium">{variantName}</span>
                    )}
                    {colorHex && (
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: colorHex }} />
                        {colorName && <span className="text-[11px] text-[#2D2926]/50">{colorName}</span>}
                      </span>
                    )}
                    <span className="text-[11px] font-bold text-[#2D2926]/40">× {quantity}</span>
                  </div>
                </div>
              </div>

              {/* Basket count pill */}
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-[#2D2926] text-white px-3 py-1.5 rounded-full">
                  <ShoppingBag className="w-3 h-3" />
                  <span className="text-[11px] font-bold">{basketCount} item{basketCount !== 1 ? 's' : ''} in basket</span>
                </div>
                <span className="text-[11px] text-[#2D2926]/40">ready to submit</span>
              </div>
            </div>

            {/* ── Middle: process steps ── */}
            <div className="px-5 py-4 border-t border-[#E8DDD0]">
              <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-[#2D2926]/35 mb-3">What happens next</p>
              <div className="grid grid-cols-4 gap-1">
                {STEPS.map((step, i) => {
                  const Icon = step.icon
                  const isActive = i === 0
                  const isDone   = false
                  return (
                    <div key={i} className="flex flex-col items-center text-center relative">
                      {/* Connector line */}
                      {i < STEPS.length - 1 && (
                        <div className="absolute left-[calc(50%+10px)] right-[calc(-50%+10px)] top-[14px] h-px bg-[#E8DDD0] z-0" />
                      )}
                      {/* Icon bubble */}
                      <div className={[
                        'relative z-10 w-7 h-7 rounded-full flex items-center justify-center mb-1.5 border',
                        isActive
                          ? 'bg-[#C96B4A] border-[#C96B4A] shadow-sm shadow-[#C96B4A]/30'
                          : 'bg-white border-[#E8DDD0]',
                      ].join(' ')}>
                        <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#2D2926]/30'}`} />
                      </div>
                      <p className={`text-[10px] font-bold leading-tight ${isActive ? 'text-[#2D2926]' : 'text-[#2D2926]/35'}`}>
                        {step.label}
                      </p>
                      <p className={`text-[9px] leading-tight mt-0.5 hidden sm:block ${isActive ? 'text-[#2D2926]/50' : 'text-[#2D2926]/25'}`}>
                        {step.sub}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── Bottom: CTAs ── */}
            <div className="px-5 pb-5 pt-3 border-t border-[#E8DDD0] flex gap-2.5">
              <button
                onClick={onClose}
                className="flex-1 text-sm font-semibold text-[#2D2926]/50 hover:text-[#2D2926] py-2.5 rounded-xl border border-[#E8DDD0] hover:border-[#2D2926]/20 transition-colors"
              >
                Continue browsing
              </button>
              <Link
                href="/enquiry"
                onClick={onClose}
                className="flex-1 flex items-center justify-center gap-1.5 bg-[#C96B4A] hover:bg-[#B85C3B] text-white text-sm font-bold py-2.5 rounded-xl transition-colors shadow-sm shadow-[#C96B4A]/25"
              >
                View Basket
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}

export default function EnquiryConfigurator({
  productId,
  productSku,
  productName,
  variants,
  colors,
  textures,
  finishes,
}: Props) {
  const { data: session } = useSession()
  const { add, count } = useBasket()

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length > 0 ? variants[0].id : null
  )
  const [isCustom, setIsCustom] = useState(false)
  const [selectedColorId, setSelectedColorId] = useState<string | null>(
    colors.length > 0 ? colors[0].id : null
  )
  const [selectedTextureId, setSelectedTextureId] = useState<string | null>(
    textures.length > 0 ? textures[0].id : null
  )
  const [selectedFinishId, setSelectedFinishId] = useState<string | null>(
    finishes.length > 0 ? finishes[0].id : null
  )
  const [quantity, setQuantity] = useState(1)

  // Custom texture state
  const [isCustomTexture, setIsCustomTexture] = useState(false)
  const [customTextureFile, setCustomTextureFile] = useState<File | null>(null)
  const [customTexturePreview, setCustomTexturePreview] = useState<string | null>(null)
  const [customTextureDragOver, setCustomTextureDragOver] = useState(false)
  const customTextureInputRef = useRef<HTMLInputElement>(null)

  // Custom finish state
  const [isCustomFinish, setIsCustomFinish] = useState(false)
  const [customFinishDesc, setCustomFinishDesc] = useState('')
  const customFinishRef = useRef<HTMLInputElement>(null)

  // Custom colour state
  const [isCustomColor, setIsCustomColor] = useState(false)
  const [customColor, setCustomColor] = useState<CustomColorValue | null>(null)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  // Holes option
  const [holesOption, setHolesOption] = useState<'with_holes' | 'without_holes' | null>(null)

  // Custom size state — dynamic dimension tags
  const [customDimensions, setCustomDimensions] = useState<CustomDimension[]>([
    { id: uid(), label: '', value: '', unit: 'cm' },
  ])
  const [notes, setNotes] = useState('')

  // Session log of custom sizes added from this product page
  const [addedCustomSizes, setAddedCustomSizes] = useState<Array<{
    id: string
    dims: CustomDimension[]
    notes: string
  }>>([])

  const [drawerVisible, setDrawerVisible] = useState(false)
  const [lastAdded, setLastAdded] = useState<{
    variantName?: string | null
    colorHex?:   string | null
    colorName?:  string | null
    quantity:    number
  } | null>(null)
  const drawerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedVariant = variants.find(v => v.id === selectedVariantId) ?? null
  const selectedColor = colors.find(c => c.id === selectedColorId) ?? null
  const selectedTexture = textures.find(t => t.id === selectedTextureId) ?? null
  const selectedFinish = finishes.find(f => f.id === selectedFinishId) ?? null

  const showDrawer = useCallback((info: { variantName?: string | null; colorHex?: string | null; colorName?: string | null; quantity: number }) => {
    if (drawerTimerRef.current) clearTimeout(drawerTimerRef.current)
    setLastAdded(info)
    setDrawerVisible(true)
    // Auto-close after 8 seconds
    drawerTimerRef.current = setTimeout(() => setDrawerVisible(false), 8000)
  }, [])

  // Revoke object URL on unmount / when file changes to avoid memory leaks
  useEffect(() => {
    return () => {
      if (customTexturePreview && customTexturePreview.startsWith('blob:')) {
        URL.revokeObjectURL(customTexturePreview)
      }
    }
  }, [customTexturePreview])

  function handleTextureFile(file: File) {
    if (!file.type.startsWith('image/')) return
    // Revoke previous
    if (customTexturePreview && customTexturePreview.startsWith('blob:')) {
      URL.revokeObjectURL(customTexturePreview)
    }
    setCustomTextureFile(file)
    setCustomTexturePreview(URL.createObjectURL(file))
  }

  const resolvedColorName = isCustomColor
    ? (customColor?.name ?? 'Custom Colour')
    : selectedColor?.name

  const resolvedTextureName = isCustomTexture
    ? (customTextureFile ? `Custom: ${customTextureFile.name}` : 'Custom Texture')
    : selectedTexture?.name

  const resolvedFinishName = isCustomFinish
    ? (customFinishDesc.trim() ? `Custom: ${customFinishDesc.trim()}` : 'Custom Finish')
    : selectedFinish?.name

  function doAddToBasket() {
    add({
      productId,
      productSku,
      productName,
      variantName: selectedVariant?.name,
      variantSpecs: selectedVariant?.specifications,
      variantPrice: selectedVariant?.price ?? undefined,
      colorName: resolvedColorName,
      colorHex: isCustomColor ? undefined : (selectedColor?.hexCode ?? undefined),
      customColorHex: isCustomColor ? (customColor?.hex ?? undefined) : undefined,
      customColorRal: isCustomColor ? (customColor?.ralCode ?? undefined) : undefined,
      textureName: resolvedTextureName,
      textureImageUrl: isCustomTexture ? undefined : (selectedTexture?.imageUrl ?? undefined),
      customTextureImageUrl: isCustomTexture ? (customTexturePreview ?? undefined) : undefined,
      finishName: resolvedFinishName,
      holesOption: holesOption ?? undefined,
      colorId: isCustomColor ? undefined : (selectedColorId ?? undefined),
      textureId: isCustomTexture ? undefined : (selectedTextureId ?? undefined),
      finishId: isCustomFinish ? undefined : (selectedFinishId ?? undefined),
      dimensionId: undefined,
      unitPrice: selectedVariant?.price ?? undefined,
      isCustom: false,
      quantity,
    })
    showDrawer({
      variantName: selectedVariant?.name,
      colorHex:    isCustomColor ? (customColor?.hex ?? null) : (selectedColor?.hexCode ?? null),
      colorName:   resolvedColorName,
      quantity,
    })
  }

  function handleAddToBasket() {
    if (!session) {
      window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      return
    }
    doAddToBasket()
  }

  function doAddCustomItem() {
    const filledDims = customDimensions.filter(d => d.label.trim() && d.value.trim())
    add({
      productId,
      productSku,
      productName,
      isCustom: true,
      customDimensions: filledDims.length ? filledDims : undefined,
      holesOption: holesOption ?? undefined,
      notes: notes || undefined,
      quantity,
      colorName: resolvedColorName,
      colorHex: isCustomColor ? undefined : (selectedColor?.hexCode ?? undefined),
      customColorHex: isCustomColor ? (customColor?.hex ?? undefined) : undefined,
      customColorRal: isCustomColor ? (customColor?.ralCode ?? undefined) : undefined,
      textureName: resolvedTextureName,
      textureImageUrl: isCustomTexture ? undefined : (selectedTexture?.imageUrl ?? undefined),
      customTextureImageUrl: isCustomTexture ? (customTexturePreview ?? undefined) : undefined,
      finishName: resolvedFinishName,
      colorId: isCustomColor ? undefined : (selectedColorId ?? undefined),
      textureId: isCustomTexture ? undefined : (selectedTextureId ?? undefined),
      finishId: isCustomFinish ? undefined : (selectedFinishId ?? undefined),
    })
    showDrawer({
      variantName: null,
      colorHex:    isCustomColor ? (customColor?.hex ?? null) : (selectedColor?.hexCode ?? null),
      colorName:   resolvedColorName,
      quantity,
    })
  }

  // Dimension helpers
  function addDimension(label = '') {
    setCustomDimensions(prev => [...prev, { id: uid(), label, value: '', unit: 'cm' }])
  }

  function updateDimension(id: string, field: keyof Omit<CustomDimension, 'id'>, value: string) {
    setCustomDimensions(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d))
  }

  function removeDimension(id: string) {
    setCustomDimensions(prev => prev.length > 1 ? prev.filter(d => d.id !== id) : prev)
  }

  function addPreset(label: string) {
    // If there's an empty row, fill it; otherwise add new
    const emptyRow = customDimensions.find(d => !d.label.trim())
    if (emptyRow) {
      updateDimension(emptyRow.id, 'label', label)
    } else {
      addDimension(label)
    }
  }

  return (
    <div className="space-y-7">
      <ConfirmDrawer
        visible={drawerVisible}
        productName={productName}
        variantName={lastAdded?.variantName}
        quantity={lastAdded?.quantity ?? 1}
        basketCount={count}
        colorHex={lastAdded?.colorHex}
        colorName={lastAdded?.colorName}
        onClose={() => setDrawerVisible(false)}
      />

      {/* Section 1: Size / Variant */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#2D2926] uppercase tracking-wide text-xs">
              Size / Variant
            </h3>
            {selectedVariant?.price != null && !isCustom && (
              <span className="text-sm font-bold text-[#C96B4A]">
                AED {Number(selectedVariant.price).toLocaleString()}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {variants.map(v => {
              const specs = v.specifications.filter(s => s.value != null)
              const hint = specs.slice(0, 2).map(s => `${s.value}${s.unit ?? ''}`).join(' × ')
              const isSelected = !isCustom && selectedVariantId === v.id
              return (
                <button
                  key={v.id}
                  onClick={() => { setSelectedVariantId(v.id); setIsCustom(false) }}
                  className={[
                    'px-3 py-2 rounded-lg text-xs font-semibold transition-colors border flex flex-col items-start gap-0.5',
                    isSelected
                      ? 'bg-[#C96B4A] text-white border-[#C96B4A]'
                      : 'bg-white text-[#2D2926] border-[#D9D0C7] hover:border-[#C96B4A] hover:text-[#C96B4A]',
                  ].join(' ')}
                >
                  <span>{v.name}</span>
                  {hint && (
                    <span className={`text-[9px] font-medium leading-none ${isSelected ? 'text-white/65' : 'text-[#2D2926]/40'}`}>
                      {hint}
                    </span>
                  )}
                </button>
              )
            })}

            {/* Custom Size chip */}
            <button
              onClick={() => { setIsCustom(true); setSelectedVariantId(null) }}
              className={[
                'border-2 border-dashed font-semibold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5',
                isCustom
                  ? 'border-[#C96B4A] bg-[#C96B4A]/10 text-[#C96B4A]'
                  : 'border-[#C96B4A] text-[#C96B4A] hover:bg-[#C96B4A]/5',
              ].join(' ')}
            >
              <Ruler className="w-3.5 h-3.5" />
              Custom Size
            </button>
          </div>

          {/* B: Inline spec panel — slides open when variant selected */}
          <div
            className={[
              'overflow-hidden transition-all duration-300 ease-in-out',
              !isCustom && selectedVariant && selectedVariant.specifications.filter(s => s.value != null).length > 0
                ? 'max-h-40 opacity-100'
                : 'max-h-0 opacity-0',
            ].join(' ')}
          >
            {selectedVariant && (
              <div className="rounded-xl border border-[#E8DDD0] bg-[#FAF6F0] px-4 py-3">
                <p className="text-[9px] font-bold text-[#2D2926]/40 uppercase tracking-wider mb-2">
                  {selectedVariant.name} · Dimensions
                </p>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {selectedVariant.specifications.filter(s => s.value != null).map((s, i) => (
                    <div key={i} className="flex flex-col">
                      <span className="text-[9px] font-medium text-[#2D2926]/45 uppercase tracking-wide leading-none">{s.name}</span>
                      <span className="text-sm font-bold text-[#2D2926] font-mono mt-0.5 leading-none">
                        {s.value}
                        {s.unit && <span className="text-[11px] font-normal text-[#2D2926]/50 ml-0.5">{s.unit}</span>}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Size inline form */}
      {isCustom && (
        <div className="bg-[#F5EDE0] border border-[#C96B4A]/20 rounded-xl p-5 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-[#C96B4A] uppercase tracking-wide">Custom Dimensions</p>
            <button
              type="button"
              onClick={() => { setIsCustom(false); setSelectedVariantId(variants[0]?.id ?? null) }}
              className="w-6 h-6 flex items-center justify-center rounded-md text-[#2D2926]/30 hover:text-[#C96B4A] hover:bg-[#C96B4A]/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preset quick-add chips */}
          <div>
            <p className="text-[10px] font-medium text-[#2D2926]/50 uppercase tracking-wide mb-2">Quick add</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_LABELS.map(label => (
                <button
                  key={label}
                  type="button"
                  onClick={() => addPreset(label)}
                  className="px-2.5 py-1 rounded-full border border-[#C96B4A]/40 text-[#C96B4A] text-[11px] font-semibold hover:bg-[#C96B4A]/10 transition-colors"
                >
                  + {label}
                </button>
              ))}
            </div>
          </div>

          {/* Dimension rows */}
          <div className="space-y-2">
            {customDimensions.map((dim, idx) => (
              <div key={dim.id} className="flex items-center gap-2">
                {/* Label */}
                <input
                  type="text"
                  placeholder={idx === 0 ? 'e.g. Top Dia' : 'Label'}
                  value={dim.label}
                  onChange={e => updateDimension(dim.id, 'label', e.target.value)}
                  className="flex-1 min-w-0 border border-[#D9D0C7] rounded-lg px-3 py-2 text-sm text-[#2D2926] bg-white focus:outline-none focus:ring-2 focus:ring-[#C96B4A]/30 focus:border-[#C96B4A] placeholder:text-[#2D2926]/30"
                />
                {/* Value */}
                <input
                  type="number"
                  min={0}
                  placeholder="Value"
                  value={dim.value}
                  onChange={e => updateDimension(dim.id, 'value', e.target.value)}
                  className="w-24 border border-[#D9D0C7] rounded-lg px-3 py-2 text-sm text-[#2D2926] bg-white focus:outline-none focus:ring-2 focus:ring-[#C96B4A]/30 focus:border-[#C96B4A] placeholder:text-[#2D2926]/30"
                />
                {/* Unit */}
                <select
                  value={dim.unit}
                  onChange={e => updateDimension(dim.id, 'unit', e.target.value)}
                  className="w-16 border border-[#D9D0C7] rounded-lg px-2 py-2 text-sm text-[#2D2926] bg-white focus:outline-none focus:ring-2 focus:ring-[#C96B4A]/30 focus:border-[#C96B4A]"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                {/* Remove */}
                <button
                  type="button"
                  onClick={() => removeDimension(dim.id)}
                  disabled={customDimensions.length === 1}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-[#2D2926]/30 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-20 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {/* Add row */}
          <button
            type="button"
            onClick={() => addDimension()}
            className="flex items-center gap-1.5 text-[#C96B4A] text-xs font-semibold hover:underline"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Add another dimension
          </button>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-[#2D2926]">Notes / Additional Requirements</label>
            <textarea
              rows={2}
              placeholder="Any special requirements, finish notes, etc."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full border border-[#D9D0C7] rounded-lg px-3 py-2 text-sm text-[#2D2926] bg-white focus:outline-none focus:ring-2 focus:ring-[#C96B4A]/30 focus:border-[#C96B4A] resize-none"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              const filledDims = customDimensions.filter(d => d.label.trim() && d.value.trim())
              const doAdd = () => {
                doAddCustomItem()
                setAddedCustomSizes(prev => [...prev, { id: uid(), dims: filledDims, notes }])
                showDrawer({ variantName: null, colorHex: isCustomColor ? (customColor?.hex ?? null) : (selectedColor?.hexCode ?? null), colorName: resolvedColorName, quantity })
                setIsCustom(false)
                setSelectedVariantId(variants[0]?.id ?? null)
                setCustomDimensions([{ id: uid(), label: '', value: '', unit: 'cm' }])
                setNotes('')
              }
              if (!session) {
                window.location.href = `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
                return
              }
              doAdd()
            }}
            className="w-full bg-[#C96B4A] hover:bg-[#B85C3B] text-white font-bold py-2.5 rounded-xl text-sm tracking-wide transition-colors flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            Add Custom Size
          </button>
        </div>
      )}

      {/* Added custom sizes log */}
      {addedCustomSizes.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold text-[#2D2926]/50 uppercase tracking-wide">
            Added to basket ({addedCustomSizes.length})
          </p>
          {addedCustomSizes.map((entry, i) => (
            <div key={entry.id} className="flex items-start gap-3 bg-white border border-[#D9D0C7] rounded-xl px-4 py-3">
              <div className="w-5 h-5 rounded-full bg-[#C96B4A]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-[10px] font-bold text-[#C96B4A]">{i + 1}</span>
              </div>
              <div className="flex-1 min-w-0">
                {entry.dims.length > 0 ? (
                  <div className="flex flex-wrap gap-x-3 gap-y-1">
                    {entry.dims.map(d => (
                      <span key={d.id} className="text-xs text-[#2D2926]">
                        <span className="font-semibold">{d.label}:</span> {d.value} {d.unit}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-[#2D2926]/50 italic">No dimensions specified</span>
                )}
                {entry.notes && (
                  <p className="text-[11px] text-[#2D2926]/50 mt-0.5 truncate">{entry.notes}</p>
                )}
              </div>
              <span className="text-[10px] font-semibold text-[#C96B4A] bg-[#C96B4A]/10 px-2 py-0.5 rounded-full flex-shrink-0">
                ✓ Added
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Section 2: Colors */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#2D2926] uppercase tracking-wide text-xs">Color</h3>
          <span className="text-xs text-[#6B6B6B]">
            {isCustomColor
              ? [customColor?.name, customColor?.ralCode].filter(Boolean).join(' · ')
              : selectedColor?.name}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-[18px] gap-y-4 items-center">
          {colors.map(c => {
            const isSelected = !isCustomColor && selectedColorId === c.id
            const ringColor  = isSelected ? '#C96B4A' : '#B8BEBE'
            return (
              <div key={c.id} className="relative group/swatch">
                <button
                  onClick={() => { setSelectedColorId(c.id); setIsCustomColor(false); setCustomColor(null) }}
                  aria-label={c.name}
                  className={[
                    'w-10 h-10 rounded-xl transition-all',
                    isSelected ? 'scale-105 shadow-md' : '',
                  ].join(' ')}
                  style={{
                    backgroundColor: c.hexCode ?? '#ccc',
                    // outline + outline-offset → 1 px ring with a TRUE
                    // transparent gap (page bg shows through). box-shadow
                    // paints; outline does not.
                    outline:       `1px solid ${ringColor}`,
                    outlineOffset: '3px',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected) e.currentTarget.style.outline = `1px solid #C96B4A`
                  }}
                  onMouseLeave={e => {
                    if (!isSelected) e.currentTarget.style.outline = `1px solid #B8BEBE`
                  }}
                />
                <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-7 whitespace-nowrap rounded-md bg-charcoal-900 text-white text-[10px] font-semibold px-2 py-1 opacity-0 group-hover/swatch:opacity-100 transition-opacity z-20">
                  {c.name}
                </span>
              </div>
            )
          })}

          {/* Custom colour chip */}
          <button
            onClick={() => {
              setIsCustomColor(true)
              setSelectedColorId(null)
              setTimeout(() => colorPickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
            }}
            className={[
              'flex items-center gap-1.5 border-2 border-dashed font-semibold text-xs px-3 h-9 rounded-xl transition-colors',
              isCustomColor
                ? 'border-[#C96B4A] bg-[#C96B4A]/10 text-[#C96B4A]'
                : 'border-[#C96B4A]/50 text-[#C96B4A] hover:bg-[#C96B4A]/5',
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
                  <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" /><circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
                  <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" /><circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
                  <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>
                </svg>
                Custom Colour
              </>
            )}
          </button>
        </div>

        {/* Inline colour picker */}
        {isCustomColor && (
          <div ref={colorPickerRef}>
          <VendorColorPicker
            onConfirm={color => { setCustomColor(color); setIsCustomColor(true) }}
            onCancel={() => { setIsCustomColor(false); setCustomColor(null); setSelectedColorId(colors[0]?.id ?? null) }}
          />
          </div>
        )}

        {/* Confirmed custom colour preview (picker closed) */}
        {isCustomColor && customColor && (
          <div className="flex items-center gap-3 bg-[#F5EDE0] border border-[#C96B4A]/20 rounded-xl px-4 py-2.5">
            <div className="w-8 h-8 rounded-lg border border-[#C96B4A]/20 flex-shrink-0" style={{ backgroundColor: customColor.hex }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#2D2926] truncate">{customColor.name}</p>
              {customColor.ralCode && <p className="text-[10px] text-[#2D2926]/50">RAL {customColor.ralCode}</p>}
            </div>
            <button
              onClick={() => {
                setIsCustomColor(true)
                setTimeout(() => colorPickerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
              }}
              className="text-xs text-[#C96B4A] font-semibold hover:underline flex-shrink-0"
            >
              Change
            </button>
            <button
              onClick={() => { setIsCustomColor(false); setCustomColor(null); setSelectedColorId(colors[0]?.id ?? null) }}
              className="text-[#2D2926]/30 hover:text-[#C96B4A] transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Section 3: Textures */}
      {textures.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#2D2926] uppercase tracking-wide text-xs">Texture</h3>
            <span className="text-xs text-[#6B6B6B]">
              {isCustomTexture ? (customTextureFile ? `Custom: ${customTextureFile.name}` : 'Custom') : selectedTexture?.name}
            </span>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {textures.map(t => (
              <button
                key={t.id}
                onClick={() => { setSelectedTextureId(t.id); setIsCustomTexture(false) }}
                title={t.name}
                className={[
                  'w-9 h-9 rounded-xl border-2 overflow-hidden transition-all flex items-center justify-center',
                  !isCustomTexture && selectedTextureId === t.id
                    ? 'border-[#C96B4A] scale-110 shadow-md'
                    : 'border-[#D9D0C7] hover:border-[#C96B4A]/50 hover:scale-105',
                ].join(' ')}
              >
                {t.imageUrl ? (
                  <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[9px] font-bold text-[#6B6B6B] uppercase leading-tight text-center px-0.5">
                    {t.name.slice(0, 3)}
                  </span>
                )}
              </button>
            ))}

            {/* Custom Texture chip */}
            <button
              onClick={() => {
                setIsCustomTexture(true)
                setSelectedTextureId(null)
              }}
              className={[
                'h-9 border-2 border-dashed font-semibold text-xs px-3 rounded-xl transition-colors flex items-center gap-1.5',
                isCustomTexture
                  ? 'border-[#C96B4A] bg-[#C96B4A]/10 text-[#C96B4A]'
                  : 'border-[#C96B4A]/50 text-[#C96B4A] hover:bg-[#C96B4A]/5',
              ].join(' ')}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              Custom
            </button>
          </div>

          {/* Custom texture image upload */}
          {isCustomTexture && (
            <div className="space-y-2">
              {/* Hidden file input */}
              <input
                ref={customTextureInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleTextureFile(file)
                }}
              />

              {customTexturePreview ? (
                /* Preview state */
                <div className="bg-[#F5EDE0] border border-[#C96B4A]/20 rounded-xl p-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#C96B4A]/30 flex-shrink-0">
                    <img src={customTexturePreview} alt="Custom texture" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-[#2D2926] truncate">{customTextureFile?.name}</p>
                    <button
                      onClick={() => customTextureInputRef.current?.click()}
                      className="text-xs text-[#C96B4A] hover:underline mt-0.5"
                    >
                      Replace image
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      setIsCustomTexture(false)
                      setCustomTextureFile(null)
                      setCustomTexturePreview(null)
                      setSelectedTextureId(textures[0]?.id ?? null)
                    }}
                    className="text-[#6B6B6B] hover:text-[#C96B4A] transition-colors flex-shrink-0 p-1"
                    title="Remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                /* Drop zone state */
                <div
                  onClick={() => customTextureInputRef.current?.click()}
                  onDragOver={e => { e.preventDefault(); setCustomTextureDragOver(true) }}
                  onDragLeave={() => setCustomTextureDragOver(false)}
                  onDrop={e => {
                    e.preventDefault()
                    setCustomTextureDragOver(false)
                    const file = e.dataTransfer.files?.[0]
                    if (file) handleTextureFile(file)
                  }}
                  className={[
                    'border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors',
                    customTextureDragOver
                      ? 'border-[#C96B4A] bg-[#C96B4A]/10'
                      : 'border-[#C96B4A]/30 bg-[#F5EDE0]/50 hover:border-[#C96B4A]/60 hover:bg-[#F5EDE0]',
                  ].join(' ')}
                >
                  <div className="w-9 h-9 rounded-full bg-[#C96B4A]/10 flex items-center justify-center">
                    <Upload className="w-4 h-4 text-[#C96B4A]" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-semibold text-[#2D2926]">Upload texture reference</p>
                    <p className="text-[10px] text-[#6B6B6B] mt-0.5">Click or drag an image here · JPG, PNG, WEBP</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  setIsCustomTexture(false)
                  setCustomTextureFile(null)
                  setCustomTexturePreview(null)
                  setSelectedTextureId(textures[0]?.id ?? null)
                }}
                className="text-[#6B6B6B] hover:text-[#C96B4A] text-xs font-semibold transition-colors"
              >
                ← Back to standard textures
              </button>
            </div>
          )}
        </div>
      )}

      {/* Section 4: Finishes */}
      {finishes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-[#2D2926] uppercase tracking-wide text-xs">Finish</h3>
            <span className="text-xs text-[#6B6B6B]">
              {isCustomFinish ? (customFinishDesc.trim() ? `Custom: ${customFinishDesc.trim()}` : 'Custom') : selectedFinish?.name}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {finishes.map(f => (
              <button
                key={f.id}
                onClick={() => { setSelectedFinishId(f.id); setIsCustomFinish(false) }}
                className={[
                  'px-3 h-9 rounded-xl text-xs font-semibold transition-colors border',
                  !isCustomFinish && selectedFinishId === f.id
                    ? 'bg-[#C96B4A] text-white border-[#C96B4A]'
                    : 'bg-white text-[#2D2926] border-[#D9D0C7] hover:border-[#C96B4A] hover:text-[#C96B4A]',
                ].join(' ')}
              >
                {f.name}
              </button>
            ))}

            {/* Custom Finish chip */}
            <button
              onClick={() => {
                setIsCustomFinish(true)
                setSelectedFinishId(null)
                setTimeout(() => customFinishRef.current?.focus(), 50)
              }}
              className={[
                'border-2 border-dashed font-semibold text-xs px-3 h-9 rounded-xl transition-colors flex items-center gap-1.5',
                isCustomFinish
                  ? 'border-[#C96B4A] bg-[#C96B4A]/10 text-[#C96B4A]'
                  : 'border-[#C96B4A]/50 text-[#C96B4A] hover:bg-[#C96B4A]/5',
              ].join(' ')}
            >
              <Layers className="w-3.5 h-3.5" />
              Custom
            </button>
          </div>

          {/* Custom finish input */}
          {isCustomFinish && (
            <div className="bg-[#F5EDE0] border border-[#C96B4A]/20 rounded-xl px-4 py-3 flex items-center gap-3">
              <Layers className="w-4 h-4 text-[#C96B4A] flex-shrink-0" />
              <input
                ref={customFinishRef}
                type="text"
                placeholder="Describe your custom finish (e.g. powder-coated matte black, brushed gold…)"
                value={customFinishDesc}
                onChange={e => setCustomFinishDesc(e.target.value)}
                className="flex-1 bg-transparent text-sm text-[#2D2926] placeholder:text-[#2D2926]/40 focus:outline-none"
              />
              <button
                onClick={() => { setIsCustomFinish(false); setCustomFinishDesc(''); setSelectedFinishId(finishes[0]?.id ?? null) }}
                className="text-[#6B6B6B] hover:text-[#C96B4A] text-xs font-semibold transition-colors flex-shrink-0"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Section 5: Holes Option */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[#2D2926] uppercase tracking-wide text-xs">Drainage Holes</h3>
          {holesOption && (
            <span className="text-xs text-[#6B6B6B]">
              {holesOption === 'with_holes' ? 'With Holes' : 'Without Holes'}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          {(['with_holes', 'without_holes'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setHolesOption(prev => prev === opt ? null : opt)}
              className={[
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-xs font-semibold transition-colors',
                holesOption === opt
                  ? 'border-[#C96B4A] bg-[#C96B4A]/10 text-[#C96B4A]'
                  : 'border-[#D9D0C7] text-[#2D2926] hover:border-[#C96B4A]/50 hover:text-[#C96B4A]',
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

      {/* Section 6: Quantity */}
      <div className="space-y-3">
        <h3 className="font-semibold text-[#2D2926] uppercase tracking-wide text-xs">Quantity</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setQuantity(q => Math.max(1, q - 1))}
            className="w-9 h-9 rounded-lg border border-[#D9D0C7] flex items-center justify-center hover:border-[#C96B4A] hover:text-[#C96B4A] transition-colors text-[#2D2926]"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-10 text-center font-bold text-[#2D2926] text-lg tabular-nums">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(q => q + 1)}
            className="w-9 h-9 rounded-lg border border-[#D9D0C7] flex items-center justify-center hover:border-[#C96B4A] hover:text-[#C96B4A] transition-colors text-[#2D2926]"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Section 7: Add to Basket */}
      {!isCustom && (
        <button
          onClick={handleAddToBasket}
          className="w-full bg-[#C96B4A] hover:bg-[#B85C3B] text-white font-bold py-3.5 rounded-xl text-sm tracking-wide transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-4 h-4" />
          Add to Enquiry Basket
        </button>
      )}
    </div>
  )
}
