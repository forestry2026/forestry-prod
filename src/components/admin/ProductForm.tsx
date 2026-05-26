'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Loader2, X, Upload, Check, ChevronDown, ImageIcon,
  Star, Zap, Package, Layers, Palette, Sparkles, Plus,
} from 'lucide-react'
import { DimensionSpecifications } from './DimensionSpecifications'
import { RalColorPicker } from '@/components/shared/RalColorPicker'
import { RAL_CATEGORIES, type RalColor, type RalCategory } from '@/lib/ralColors'

/* Color family chips — only meaningful for RAL Classic. */
const CLASSIC_GROUPS = ['Yellow', 'Orange', 'Red', 'Violet', 'Blue', 'Green', 'Grey', 'Brown', 'White/Black']

function classicFamily(code: string | null | undefined): string {
  const m = (code ?? '').match(/^RAL (\d)/)
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

function colorCategory(ralCode: string | null | undefined): RalCategory {
  if (!ralCode) return 'Classic'
  if (/-M$/.test(ralCode)) return 'Metallic'
  if (/-\d$/.test(ralCode)) return 'Effect'
  return 'Classic'
}

/* ─── Utility ─────────────────────────────────────────────────────────── */

/** Returns '#fff' or '#1a1a1a' depending on whether the hex colour is light or dark */
function getContrastColor(hex: string): string {
  const c = hex.replace('#', '')
  if (c.length !== 6) return '#fff'
  const r = parseInt(c.slice(0, 2), 16)
  const g = parseInt(c.slice(2, 4), 16)
  const b = parseInt(c.slice(4, 6), 16)
  // Perceived luminance
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.55 ? '#1a1a1a' : '#ffffff'
}

/* ─── Schema ──────────────────────────────────────────────────────────── */

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  basePrice: z.coerce.number().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  dimensionIds: z.array(z.string()).default([]),
  dimensionSpecs: z.array(z.object({
    id: z.string(),
    name: z.string(),
    specifications: z.array(z.object({
      id: z.string(),
      name: z.string(),
      value: z.union([z.number(), z.null()]).optional(),
      unit: z.string(),
    })).default([]),
    price: z.union([z.number(), z.null()]).optional(),
  })).default([]),
  colorIds: z.array(z.string()).default([]),
  textureIds: z.array(z.string()).default([]),
  finishIds: z.array(z.string()).default([]),
  categoryIds: z.array(z.string()).default([]),
})

type ProductFormData = z.infer<typeof productSchema>

interface ProductFormProps {
  initialData?: ProductFormData & {
    id?: string
    images?: Array<{ url: string; alt?: string; isPrimary: boolean; sortOrder: number }>
  }
  attributes?: {
    dimensions: Array<{ id: string; name: string }>
    colors: Array<{ id: string; name: string; hexCode?: string; ralCode?: string | null }>
    textures: Array<{ id: string; name: string; imageUrl?: string }>
    finishes: Array<{ id: string; name: string }>
    categories: Array<{ id: string; name: string }>
  }
}

/* ─── Sub-components ──────────────────────────────────────────────────── */

const inputCls = [
  'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg',
  'text-sm text-charcoal placeholder:text-charcoal/40',
  'focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta',
  'transition-all',
].join(' ')

function SectionCard({
  icon: Icon,
  title,
  badge,
  children,
}: {
  icon: React.ElementType
  title: string
  badge?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-terracotta/10 flex items-center justify-center flex-shrink-0">
            <Icon className="w-3.5 h-3.5 text-terracotta" />
          </span>
          <h2 className="text-sm font-bold text-charcoal tracking-wide">{title}</h2>
        </div>
        {badge && (
          <span className="text-xs font-medium text-charcoal/50 bg-gray-100 px-2.5 py-1 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function FieldLabel({ htmlFor, children, required }: { htmlFor?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label htmlFor={htmlFor} className="block text-xs font-semibold text-charcoal/60 uppercase tracking-wider mb-1.5">
      {children}
      {required && <span className="text-terracotta ml-1">*</span>}
    </label>
  )
}

function TogglePill({
  selected,
  onClick,
  children,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-semibold border transition-all ${
        selected
          ? 'bg-charcoal text-white border-charcoal'
          : 'bg-white text-charcoal/60 border-gray-200 hover:border-charcoal/30 hover:text-charcoal'
      }`}
    >
      {selected && <Check className="w-3 h-3 flex-shrink-0" />}
      {children}
    </button>
  )
}

/* ─── Main Component ──────────────────────────────────────────────────── */

export function ProductForm({ initialData, attributes }: ProductFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [liveColors, setLiveColors] = useState(attributes?.colors || [])
  const [liveDimensions, setLiveDimensions] = useState(attributes?.dimensions || [])
  const [liveTextures, setLiveTextures] = useState(attributes?.textures || [])
  const [liveFinishes, setLiveFinishes] = useState(attributes?.finishes || [])
  const [liveCategories, setLiveCategories] = useState(attributes?.categories || [])

  const [categoryOpen, setCategoryOpen] = useState(false)
  const [categoryQuery, setCategoryQuery] = useState('')
  const [formImages, setFormImages] = useState(initialData?.images || [])
  const [savedProductName, setSavedProductName] = useState<string | null>(null)
  const [bannerVisible, setBannerVisible] = useState(false)

  // Auto-dismiss banner after 4 s
  useEffect(() => {
    if (!savedProductName) return
    requestAnimationFrame(() => setBannerVisible(true))
    const t = setTimeout(() => {
      setBannerVisible(false)
      setTimeout(() => setSavedProductName(null), 350)
    }, 4000)
    return () => clearTimeout(t)
  }, [savedProductName])

  // Custom color inline add
  const [colorCategory_, setColorCategory_] = useState<RalCategory>('Classic')
  const [colorFamily,    setColorFamily]    = useState<string>(CLASSIC_GROUPS[0])
  const [showAddColor, setShowAddColor] = useState(false)
  const colorPanelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (showAddColor && colorPanelRef.current) {
      // Small timeout lets the panel render before measuring
      setTimeout(() => {
        colorPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 50)
    }
  }, [showAddColor])
  const [newColorName, setNewColorName] = useState('')
  const [newColorHex, setNewColorHex] = useState('#C96B4A')
  const [newColorRal, setNewColorRal] = useState('')
  const [addingColor, setAddingColor] = useState(false)
  const [addColorError, setAddColorError] = useState<string | null>(null)

  const handleAddColor = async () => {
    if (!newColorName.trim()) { setAddColorError('Color name is required'); return }
    setAddingColor(true)
    setAddColorError(null)
    try {
      const res = await fetch('/api/attributes/colors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newColorName.trim(), hexCode: newColorHex, ralCode: newColorRal || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create color')
      const created = data.data
      setLiveColors(prev => [...prev, created])
      // Auto-select the new color
      const current = watch('colorIds') || []
      setValue('colorIds', [...current, created.id], { shouldDirty: true })
      // Reset form
      setNewColorName('')
      setNewColorHex('#C96B4A')
      setNewColorRal('')
      setShowAddColor(false)
    } catch (err) {
      setAddColorError(err instanceof Error ? err.message : 'Failed to create color')
    } finally {
      setAddingColor(false)
    }
  }

  // Fetch live attributes
  useEffect(() => {
    const go = async () => {
      try {
        const [c, d, tx, fn, cat] = await Promise.all([
          fetch('/api/attributes/colors'),
          fetch('/api/attributes/dimensions'),
          fetch('/api/attributes/textures'),
          fetch('/api/attributes/finishes'),
          fetch('/api/attributes/categories'),
        ])
        if (c.ok) setLiveColors((await c.json()).data || [])
        if (d.ok) setLiveDimensions((await d.json()).data || [])
        if (tx.ok) setLiveTextures((await tx.json()).data || [])
        if (fn.ok) setLiveFinishes((await fn.json()).data || [])
        if (cat.ok) { const r = await cat.json(); setLiveCategories(Array.isArray(r) ? r : r.data || []) }
      } catch {}
    }
    go()
  }, [])

  const { register, watch, handleSubmit, formState: { errors, isDirty }, setValue } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { ...initialData, dimensionSpecs: initialData?.dimensionSpecs || [] },
  })

  const dimensionSpecs = watch('dimensionSpecs') || []
  const selectedColors = watch('colorIds') || []
  const selectedTextures = watch('textureIds') || []
  const selectedFinishes = watch('finishIds') || []
  const selectedCategories = watch('categoryIds') || []
  const productName = watch('name')

  const toggle = (field: 'colorIds' | 'textureIds' | 'finishIds', id: string, current: string[]) => {
    setValue(field, current.includes(id) ? current.filter(x => x !== id) : [...current, id], { shouldDirty: true })
  }

  const onSubmit = async (data: ProductFormData) => {
    setIsLoading(true)
    setError(null)
    try {
      const url = initialData?.id ? `/api/products/${initialData.id}` : '/api/products'
      const method = initialData?.id ? 'PATCH' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, images: formImages }),
      })
      if (!res.ok) {
        const e = await res.json()
        throw new Error(e.error || 'Failed to save product')
      }
      // Stay on page — scroll to top and show save banner
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setSavedProductName(data.name)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const imageCount = formImages.length

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

      {/* ── Save confirmation pill (fixed, floating) ── */}
      {savedProductName && (
        <div
          className="fixed top-6 left-1/2 z-[9999] pointer-events-none"
          style={{ transform: 'translateX(-50%)' }}
        >
          <div
            className="pointer-events-auto flex items-center gap-3 pl-3 pr-4 py-2.5 rounded-full transition-all duration-300"
            style={{
              backgroundColor: '#1e1a16',
              boxShadow: '0 8px 32px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.16)',
              opacity: bannerVisible ? 1 : 0,
              transform: bannerVisible ? 'translateY(0)' : 'translateY(-12px)',
            }}
          >
            {/* Terracotta check dot */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#C96B4A' }}
            >
              <Check className="w-3 h-3 text-white" strokeWidth={3.5} />
            </div>

            {/* Text */}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[13px] font-semibold text-white whitespace-nowrap">Saved</span>
              <span className="w-px h-3 bg-white/20 flex-shrink-0" />
              <span className="text-[12px] text-white/50 truncate max-w-[200px]">{savedProductName}</span>
            </div>

            {/* Dismiss */}
            <button
              type="button"
              onClick={() => { setBannerVisible(false); setTimeout(() => setSavedProductName(null), 300) }}
              aria-label="Dismiss"
              className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-white/30 hover:text-white/70 transition-colors ml-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── Sticky Action Bar ── */}
      <div className="sticky top-0 z-20 -mx-1 px-1 py-3 bg-cream/80 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between gap-4 px-4">
          <div className="min-w-0">
            <p className="text-xs text-charcoal/50 font-medium">Editing product</p>
            <p className="text-sm font-bold text-charcoal truncate">{productName || 'Untitled Product'}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {error && (
              <span className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg max-w-xs truncate">
                {error}
              </span>
            )}
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 text-sm font-semibold text-charcoal/70 hover:text-charcoal bg-white border border-gray-200 rounded-lg transition-all hover:border-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 bg-terracotta hover:bg-terracotta/90 text-white text-sm font-bold rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
              ) : (
                <>{initialData?.id ? 'Save Changes' : 'Create Product'}</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── 1. Basic Information ── */}
      <SectionCard icon={Package} title="Basic Information">
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <FieldLabel htmlFor="sku" required>SKU</FieldLabel>
              <input {...register('sku')} id="sku" className={inputCls} placeholder="e.g. POT-001" />
              {errors.sku && <p className="text-xs text-red-500 mt-1">{errors.sku.message}</p>}
            </div>
            <div>
              <FieldLabel htmlFor="name" required>Product Name</FieldLabel>
              <input {...register('name')} id="name" className={inputCls} placeholder="e.g. Classic Cylinder Pot" />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
            </div>
          </div>

          <div>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Describe the product, materials, and use cases…"
            />
          </div>

          <div>
            <FieldLabel>Status</FieldLabel>
            <div className="flex gap-3 pt-0.5">
              <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                watch('isActive') ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-200 bg-white text-charcoal/60'
              }`}>
                <input {...register('isActive')} type="checkbox" className="hidden" />
                <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                  watch('isActive') ? 'bg-emerald-500' : 'border-2 border-gray-300'
                }`}>
                  {watch('isActive') && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className="text-xs font-semibold">Active</span>
              </label>
              <label className={`flex items-center gap-2.5 px-4 py-2.5 rounded-lg border cursor-pointer transition-all select-none ${
                watch('isFeatured') ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-gray-200 bg-white text-charcoal/60'
              }`}>
                <input {...register('isFeatured')} type="checkbox" className="hidden" />
                <span className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                  watch('isFeatured') ? 'bg-amber-400' : 'border-2 border-gray-300'
                }`}>
                  {watch('isFeatured') && <Check className="w-3 h-3 text-white" />}
                </span>
                <span className="text-xs font-semibold">Featured</span>
              </label>
            </div>
          </div>

          {/* Categories */}
          <div>
            <FieldLabel>Categories</FieldLabel>

            {/* Selected pills */}
            {selectedCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {selectedCategories.map(cid => {
                  const cat = liveCategories.find(c => c.id === cid)
                  if (!cat) return null
                  return (
                    <span key={cid} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-terracotta/10 text-terracotta text-xs font-semibold rounded-full border border-terracotta/20">
                      {cat.name}
                      <button
                        type="button"
                        onClick={() => setValue('categoryIds', selectedCategories.filter(x => x !== cid), { shouldDirty: true })}
                        className="hover:bg-terracotta/20 rounded-full transition w-3.5 h-3.5 flex items-center justify-center"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  )
                })}
              </div>
            )}

            <div className="relative">
              <button
                type="button"
                onClick={() => setCategoryOpen(!categoryOpen)}
                className={`${inputCls} flex items-center justify-between`}
              >
                <span className="text-charcoal/50">Add categories…</span>
                <ChevronDown className={`w-4 h-4 text-charcoal/40 transition-transform flex-shrink-0 ${categoryOpen ? 'rotate-180' : ''}`} />
              </button>

              {categoryOpen && (
                <>
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                    <div className="p-2 border-b border-gray-100">
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search…"
                        value={categoryQuery}
                        onChange={e => setCategoryQuery(e.target.value)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-terracotta transition"
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {liveCategories
                        .filter(c => !selectedCategories.includes(c.id) && c.name.toLowerCase().includes(categoryQuery.toLowerCase()))
                        .map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              setValue('categoryIds', [...selectedCategories, cat.id], { shouldDirty: true })
                              setCategoryQuery('')
                              setCategoryOpen(false)
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-charcoal hover:bg-gray-50 transition font-medium border-b border-gray-50 last:border-b-0"
                          >
                            {cat.name}
                          </button>
                        ))}
                    </div>
                  </div>
                  <div className="fixed inset-0 z-40" onClick={() => setCategoryOpen(false)} />
                </>
              )}
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── 2. Dimensions & Specifications ── */}
      {attributes && (
        <SectionCard icon={Zap} title="Dimensions & Specifications">
          <DimensionSpecifications
            specifications={dimensionSpecs as any}
            onSpecificationsChange={specs => setValue('dimensionSpecs', specs, { shouldDirty: true })}
          />
        </SectionCard>
      )}

      {/* ── 3. Colors ── */}
      {attributes && (
        <SectionCard
          icon={Palette}
          title="Colors"
          badge={`${selectedColors.length} of ${liveColors.length} selected`}
        >
          {/* Swatch board — outline-offset ring (matches vendor + public surfaces) */}
          <div className="flex flex-wrap gap-x-[15px] gap-y-4 items-center pt-1 pb-1">
            {liveColors.map(color => {
              const on        = selectedColors.includes(color.id)
              const ringColor = on ? '#C96B4A' : '#B8BEBE'
              return (
                <div key={color.id} className="relative group/swatch">
                  <button
                    type="button"
                    onClick={() => toggle('colorIds', color.id, selectedColors)}
                    aria-label={color.name}
                    className={`w-10 h-10 rounded-xl transition-all focus:outline-none ${on ? 'scale-105 shadow-md' : ''}`}
                    style={{
                      backgroundColor: color.hexCode || '#d4c5a9',
                      outline:         `${on ? '1.5px' : '1px'} solid ${ringColor}`,
                      outlineOffset:   '3px',
                    }}
                    onMouseEnter={e => {
                      if (!on) e.currentTarget.style.outline = `1px solid #C96B4A`
                    }}
                    onMouseLeave={e => {
                      if (!on) e.currentTarget.style.outline = `1px solid #B8BEBE`
                    }}
                  />
                  <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 -bottom-7 whitespace-nowrap rounded-md bg-charcoal-900 text-white text-[10px] font-semibold px-2 py-1 opacity-0 group-hover/swatch:opacity-100 transition-opacity z-20">
                    {color.name}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Color selection — open RAL picker to add a new color to the catalogue */}
          <button
            type="button"
            onClick={() => { setShowAddColor(v => !v); setAddColorError(null) }}
            className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dashed border-[#d4c5a9] hover:border-terracotta hover:bg-terracotta/5 text-xs font-semibold text-charcoal/70 hover:text-terracotta transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {showAddColor ? 'Close color picker' : 'Add color from RAL'}
          </button>

          {/* Selected summary strip */}
          {selectedColors.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-3 mt-1 border-t border-[#e8dcc4]">
              {selectedColors.map(id => {
                const c = liveColors.find(x => x.id === id)
                if (!c) return null
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggle('colorIds', id, selectedColors)}
                    className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cream/80 border border-[#e8dcc4] text-[10px] font-medium text-charcoal/70 hover:border-terracotta hover:text-terracotta hover:bg-terracotta/5 transition-colors group"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                      style={{ backgroundColor: c.hexCode || '#d4c5a9' }}
                    />
                    {c.name}
                    <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5" />
                  </button>
                )
              })}
            </div>
          )}

          {/* RAL-only color picker — admin selects from Classic / Effect / Metallic */}
          {showAddColor && (
            <div ref={colorPanelRef} className="bg-white border border-[#E8E0D5] rounded-2xl p-4 space-y-3">
              <RalColorPicker
                value={newColorRal || null}
                onChange={(c: RalColor | null) => {
                  if (c) {
                    setNewColorRal(c.code)
                    setNewColorName(c.name)
                    setNewColorHex(c.hex)
                  } else {
                    setNewColorRal(''); setNewColorName(''); setNewColorHex('#C96B4A')
                  }
                  setAddColorError(null)
                }}
              />
              {addColorError && (
                <p className="text-xs text-rose-600 font-semibold">{addColorError}</p>
              )}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#F0EBE3]">
                <button
                  type="button"
                  onClick={() => { setShowAddColor(false); setAddColorError(null); setNewColorName(''); setNewColorHex('#C96B4A'); setNewColorRal('') }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-charcoal-600 hover:bg-cream transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddColor}
                  disabled={addingColor || !newColorRal}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-terracotta hover:bg-terracotta-dark text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {addingColor ? 'Adding…' : 'Add RAL Color'}
                </button>
              </div>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── 3. Textures ── */}
      {attributes && (
        <SectionCard
          icon={Layers}
          title="Textures"
          badge={`${selectedTextures.length} of ${liveTextures.length} selected`}
        >
          {liveTextures.length === 0 ? (
            <p className="text-xs text-charcoal/40 italic">No textures configured yet</p>
          ) : (
            <>
              {/* Compact sample tiles */}
              <div className="flex flex-wrap gap-3 pb-1">
                {liveTextures.map(t => {
                  const isSelected = selectedTextures.includes(t.id)
                  return (
                    <button
                      key={t.id}
                      type="button"
                      title={t.name}
                      aria-label={t.name}
                      onClick={() => toggle('textureIds', t.id, selectedTextures)}
                      className={`group relative flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden transition-all duration-150 focus:outline-none ${
                        isSelected
                          ? 'ring-2 ring-terracotta ring-offset-[2px] shadow-sm'
                          : 'ring-1 ring-[#e8dcc4] hover:ring-charcoal/30'
                      }`}
                    >
                      {/* Image or placeholder */}
                      {t.imageUrl ? (
                        <img
                          src={t.imageUrl}
                          alt={t.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-cream to-[#e8dcc4] flex items-center justify-center">
                          <Layers className="w-5 h-5 text-charcoal/20" />
                        </div>
                      )}

                      {/* Name overlay on hover */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent py-1 px-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                        <p className="text-[8px] font-semibold text-white truncate leading-tight">{t.name}</p>
                      </div>

                    </button>
                  )
                })}
              </div>

              {/* Selected summary strip */}
              {selectedTextures.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-3 mt-1 border-t border-[#e8dcc4]">
                  {selectedTextures.map(id => {
                    const t = liveTextures.find(x => x.id === id)
                    if (!t) return null
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => toggle('textureIds', id, selectedTextures)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cream/80 border border-[#e8dcc4] text-[10px] font-medium text-charcoal/70 hover:border-terracotta hover:text-terracotta hover:bg-terracotta/5 transition-colors group"
                      >
                        {t.imageUrl ? (
                          <img src={t.imageUrl} alt="" className="w-3 h-3 rounded-sm object-cover flex-shrink-0" />
                        ) : (
                          <span className="w-3 h-3 rounded-sm bg-[#e8dcc4] flex-shrink-0" />
                        )}
                        {t.name}
                        <X className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity -ml-0.5" />
                      </button>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </SectionCard>
      )}

      {/* ── 4. Finishes ── */}
      {attributes && (
        <SectionCard
          icon={Sparkles}
          title="Finishes"
          badge={`${selectedFinishes.length} of ${liveFinishes.length} selected`}
        >
          <div className="flex flex-wrap gap-2">
            {liveFinishes.map(f => (
              <TogglePill
                key={f.id}
                selected={selectedFinishes.includes(f.id)}
                onClick={() => toggle('finishIds', f.id, selectedFinishes)}
              >
                {f.name}
              </TogglePill>
            ))}
            {liveFinishes.length === 0 && (
              <p className="text-xs text-charcoal/40 italic">No finishes configured yet</p>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── 6. Images ── */}
      <SectionCard
        icon={ImageIcon}
        title="Product Images"
        badge={`${imageCount} / 6`}
      >
        <div className="space-y-5">
          {/* Thumbnail grid */}
          {formImages.length > 0 && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {formImages.map((image, idx) => (
                <div
                  key={idx}
                  className={`relative group aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                    image.isPrimary ? 'border-terracotta ring-2 ring-terracotta/20' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={image.url} alt={image.alt || ''} className="w-full h-full object-cover" />

                  {image.isPrimary && (
                    <div className="absolute top-1.5 left-1.5">
                      <span className="bg-terracotta text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md leading-none uppercase tracking-wider">
                        Primary
                      </span>
                    </div>
                  )}

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                    {!image.isPrimary && (
                      <button
                        type="button"
                        title="Set as primary"
                        onClick={() => setFormImages(formImages.map((img, i) => ({ ...img, isPrimary: i === idx })))}
                        className="w-7 h-7 bg-terracotta rounded-full flex items-center justify-center hover:bg-terracotta/90 transition"
                      >
                        <Star className="w-3.5 h-3.5 text-white" />
                      </button>
                    )}
                    <button
                      type="button"
                      title="Remove"
                      onClick={() => setFormImages(formImages.filter((_, i) => i !== idx))}
                      className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Alt text */}
          {formImages.length > 0 && (
            <details className="group">
              <summary className="text-xs font-semibold text-charcoal/50 cursor-pointer hover:text-charcoal transition-colors select-none list-none flex items-center gap-1.5">
                <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                Image alt text
              </summary>
              <div className="mt-3 space-y-2 pl-5">
                {formImages.map((image, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-charcoal/40 w-16 flex-shrink-0">Image {idx + 1}</span>
                    <input
                      type="text"
                      placeholder="Describe this image…"
                      value={image.alt || ''}
                      onChange={e => {
                        const imgs = [...formImages]
                        imgs[idx].alt = e.target.value
                        setFormImages(imgs)
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-terracotta transition"
                    />
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Upload zone */}
          {imageCount < 6 && (
            <label className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-terracotta hover:bg-terracotta/5 transition-all group">
              <Upload className="w-7 h-7 text-charcoal/30 group-hover:text-terracotta transition-colors" />
              <div>
                <p className="text-sm font-semibold text-charcoal/70 group-hover:text-charcoal transition-colors">
                  Click to upload
                </p>
                <p className="text-xs text-charcoal/40 mt-0.5">PNG, JPG, WebP — max 5 MB per file</p>
              </div>
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={async e => {
                  const files = Array.from(e.target.files || [])
                  const newImgs: typeof formImages = []
                  for (const file of files) {
                    if (formImages.length + newImgs.length >= 6) break
                    if (file.size > 5 * 1024 * 1024) { alert(`${file.name} exceeds 5 MB`); continue }
                    try {
                      const fd = new FormData(); fd.append('file', file)
                      const r = await fetch('/api/products/upload', { method: 'POST', body: fd })
                      if (!r.ok) throw new Error((await r.json()).error || 'Upload failed')
                      const { imageUrl } = await r.json()
                      newImgs.push({ url: imageUrl, alt: file.name.replace(/\.[^/.]+$/, ''), isPrimary: formImages.length + newImgs.length === 0, sortOrder: formImages.length + newImgs.length })
                    } catch (err) {
                      alert(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : 'Unknown error'}`)
                    }
                  }
                  if (newImgs.length) setFormImages([...formImages, ...newImgs])
                  e.target.value = ''
                }}
              />
            </label>
          )}

          {/* URL add */}
          <div>
            <p className="text-xs font-semibold text-charcoal/50 mb-2">Or add by URL</p>
            <div className="flex gap-2">
              <input
                id="imgUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                disabled={imageCount >= 6}
                onClick={() => {
                  const input = document.getElementById('imgUrl') as HTMLInputElement
                  if (!input.value || imageCount >= 6) return
                  setFormImages([...formImages, { url: input.value, alt: '', isPrimary: formImages.length === 0, sortOrder: formImages.length }])
                  input.value = ''
                }}
                className="px-4 py-2 text-sm font-semibold bg-charcoal text-white rounded-lg hover:bg-charcoal/80 transition disabled:opacity-40"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* ── Bottom save bar ── */}
      <div className="flex items-center justify-end gap-3 pt-2 pb-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-5 py-2.5 text-sm font-semibold text-charcoal/70 hover:text-charcoal bg-white border border-gray-200 rounded-lg transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-terracotta hover:bg-terracotta/90 text-white text-sm font-bold rounded-lg transition shadow-sm disabled:opacity-50"
        >
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
          {initialData?.id ? 'Save Changes' : 'Create Product'}
        </button>
      </div>
    </form>
  )
}
