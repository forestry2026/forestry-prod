'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, Trash2, Search, Building2, UserPlus,
  Package, Loader2, X, Check, ChevronDown, ChevronUp,
  Ruler, Palette, Layers, Sparkles, Settings2, Paintbrush, Upload,
} from 'lucide-react'
import { VendorColorPicker } from '@/app/(public)/product/[sku]/VendorColorPicker'
import PhoneInput   from '@/components/ui/PhoneInput'
import CountrySelect from '@/components/ui/CountrySelect'
import { COUNTRIES } from '@/lib/countries'

/* ── Types ──────────────────────────────────────────── */
interface Product {
  id:             string
  sku:            string
  name:           string
  imageUrl:       string | null
  specifications: string | null
  colors:     { id: string; name: string; hexCode: string | null }[]
  textures:   { id: string; name: string; imageUrl: string | null }[]
  finishes:   { id: string; name: string }[]
  dimensions: { id: string; name: string }[]
}

interface Variant {
  id:   string
  name: string
  price?: number | null
  specifications?: Array<{ name: string; value: number | null; unit?: string }>
}

interface CustomDim { id: string; label: string; value: string; unit: string }

interface VendorOption {
  id:          string
  companyName: string
  city:        string | null
  country:     string | null
  status:      string
  user: { id: string; name: string; email: string; phone: string | null }
}

type SpecMode = 'preset' | 'custom'

interface Item {
  uid:              string
  productId:        string | null
  productName:      string
  productSku:       string | null
  isCustom:         boolean

  // Size
  selectedVariantId: string | null
  dimensionId:       string | null
  isCustomSize:      boolean
  customDims:        CustomDim[]

  // Colour
  colorMode:        SpecMode
  colorId:          string | null
  customColorName:  string | null
  customColorHex:   string | null
  customColorRal:   string | null

  // Texture
  textureId:         string | null
  isCustomTexture:   boolean
  customTextureUrl:  string | null
  customTextureName: string | null

  // Finish
  finishMode:       SpecMode
  finishId:         string | null
  customFinishDesc: string | null

  // Custom item image
  customImageUrl:   string | null

  // Other
  holesOption:      'with_holes' | 'without_holes' | null
  quantity:         number
  unitPrice:        number | null
  notes:            string | null

  expanded:         boolean
}

interface GlobalAttrs {
  colors:     { id: string; name: string; hexCode: string | null }[]
  textures:   { id: string; name: string; imageUrl: string | null }[]
  finishes:   { id: string; name: string }[]
  dimensions: { id: string; name: string }[]
}

interface Props {
  products:    Product[]
  globalAttrs: GlobalAttrs
}

/* ── Constants ──────────────────────────────────────── */
const DIM_UNITS        = ['mm', 'cm', 'm', 'in'] as const
const PRESET_DIM_LABELS = ['Top Dia', 'Bottom Dia', 'Height', 'Width', 'Depth', 'Neck Dia', 'Length', 'Diameter']

/* ── Helpers ────────────────────────────────────────── */
function parseVariants(specsJson: string | null): Variant[] | null {
  try {
    const parsed: any[] = JSON.parse(specsJson || '[]')
    const variants = parsed
      .filter((g: any) => g.name && Array.isArray(g.specifications))
      .map((g: any) => ({
        id:   g.id ?? g.name,
        name: g.name,
        price: g.price ?? null,
        specifications: (g.specifications as any[]).map(s => ({
          name:  s.name,
          value: s.value ?? null,
          unit:  s.unit ?? '',
        })),
      }))
    return variants.length > 0 ? variants : null
  } catch {
    return null
  }
}

function newItem(p: Product | null): Item {
  const variants    = p ? parseVariants(p.specifications) : null
  const useVariants = (variants?.length ?? 0) > 0
  return {
    uid:               crypto.randomUUID(),
    productId:         p?.id   ?? null,
    productName:       p?.name ?? 'Custom item',
    productSku:        p?.sku  ?? null,
    isCustom:          !p,
    customImageUrl:    null,
    selectedVariantId: useVariants ? variants![0].id : null,
    dimensionId:       !p ? null : (!useVariants && (p.dimensions.length ?? 0) > 0 ? p.dimensions[0].id : null),
    isCustomSize:      !p,   // custom items start directly in the dimension builder
    customDims:        [{ id: crypto.randomUUID(), label: '', value: '', unit: 'mm' }],
    colorMode:         'preset',
    colorId:          null,
    customColorName:  null,
    customColorHex:   null,
    customColorRal:   null,
    textureId:         null,
    isCustomTexture:   false,
    customTextureUrl:  null,
    customTextureName: null,
    finishMode:       'preset',
    finishId:         null,
    customFinishDesc: null,
    holesOption:      null,
    quantity:         1,
    unitPrice:        null,
    notes:            null,
    expanded:         true,
  }
}

function summarise(item: Item, product: Product): string {
  const parts: string[] = []
  if (item.isCustomSize) {
    const dimStr = item.customDims
      .filter(d => d.label && d.value)
      .map(d => `${d.label}: ${d.value}${d.unit}`)
      .join(', ')
    if (dimStr) parts.push(dimStr)
  } else if (item.selectedVariantId) {
    const variants = parseVariants(product.specifications)
    const v = variants?.find(x => x.id === item.selectedVariantId)
    if (v) parts.push(v.name)
  } else if (item.dimensionId) {
    const d = product.dimensions.find(x => x.id === item.dimensionId)
    if (d) parts.push(d.name)
  }
  if (item.colorMode === 'custom' && item.customColorName) {
    parts.push(item.customColorName)
  } else if (item.colorId) {
    const c = product.colors.find(x => x.id === item.colorId)
    if (c) parts.push(c.name)
  }
  if (item.isCustomTexture) {
    parts.push('Custom texture')
  } else if (item.textureId) {
    const t = product.textures.find(x => x.id === item.textureId)
    if (t) parts.push(t.name)
  }
  if (item.finishMode === 'custom' && item.customFinishDesc) {
    parts.push(item.customFinishDesc)
  } else if (item.finishId) {
    const f = product.finishes.find(x => x.id === item.finishId)
    if (f) parts.push(f.name)
  }
  if (item.holesOption) parts.push(item.holesOption === 'with_holes' ? 'With holes' : 'Without holes')
  return parts.join(' · ') || 'No options selected'
}

/* ── Component ──────────────────────────────────────── */
export function CreateManualRfpForm({ products, globalAttrs }: Props) {
  const router = useRouter()

  // Vendor selection
  const [vendorMode,   setVendorMode]   = useState<'existing' | 'new'>('existing')
  const [vendors,      setVendors]      = useState<VendorOption[]>([])
  const [vendorQuery,  setVendorQuery]  = useState('')
  const [debQuery,     setDebQuery]     = useState('')
  const [selectedVendor, setSelectedVendor] = useState<VendorOption | null>(null)
  const [vendorOpen,   setVendorOpen]   = useState(false)
  const [loadingVendors, setLoadingVendors] = useState(false)
  const vendorDropdownRef = useRef<HTMLDivElement>(null)

  // New vendor fields
  const [newCompany, setNewCompany] = useState('')
  const [newContact, setNewContact] = useState('')
  const [newEmail,   setNewEmail]   = useState('')
  const [newPhone,       setNewPhone]       = useState('')
  const [newCountryCode, setNewCountryCode] = useState('+971')
  const [newCity,        setNewCity]        = useState('')
  const [newCountryIso,  setNewCountryIso]  = useState('AE')

  // Project
  const [projectName,     setProjectName]     = useState('')
  const [projectLocation, setProjectLocation] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [notes,           setNotes]           = useState('')

  // Items
  const [items,         setItems]         = useState<Item[]>([])
  const [pickerOpen,    setPickerOpen]    = useState(false)
  const [productQuery,  setProductQuery]  = useState('')

  // Submit state
  const [submitting, setSubmitting] = useState(false)
  const [error,      setError]      = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Scroll-to refs for validation
  const vendorSectionRef  = useRef<HTMLDivElement>(null)
  const companyRef        = useRef<HTMLInputElement>(null)
  const contactRef        = useRef<HTMLInputElement>(null)
  const emailRef          = useRef<HTMLInputElement>(null)
  const projectNameRef    = useRef<HTMLInputElement>(null)
  const projectLocationRef= useRef<HTMLInputElement>(null)
  const deliveryAddrRef   = useRef<HTMLTextAreaElement>(null)
  const itemsSectionRef   = useRef<HTMLDivElement>(null)

  /* ── Click outside → close vendor dropdown ──────── */
  useEffect(() => {
    if (!vendorOpen) return
    function handler(e: MouseEvent) {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(e.target as Node)) {
        setVendorOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [vendorOpen])

  /* ── Vendor search ───────────────────────────────── */
  useEffect(() => {
    const t = setTimeout(() => setDebQuery(vendorQuery), 250)
    return () => clearTimeout(t)
  }, [vendorQuery])

  useEffect(() => {
    if (vendorMode !== 'existing') return
    let alive = true
    setLoadingVendors(true)
    fetch(`/api/admin/vendors?q=${encodeURIComponent(debQuery)}`)
      .then(r => r.json())
      .then(d => { if (alive && d.success) setVendors(d.data) })
      .catch(() => {})
      .finally(() => { if (alive) setLoadingVendors(false) })
    return () => { alive = false }
  }, [debQuery, vendorMode])

  /* ── Product filter ──────────────────────────────── */
  const filteredProducts = useMemo(() => {
    const q = productQuery.trim().toLowerCase()
    if (!q) return products.slice(0, 30)
    return products.filter(p =>
      p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
    ).slice(0, 30)
  }, [productQuery, products])

  /* ── Item handlers ───────────────────────────────── */
  function addCatalogItem(p: Product) {
    setItems(prev => [...prev, newItem(p)])
    setPickerOpen(false)
    setProductQuery('')
    setFieldErrors(prev => ({ ...prev, items: '' }))
  }
  function addCustomItem() {
    setItems(prev => [...prev, newItem(null)])
    setPickerOpen(false)
    setFieldErrors(prev => ({ ...prev, items: '' }))
  }
  function updateItem(uid: string, patch: Partial<Item>) {
    setItems(prev => prev.map(it => it.uid === uid ? { ...it, ...patch } : it))
  }
  function removeItem(uid: string) {
    setItems(prev => prev.filter(it => it.uid !== uid))
  }
  function toggleExpand(uid: string) {
    setItems(prev => prev.map(it => it.uid === uid ? { ...it, expanded: !it.expanded } : it))
  }

  /* ── Submit ──────────────────────────────────────── */
  async function handleSubmit() {
    setError(null)

    // Collect all field errors at once
    const errs: Record<string, string> = {}

    if (vendorMode === 'existing' && !selectedVendor) {
      errs.vendor = 'Please select a vendor'
    }
    if (vendorMode === 'new') {
      if (!newCompany.trim()) errs.company = 'Company name is required'
      if (!newContact.trim()) errs.contact = 'Contact name is required'
      if (!newEmail.trim()) {
        errs.email = 'Email is required'
      } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail.trim())) {
        errs.email = 'Enter a valid email address'
      }
    }
    if (!projectName.trim())     errs.projectName     = 'Project name is required'
    if (!projectLocation.trim()) errs.projectLocation = 'Project location is required'
    if (!deliveryAddress.trim()) errs.deliveryAddress = 'Delivery address is required'

    if (items.length === 0) {
      errs.items = 'Add at least one item'
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs)
      // Scroll to first invalid field in top-to-bottom order
      const order: [string, React.RefObject<HTMLElement | null>][] = [
        ['vendor',          vendorSectionRef],
        ['company',         companyRef        as React.RefObject<HTMLElement | null>],
        ['contact',         contactRef        as React.RefObject<HTMLElement | null>],
        ['email',           emailRef          as React.RefObject<HTMLElement | null>],
        ['projectName',     projectNameRef    as React.RefObject<HTMLElement | null>],
        ['projectLocation', projectLocationRef as React.RefObject<HTMLElement | null>],
        ['deliveryAddress', deliveryAddrRef   as React.RefObject<HTMLElement | null>],
        ['items',           itemsSectionRef],
      ]
      for (const [key, ref] of order) {
        if (errs[key] && ref.current) {
          ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
          break
        }
      }
      return
    }

    setFieldErrors({})

    const payload = {
      vendor: vendorMode === 'existing'
        ? { mode: 'existing' as const, vendorProfileId: selectedVendor!.id }
        : {
            mode:        'new' as const,
            companyName: newCompany.trim(),
            contactName: newContact.trim(),
            email:       newEmail.trim(),
            phone:       newPhone.trim() ? `${newCountryCode}${newPhone.trim()}` : null,
            city:        newCity.trim()  || null,
            country:     (COUNTRIES.find(c => c.code === newCountryIso)?.name) ?? 'United Arab Emirates',
          },
      projectName:     projectName.trim()     || null,
      projectLocation: projectLocation.trim() || null,
      deliveryAddress: deliveryAddress.trim() || null,
      notes:           notes.trim()           || null,
      items: items.map(it => {
        const prod     = it.productId ? products.find(p => p.id === it.productId) ?? null : null
        const variants = prod ? parseVariants(prod.specifications) : null
        const selVar   = !it.isCustomSize && it.selectedVariantId
          ? (variants?.find(v => v.id === it.selectedVariantId) ?? null)
          : null
        return {
        productId:        it.productId,
        productName:      it.productName.trim(),
        productSku:       it.productSku,
        isCustom:         it.isCustom,
        // Size
        variantName:      selVar?.name ?? null,
        dimensionId:      !it.isCustomSize && !selVar ? it.dimensionId : null,
        isCustomSize:     it.isCustomSize,
        customWidth:      null,
        customHeight:     null,
        customDepth:      null,
        customDimensions: it.isCustomSize
          ? JSON.stringify(it.customDims.filter(d => d.label || d.value))
          : null,
        // Colour
        colorId:          it.colorMode === 'preset' ? it.colorId : null,
        customColorName:  it.colorMode === 'custom' ? it.customColorName : null,
        customColorHex:   it.colorMode === 'custom' ? it.customColorHex  : null,
        customColorRal:   it.colorMode === 'custom' ? it.customColorRal  : null,
        // Texture
        textureId:         it.isCustomTexture ? null : it.textureId,
        customTextureUrl:  it.isCustomTexture ? it.customTextureUrl  : null,
        customTextureName: it.isCustomTexture ? it.customTextureName : null,
        // Finish
        finishId:         it.finishMode === 'preset' ? it.finishId : null,
        customFinishDesc: it.finishMode === 'custom' ? it.customFinishDesc : null,
        // Other
        holesOption:      it.holesOption,
        quantity:         it.quantity,
        unitPrice:        it.unitPrice,
        notes:            it.notes,
        }
      }),
    }

    setSubmitting(true)
    try {
      const res  = await fetch('/api/admin/rfp/manual', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create RFP')
      router.push(`/admin/rfps/${data.data.id}`)
    } catch (e: any) {
      setError(e.message)
      setSubmitting(false)
    }
  }

  /* ── UI ──────────────────────────────────────────── */
  return (
    <div className="space-y-5 max-w-5xl">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-charcoal-400">
        <Link href="/admin/rfps" className="inline-flex items-center gap-1.5 hover:text-terracotta transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          All RFPs
        </Link>
        <span className="text-charcoal-200">/</span>
        <span className="font-medium text-charcoal-700">New Manual RFP</span>
      </div>

      {/* Header */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Admin Portal</p>
        <h1 className="font-heading text-3xl font-bold text-charcoal-900 tracking-tight">Create Manual RFP</h1>
        <p className="text-sm text-charcoal-400 mt-1.5">Create an RFP on behalf of a vendor — existing or external</p>
      </div>

      {/* ── Vendor section ── */}
      <div ref={vendorSectionRef} className="bg-white rounded-2xl border border-[#EDE8E1]">
        <div className="px-6 py-4 border-b border-[#EDE8E1] bg-[#FAFAF9] rounded-t-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-400">Vendor</p>
        </div>

        <div className="px-6 pt-5">
          <div className="inline-flex rounded-xl bg-cream p-1 border border-[#EDE8E1]">
            <button
              type="button"
              onClick={() => { setVendorMode('existing'); setSelectedVendor(null) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                vendorMode === 'existing'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-700'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" /> Existing vendor
            </button>
            <button
              type="button"
              onClick={() => setVendorMode('new')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-colors ${
                vendorMode === 'new'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-700'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" /> New / external vendor
            </button>
          </div>
        </div>

        {vendorMode === 'existing' && (
          <div className="px-6 py-5">
            <div className="relative" ref={vendorDropdownRef}>
              <button
                type="button"
                onClick={() => { setVendorOpen(o => !o); if (fieldErrors.vendor) setFieldErrors(p => ({ ...p, vendor: '' })) }}
                className={`w-full flex items-center justify-between px-4 py-3 bg-white border rounded-xl text-sm text-left transition-colors ${
                  fieldErrors.vendor
                    ? 'border-rose-400 ring-2 ring-rose-100'
                    : 'border-[#EDE8E1] hover:border-charcoal-300'
                }`}
              >
                {selectedVendor ? (
                  <span className="flex items-center gap-2.5 min-w-0">
                    <span className="w-7 h-7 rounded-lg bg-terracotta/10 text-terracotta text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                      {selectedVendor.companyName.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-charcoal-900 truncate">{selectedVendor.companyName}</span>
                      <span className="block text-[11px] text-charcoal-400 truncate">{selectedVendor.user.name} · {selectedVendor.user.email}</span>
                    </span>
                  </span>
                ) : (
                  <span className="text-charcoal-400">Select a vendor…</span>
                )}
                <ChevronDown className={`w-4 h-4 text-charcoal-400 transition-transform ${vendorOpen ? 'rotate-180' : ''}`} />
              </button>

              {vendorOpen && (
                <div className="absolute z-50 mt-2 w-full bg-white rounded-xl border border-[#EDE8E1] shadow-lg overflow-hidden">
                  <div className="relative p-3 border-b border-[#EDE8E1]">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300" />
                    <input
                      type="text"
                      autoFocus
                      value={vendorQuery}
                      onChange={e => setVendorQuery(e.target.value)}
                      placeholder="Search by company, name or email"
                      className="w-full pl-9 pr-3 py-2 bg-cream/50 border border-[#EDE8E1] rounded-lg text-sm focus:outline-none focus:border-terracotta"
                    />
                  </div>
                  <div className="max-h-[320px] overflow-y-auto">
                    {loadingVendors ? (
                      <div className="py-8 text-center text-xs text-charcoal-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading…
                      </div>
                    ) : vendors.length === 0 ? (
                      <div className="py-8 text-center text-xs text-charcoal-400">No vendors found</div>
                    ) : vendors.map(v => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => { setSelectedVendor(v); setVendorOpen(false); setFieldErrors(p => ({ ...p, vendor: '' })) }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-cream/40 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-charcoal-900 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {v.companyName.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-charcoal-900 truncate">{v.companyName}</p>
                          <p className="text-[11px] text-charcoal-400 truncate">{v.user.name} · {v.user.email}</p>
                        </div>
                        {selectedVendor?.id === v.id && <Check className="w-4 h-4 text-terracotta flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {fieldErrors.vendor && (
              <p className="mt-1.5 text-xs font-medium text-rose-500">{fieldErrors.vendor}</p>
            )}
          </div>
        )}

        {vendorMode === 'new' && (
          <div className="px-6 py-5 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">Company name *</label>
              <input
                ref={companyRef}
                value={newCompany}
                onChange={e => { setNewCompany(e.target.value); if (fieldErrors.company) setFieldErrors(p => ({ ...p, company: '' })) }}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 ${fieldErrors.company ? 'border-rose-400 ring-2 ring-rose-100' : 'border-[#EDE8E1]'}`}
              />
              {fieldErrors.company && <p className="mt-1 text-xs font-medium text-rose-500">{fieldErrors.company}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">Contact name *</label>
              <input
                ref={contactRef}
                value={newContact}
                onChange={e => { setNewContact(e.target.value); if (fieldErrors.contact) setFieldErrors(p => ({ ...p, contact: '' })) }}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 ${fieldErrors.contact ? 'border-rose-400 ring-2 ring-rose-100' : 'border-[#EDE8E1]'}`}
              />
              {fieldErrors.contact && <p className="mt-1 text-xs font-medium text-rose-500">{fieldErrors.contact}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">Email *</label>
              <input
                ref={emailRef}
                type="email"
                value={newEmail}
                onChange={e => { setNewEmail(e.target.value); if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: '' })) }}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 ${fieldErrors.email ? 'border-rose-400 ring-2 ring-rose-100' : 'border-[#EDE8E1]'}`}
              />
              {fieldErrors.email && <p className="mt-1 text-xs font-medium text-rose-500">{fieldErrors.email}</p>}
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">Phone</label>
              <PhoneInput
                countryCode={newCountryCode}
                phone={newPhone}
                onCountryCodeChange={setNewCountryCode}
                onPhoneChange={setNewPhone}
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">City</label>
              <input value={newCity} onChange={e => setNewCity(e.target.value)} className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10" />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">Country</label>
              <CountrySelect
                value={newCountryIso}
                onChange={setNewCountryIso}
              />
            </div>
            <p className="col-span-2 text-[11px] text-charcoal-400 leading-relaxed">
              A vendor account will be auto-created with a temporary password. You can resend credentials later from the vendor profile.
            </p>
          </div>
        )}
      </div>

      {/* ── Project section ── */}
      <div className="bg-white rounded-2xl border border-[#EDE8E1] overflow-hidden">
        <div className="px-6 py-4 border-b border-[#EDE8E1] bg-[#FAFAF9]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-400">Project</p>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">Project name *</label>
            <input
              ref={projectNameRef}
              value={projectName}
              onChange={e => { setProjectName(e.target.value); if (fieldErrors.projectName) setFieldErrors(p => ({ ...p, projectName: '' })) }}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 ${fieldErrors.projectName ? 'border-rose-400 ring-2 ring-rose-100' : 'border-[#EDE8E1]'}`}
            />
            {fieldErrors.projectName && <p className="mt-1 text-xs font-medium text-rose-500">{fieldErrors.projectName}</p>}
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">Project location *</label>
            <input
              ref={projectLocationRef}
              value={projectLocation}
              onChange={e => { setProjectLocation(e.target.value); if (fieldErrors.projectLocation) setFieldErrors(p => ({ ...p, projectLocation: '' })) }}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 ${fieldErrors.projectLocation ? 'border-rose-400 ring-2 ring-rose-100' : 'border-[#EDE8E1]'}`}
            />
            {fieldErrors.projectLocation && <p className="mt-1 text-xs font-medium text-rose-500">{fieldErrors.projectLocation}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">Delivery address *</label>
            <textarea
              ref={deliveryAddrRef}
              value={deliveryAddress}
              onChange={e => { setDeliveryAddress(e.target.value); if (fieldErrors.deliveryAddress) setFieldErrors(p => ({ ...p, deliveryAddress: '' })) }}
              rows={2}
              className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-sm resize-none focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 ${fieldErrors.deliveryAddress ? 'border-rose-400 ring-2 ring-rose-100' : 'border-[#EDE8E1]'}`}
            />
            {fieldErrors.deliveryAddress && <p className="mt-1 text-xs font-medium text-rose-500">{fieldErrors.deliveryAddress}</p>}
          </div>
          <div className="col-span-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">Notes</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Any special instructions or context…"
              className="w-full px-3.5 py-2.5 bg-white border border-[#EDE8E1] rounded-xl text-sm resize-none focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10"
            />
          </div>
        </div>
      </div>

      {/* ── Items section ── */}
      <div ref={itemsSectionRef} className={`bg-white rounded-2xl border overflow-hidden ${fieldErrors.items ? 'border-rose-400' : 'border-[#EDE8E1]'}`}>
        <div className="px-6 py-4 border-b border-[#EDE8E1] bg-[#FAFAF9] flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-400">Items <span className="ml-1 text-charcoal-500">({items.length})</span></p>
            {fieldErrors.items && <p className="text-xs font-medium text-rose-500 mt-0.5">{fieldErrors.items}</p>}
          </div>
          <button
            type="button"
            onClick={() => { setPickerOpen(true); if (fieldErrors.items) setFieldErrors(p => ({ ...p, items: '' })) }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-charcoal-900 hover:bg-charcoal-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Item
          </button>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Package className={`w-6 h-6 mx-auto mb-2 ${fieldErrors.items ? 'text-rose-300' : 'text-charcoal-200'}`} />
            <p className="text-sm text-charcoal-400">No items yet</p>
            <p className="text-xs text-charcoal-300 mt-0.5">Click "Add Item" to pick from catalogue or add custom</p>
          </div>
        ) : (
          <div className="divide-y divide-[#EDE8E1]">
            {items.map(item => {
              const product        = item.productId ? products.find(p => p.id === item.productId) ?? null : null
              const effectiveProduct: Product = product ?? {
                id:             '',
                sku:            '',
                name:           item.productName,
                imageUrl:       null,
                specifications: null,
                colors:         globalAttrs.colors,
                textures:       globalAttrs.textures,
                finishes:       globalAttrs.finishes,
                dimensions:     globalAttrs.dimensions,
              }
              return (
                <ItemRow
                  key={item.uid}
                  item={item}
                  product={effectiveProduct}
                  summary={summarise(item, effectiveProduct)}
                  onUpdate={patch => updateItem(item.uid, patch)}
                  onRemove={() => removeItem(item.uid)}
                  onToggle={() => toggleExpand(item.uid)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* ── Submit bar ── */}
      <div className="flex items-center justify-between bg-white rounded-2xl border border-[#EDE8E1] px-6 py-4">
        <div className="text-xs text-charcoal-500">
          {error ? <span className="text-rose-500 font-medium">{error}</span>
                 : <span>RFP will be created in <strong className="text-charcoal-900">SUBMITTED</strong> state, ready for quotation.</span>}
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/rfps" className="px-4 py-2 text-sm font-semibold text-charcoal-500 hover:text-charcoal-900 transition-colors">
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="inline-flex items-center gap-2 bg-terracotta hover:bg-[#B85C3B] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            {submitting ? 'Creating…' : 'Create RFP'}
          </button>
        </div>
      </div>

      {/* ── Item picker modal ── */}
      {pickerOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setPickerOpen(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#EDE8E1]">
              <h3 className="font-heading text-base font-bold text-charcoal-900">Add Item</h3>
              <button onClick={() => setPickerOpen(false)} className="p-1.5 rounded-lg hover:bg-cream text-charcoal-400 hover:text-charcoal-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-5 py-3 border-b border-[#EDE8E1]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300" />
                <input
                  autoFocus
                  type="text"
                  value={productQuery}
                  onChange={e => setProductQuery(e.target.value)}
                  placeholder="Search catalogue by name or SKU"
                  className="w-full pl-10 pr-3 py-2.5 bg-cream/50 border border-[#EDE8E1] rounded-xl text-sm focus:outline-none focus:border-terracotta"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <button
                type="button"
                onClick={addCustomItem}
                className="w-full px-5 py-3 flex items-center gap-3 hover:bg-cream/40 border-b border-[#EDE8E1] text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4 text-terracotta" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-charcoal-900">Add Custom Item</p>
                  <p className="text-[11px] text-charcoal-400">Not in catalogue — enter free-form details</p>
                </div>
              </button>

              {filteredProducts.length === 0 ? (
                <div className="py-12 text-center text-xs text-charcoal-400">No products found</div>
              ) : filteredProducts.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addCatalogItem(p)}
                  className="w-full px-5 py-3 flex items-center gap-3 hover:bg-cream/40 border-b border-[#EDE8E1] text-left"
                >
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#EDE8E1] flex-shrink-0" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-cream border border-[#EDE8E1] flex items-center justify-center flex-shrink-0">
                      <Package className="w-3.5 h-3.5 text-charcoal-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal-900 truncate">{p.name}</p>
                    <p className="text-[11px] font-mono text-charcoal-400">{p.sku}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ──────────────────────────────────────────────────── */
/* ItemRow — single item with full configurator         */
/* ──────────────────────────────────────────────────── */
interface RowProps {
  item:     Item
  product:  Product        // always non-null — custom items receive a virtualised product built from globalAttrs
  summary:  string
  onUpdate: (patch: Partial<Item>) => void
  onRemove: () => void
  onToggle: () => void
}

function ItemRow({ item, product, summary, onUpdate, onRemove, onToggle }: RowProps) {
  const hasDimensions   = product.dimensions.length > 0
  const hasColors       = product.colors.length     > 0
  const hasTextures     = product.textures.length   > 0
  const hasFinishes     = product.finishes.length   > 0
  const variants        = parseVariants(product.specifications)
  const useVariants     = (variants?.length ?? 0) > 0
  const selectedVariant = !item.isCustomSize && item.selectedVariantId && variants
    ? variants.find(v => v.id === item.selectedVariantId) ?? null
    : null

  // Local state for colour picker open/close
  const [colorPickerOpen, setColorPickerOpen] = useState(false)
  const colorPickerRef = useRef<HTMLDivElement>(null)

  // Local state for custom item image
  const [imgPreview,    setImgPreview]    = useState<string | null>(item.customImageUrl ?? null)
  const [imgUploading,  setImgUploading]  = useState(false)
  const [imgUploadErr,  setImgUploadErr]  = useState<string | null>(null)
  const imgInputRef = useRef<HTMLInputElement>(null)

  async function handleItemImageFile(file: File) {
    if (!file.type.startsWith('image/')) { setImgUploadErr('Only image files allowed'); return }
    if (imgPreview?.startsWith('blob:')) URL.revokeObjectURL(imgPreview)
    setImgPreview(URL.createObjectURL(file))
    setImgUploadErr(null)
    setImgUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/admin/rfp/image-upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      onUpdate({ customImageUrl: data.imageUrl })
    } catch (e: any) {
      setImgUploadErr(e.message ?? 'Upload failed')
      onUpdate({ customImageUrl: null })
    } finally {
      setImgUploading(false)
    }
  }

  // Local state for custom texture
  const [customTextureFile,    setCustomTextureFile]    = useState<File | null>(null)
  const [customTexturePreview, setCustomTexturePreview] = useState<string | null>(null)
  const [texDragOver,          setTexDragOver]          = useState(false)
  const [texUploading,         setTexUploading]         = useState(false)
  const [texUploadError,       setTexUploadError]       = useState<string | null>(null)
  const texInputRef = useRef<HTMLInputElement>(null)

  // Revoke blob URL on unmount
  useEffect(() => {
    return () => {
      if (customTexturePreview?.startsWith('blob:')) URL.revokeObjectURL(customTexturePreview)
    }
  }, [customTexturePreview])

  async function handleTextureFile(file: File) {
    if (!file.type.startsWith('image/')) { setTexUploadError('Only image files allowed'); return }
    if (customTexturePreview?.startsWith('blob:')) URL.revokeObjectURL(customTexturePreview)
    setCustomTextureFile(file)
    setCustomTexturePreview(URL.createObjectURL(file))
    setTexUploadError(null)
    setTexUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res  = await fetch('/api/attributes/textures/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      onUpdate({ customTextureUrl: data.imageUrl })
    } catch (e: any) {
      setTexUploadError(e.message ?? 'Upload failed')
      onUpdate({ customTextureUrl: null })
    } finally {
      setTexUploading(false)
    }
  }

  function resetCustomTexture() {
    if (customTexturePreview?.startsWith('blob:')) URL.revokeObjectURL(customTexturePreview)
    setCustomTextureFile(null)
    setCustomTexturePreview(null)
    setTexUploadError(null)
    onUpdate({ isCustomTexture: false, customTextureUrl: null, customTextureName: null, textureId: hasTextures ? product.textures[0]?.id ?? null : null })
  }

  return (
    <div className="px-6 py-4">
      {/* ── Header row — single height, all items vertically centred ── */}
      <div className="flex items-center gap-2.5">

        {/* Thumbnail / upload */}
        {item.isCustom ? (
          <>
            <input ref={imgInputRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleItemImageFile(f) }} />
            <button
              type="button"
              onClick={() => imgInputRef.current?.click()}
              title={imgPreview ? 'Change image' : 'Upload product image'}
              className="relative w-10 h-10 rounded-lg border-2 border-dashed border-terracotta/40 hover:border-terracotta bg-cream/60 flex items-center justify-center overflow-hidden flex-shrink-0 transition-colors group"
            >
              {imgPreview ? (
                <>
                  <img src={imgPreview} alt="" className="w-full h-full object-cover" />
                  {imgUploading && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-terracotta animate-spin" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Upload className="w-3 h-3 text-white" />
                  </div>
                </>
              ) : (
                <Upload className="w-3.5 h-3.5 text-terracotta/50 group-hover:text-terracotta transition-colors" />
              )}
            </button>
          </>
        ) : product.imageUrl ? (
          <img src={product.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover border border-[#EDE8E1] flex-shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-cream border border-[#EDE8E1] flex items-center justify-center flex-shrink-0">
            <Package className="w-3.5 h-3.5 text-charcoal-300" />
          </div>
        )}

        {/* Name */}
        <div className="flex-1 min-w-0">
          {item.isCustom ? (
            <input
              value={item.productName}
              onChange={e => onUpdate({ productName: e.target.value })}
              placeholder="Product name"
              className="w-full px-3 py-1.5 bg-white border border-[#EDE8E1] rounded-lg text-sm font-semibold focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-colors"
            />
          ) : (
            <p className="text-sm font-semibold text-charcoal-900 truncate leading-none">{item.productName}</p>
          )}
          {!item.isCustom && item.productSku && (
            <p className="text-[10px] font-mono text-charcoal-400 mt-0.5 leading-none">{item.productSku}</p>
          )}
        </div>

        {/* Qty */}
        <input
          type="number" min={1}
          aria-label="Quantity" title="Quantity"
          value={item.quantity}
          onChange={e => onUpdate({ quantity: Math.max(1, parseInt(e.target.value) || 1) })}
          className="w-16 flex-shrink-0 px-2 py-1.5 bg-white border border-[#EDE8E1] rounded-lg text-sm text-center font-semibold tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        {/* Unit AED */}
        <input
          type="number" step="0.01" min={0}
          placeholder="Unit AED" aria-label="Unit price AED"
          value={item.unitPrice ?? ''}
          onChange={e => onUpdate({ unitPrice: e.target.value ? parseFloat(e.target.value) : null })}
          className="w-24 flex-shrink-0 px-2 py-1.5 bg-white border border-[#EDE8E1] rounded-lg text-sm text-right tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />

        {/* Configure */}
        <button type="button" onClick={onToggle}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-cream text-charcoal-400 hover:text-charcoal-700 transition-colors"
          title={item.expanded ? 'Collapse' : 'Configure options'}>
          <Settings2 className="w-4 h-4" />
        </button>

        {/* Remove */}
        <button type="button" onClick={onRemove}
          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-rose-50 text-charcoal-300 hover:text-rose-500 transition-colors"
          title="Remove item">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Summary line — sits below the row, indented past thumbnail */}
      {summary !== 'No options selected' && (
        <p className="mt-1.5 pl-[52px] text-[11px] text-charcoal-400 truncate leading-none">
          {summary}
        </p>
      )}
      {imgUploadErr && (
        <p className="mt-1 pl-[52px] text-[10px] text-rose-500">{imgUploadErr}</p>
      )}

      {/* ── Expanded configurator ── */}
      {item.expanded && (
        <div className="mt-4 pl-15 space-y-4 border-t border-dashed border-[#EDE8E1] pt-4">

          {/* Size / Variant */}
          {(useVariants || hasDimensions || item.isCustom) && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Ruler className="w-3.5 h-3.5 text-charcoal-500" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
                {useVariants ? 'Size / Variant' : 'Size'}
              </span>
            </div>

            {/* Catalogue item: show variant/dimension chips + custom toggle */}
            {!item.isCustom && (
              <div className="flex flex-wrap gap-2">
                {/* Variant chips */}
                {useVariants && variants!.map(v => {
                  const specs = (v.specifications ?? []).filter(s => s.value != null)
                  const hint  = specs.slice(0, 2).map(s => `${s.value}${s.unit ?? ''}`).join(' × ')
                  const isSel = !item.isCustomSize && item.selectedVariantId === v.id
                  return (
                    <button key={v.id} type="button"
                      onClick={() => onUpdate({ selectedVariantId: v.id, isCustomSize: false, dimensionId: null })}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border flex flex-col items-start gap-0.5 ${
                        isSel
                          ? 'bg-terracotta text-white border-terracotta'
                          : 'bg-white text-charcoal-900 border-charcoal-200 hover:border-terracotta hover:text-terracotta'
                      }`}
                    >
                      <span>{v.name}</span>
                      {hint && (
                        <span className={`text-[9px] font-medium leading-none ${isSel ? 'text-white/65' : 'text-charcoal-400'}`}>
                          {hint}
                        </span>
                      )}
                    </button>
                  )
                })}

                {/* Dimension chips (fallback) */}
                {!useVariants && hasDimensions && product.dimensions.map(d => (
                  <button key={d.id} type="button"
                    onClick={() => onUpdate({ dimensionId: d.id, isCustomSize: false, selectedVariantId: null })}
                    className={`px-3 py-2 rounded-lg text-xs font-semibold transition-colors border ${
                      !item.isCustomSize && item.dimensionId === d.id
                        ? 'bg-terracotta text-white border-terracotta'
                        : 'bg-white text-charcoal-900 border-charcoal-200 hover:border-terracotta hover:text-terracotta'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}

                {/* Custom size chip */}
                <button type="button"
                  onClick={() => onUpdate({ isCustomSize: true, dimensionId: null, selectedVariantId: null })}
                  className={`border-2 border-dashed font-semibold text-xs px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                    item.isCustomSize
                      ? 'border-terracotta bg-terracotta/10 text-terracotta'
                      : 'border-terracotta/50 text-terracotta hover:bg-terracotta/5'
                  }`}
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Custom Size
                </button>
              </div>
            )}

            {/* Selected variant spec panel (catalogue only) */}
            {!item.isCustom && useVariants && (
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
                selectedVariant && (selectedVariant.specifications ?? []).filter(s => s.value != null).length > 0
                  ? 'max-h-40 opacity-100 mt-2'
                  : 'max-h-0 opacity-0'
              }`}>
                {selectedVariant && (
                  <div className="rounded-xl border border-charcoal-100 bg-cream px-4 py-3">
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
                )}
              </div>
            )}

            {/* Custom dimension builder — always open for custom items, toggled for catalogue */}
            {item.isCustomSize && (
              <div className={`${item.isCustom ? '' : 'mt-3'} bg-cream border border-terracotta/20 rounded-xl p-4 space-y-3`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-terracotta uppercase tracking-wide">Custom Dimensions</p>
                  {/* X only shown for catalogue items (to exit back to presets) */}
                  {!item.isCustom && (
                  <button type="button"
                    onClick={() => onUpdate({
                      isCustomSize:      false,
                      selectedVariantId: useVariants && variants!.length > 0 ? variants![0].id : null,
                      dimensionId:       !useVariants && hasDimensions ? product.dimensions[0].id : null,
                    })}
                    className="w-6 h-6 flex items-center justify-center rounded-md text-charcoal-400 hover:text-terracotta hover:bg-terracotta/10 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  )}
                </div>

                {/* Quick add */}
                <div>
                  <p className="text-[10px] font-medium text-charcoal-400 uppercase tracking-wide mb-2">Quick add</p>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_DIM_LABELS.map(lbl => (
                      <button key={lbl} type="button"
                        onClick={() => onUpdate({
                          customDims: [...item.customDims, { id: crypto.randomUUID(), label: lbl, value: '', unit: 'mm' }],
                        })}
                        className="px-2.5 py-1 rounded-full border border-terracotta/40 text-terracotta text-[11px] font-semibold hover:bg-terracotta/10 transition-colors"
                      >
                        + {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dimension rows */}
                <div className="space-y-2">
                  {item.customDims.map((dim, idx) => (
                    <div key={dim.id} className="flex items-center gap-2">
                      <input type="text"
                        placeholder={idx === 0 ? 'e.g. Top Dia' : 'Label'}
                        value={dim.label}
                        onChange={e => onUpdate({
                          customDims: item.customDims.map(d => d.id === dim.id ? { ...d, label: e.target.value } : d),
                        })}
                        className="flex-1 min-w-0 border border-charcoal-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta placeholder:text-charcoal-400"
                      />
                      <input type="number" step="0.01" placeholder="Value"
                        value={dim.value}
                        onChange={e => onUpdate({
                          customDims: item.customDims.map(d => d.id === dim.id ? { ...d, value: e.target.value } : d),
                        })}
                        className="w-24 border border-charcoal-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <UnitDropdown
                        value={dim.unit}
                        onChange={unit => onUpdate({
                          customDims: item.customDims.map(d => d.id === dim.id ? { ...d, unit } : d),
                        })}
                      />
                      {item.customDims.length > 1 && (
                        <button type="button"
                          onClick={() => onUpdate({ customDims: item.customDims.filter(d => d.id !== dim.id) })}
                          className="p-1.5 rounded-lg text-charcoal-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add row */}
                <button type="button"
                  onClick={() => onUpdate({
                    customDims: [...item.customDims, { id: crypto.randomUUID(), label: '', value: '', unit: 'mm' }],
                  })}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-terracotta hover:underline"
                >
                  <Plus className="w-3 h-3" /> Add another dimension
                </button>
              </div>
            )}
          </div>
          )}

          {/* Colour */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-charcoal-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">Colour</span>
              </div>
              <span className="text-[11px] text-charcoal-500">
                {item.colorMode === 'custom'
                  ? [item.customColorName, item.customColorRal ? `RAL ${item.customColorRal}` : ''].filter(Boolean).join(' · ')
                  : (product.colors.find(c => c.id === item.colorId)?.name ?? '')}
              </span>
            </div>

            <div className="flex flex-wrap gap-2.5 items-center">
              {/* Preset circular swatches */}
              {hasColors && product.colors.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    onUpdate({ colorMode: 'preset', colorId: c.id, customColorHex: null, customColorName: null, customColorRal: null })
                    setColorPickerOpen(false)
                  }}
                  title={c.name}
                  className={`w-9 h-9 rounded-xl border-2 transition-all overflow-hidden ${
                    item.colorMode === 'preset' && item.colorId === c.id
                      ? 'border-terracotta scale-110 shadow-md'
                      : 'border-transparent hover:border-terracotta/50 hover:scale-105'
                  }`}
                  style={{ backgroundColor: c.hexCode ?? '#ccc' }}
                />
              ))}

              {/* Custom Colour dashed chip */}
              <button
                type="button"
                onClick={() => { onUpdate({ colorMode: 'custom' }); setColorPickerOpen(true) }}
                className={`flex items-center gap-1.5 border-2 border-dashed font-semibold text-xs px-3 h-9 rounded-xl transition-colors ${
                  item.colorMode === 'custom'
                    ? 'border-terracotta bg-terracotta/10 text-terracotta'
                    : 'border-terracotta/50 text-terracotta hover:bg-terracotta/5'
                }`}
              >
                {item.colorMode === 'custom' && item.customColorHex ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: item.customColorHex }} />
                    {item.customColorRal ? `RAL ${item.customColorRal}` : (item.customColorName || 'Custom')}
                  </>
                ) : (
                  <>
                    <Palette className="w-3.5 h-3.5" />
                    Custom Colour
                  </>
                )}
              </button>
            </div>

            {/* Inline colour picker */}
            {item.colorMode === 'custom' && colorPickerOpen && (
              <div ref={colorPickerRef}>
                <VendorColorPicker
                  onConfirm={color => {
                    onUpdate({
                      colorMode:       'custom',
                      customColorHex:  color.hex,
                      customColorName: color.name || null,
                      customColorRal:  color.ralCode || null,
                    })
                    setColorPickerOpen(false)
                  }}
                  onCancel={() => {
                    if (!item.customColorHex) {
                      // Nothing confirmed yet — revert to preset
                      onUpdate({
                        colorMode: 'preset',
                        colorId:   hasColors ? (product.colors[0]?.id ?? null) : null,
                      })
                    }
                    setColorPickerOpen(false)
                  }}
                />
              </div>
            )}

            {/* Confirmed custom colour preview */}
            {item.colorMode === 'custom' && item.customColorHex && !colorPickerOpen && (
              <div className="flex items-center gap-3 bg-cream border border-terracotta/20 rounded-xl px-4 py-2.5">
                <div className="w-8 h-8 rounded-lg border border-terracotta/20 flex-shrink-0" style={{ backgroundColor: item.customColorHex }} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-charcoal-900 truncate">{item.customColorName || item.customColorHex.toUpperCase()}</p>
                  {item.customColorRal && <p className="text-[10px] text-charcoal-400">RAL {item.customColorRal}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setColorPickerOpen(true)}
                  className="text-xs text-terracotta font-semibold hover:underline flex-shrink-0"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdate({
                      colorMode:       'preset',
                      colorId:         hasColors ? (product.colors[0]?.id ?? null) : null,
                      customColorHex:  null,
                      customColorName: null,
                      customColorRal:  null,
                    })
                    setColorPickerOpen(false)
                  }}
                  className="text-charcoal-400 hover:text-terracotta transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Texture */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-charcoal-500" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">Texture</span>
              </div>
              <span className="text-[11px] text-charcoal-500">
                {item.isCustomTexture
                  ? (customTextureFile ? `Custom: ${customTextureFile.name}` : 'Custom Texture')
                  : (product.textures.find(t => t.id === item.textureId)?.name ?? '')}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              {/* Preset texture tiles */}
              {hasTextures && product.textures.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    if (customTexturePreview?.startsWith('blob:')) URL.revokeObjectURL(customTexturePreview)
                    setCustomTextureFile(null); setCustomTexturePreview(null); setTexUploadError(null)
                    onUpdate({ textureId: t.id, isCustomTexture: false, customTextureUrl: null })
                  }}
                  title={t.name}
                  className={`w-9 h-9 rounded-xl border-2 overflow-hidden transition-all flex items-center justify-center ${
                    !item.isCustomTexture && item.textureId === t.id
                      ? 'border-terracotta scale-110 shadow-md'
                      : 'border-charcoal-200 hover:border-terracotta/50 hover:scale-105'
                  }`}
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
                onClick={() => { onUpdate({ isCustomTexture: true, textureId: null }); texInputRef.current?.click() }}
                className={`h-9 border-2 border-dashed font-semibold text-xs px-3 rounded-xl transition-colors flex items-center gap-1.5 ${
                  item.isCustomTexture
                    ? 'border-terracotta bg-terracotta/10 text-terracotta'
                    : 'border-terracotta/50 text-terracotta hover:bg-terracotta/5'
                }`}
              >
                <Paintbrush className="w-3.5 h-3.5" />
                Custom
              </button>
            </div>

            {/* Custom texture upload zone */}
            {item.isCustomTexture && (
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
                    <div className="w-14 h-14 rounded-lg overflow-hidden border border-terracotta/30 flex-shrink-0 relative">
                      <img src={customTexturePreview} alt="Custom texture" className="w-full h-full object-cover" />
                      {texUploading && (
                        <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                          <Loader2 className="w-4 h-4 text-terracotta animate-spin" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <input
                        type="text"
                        placeholder="Texture name (e.g. Brushed Bronze)"
                        value={item.customTextureName ?? ''}
                        onChange={e => onUpdate({ customTextureName: e.target.value || null })}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#EDE8E1] rounded-lg text-xs font-semibold focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-colors"
                      />
                      {texUploading && <p className="text-[10px] text-charcoal-400">Uploading…</p>}
                      {texUploadError && <p className="text-[10px] text-rose-500">{texUploadError}</p>}
                      {!texUploading && !texUploadError && item.customTextureUrl && (
                        <p className="text-[10px] text-emerald-600">Uploaded ✓</p>
                      )}
                      <button
                        type="button"
                        onClick={() => texInputRef.current?.click()}
                        className="text-xs text-terracotta hover:underline"
                      >
                        Replace image
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={resetCustomTexture}
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
                    onDrop={e => {
                      e.preventDefault(); setTexDragOver(false)
                      const f = e.dataTransfer.files?.[0]; if (f) handleTextureFile(f)
                    }}
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${
                      texDragOver
                        ? 'border-terracotta bg-terracotta/10'
                        : 'border-terracotta/30 bg-cream/50 hover:border-terracotta/60 hover:bg-cream'
                    }`}
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
                  onClick={resetCustomTexture}
                  className="text-charcoal-400 hover:text-terracotta text-xs font-semibold transition-colors"
                >
                  ← Back to standard textures
                </button>
              </div>
            )}
          </div>

          {/* Finish */}
          <SpecGroup
            icon={<Sparkles className="w-3.5 h-3.5" />}
            label="Finish"
            mode={item.finishMode}
            onModeChange={m => onUpdate({ finishMode: m })}
            hasPreset={hasFinishes}
            allowCustom
          >
            {item.finishMode === 'preset' ? (
              hasFinishes ? (
                <div className="flex flex-wrap gap-1.5">
                  {product.finishes.map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => onUpdate({ finishId: item.finishId === f.id ? null : f.id })}
                      className={`px-2.5 h-9 rounded-xl border text-[11px] transition-colors ${
                        item.finishId === f.id
                          ? 'border-terracotta bg-terracotta/5 text-charcoal-900 font-semibold'
                          : 'border-[#EDE8E1] bg-white text-charcoal-600 hover:border-charcoal-300'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-charcoal-400 italic">No preset finishes for this product</p>
              )
            ) : (
              <input
                placeholder="Describe the finish (e.g. matte clear coat)"
                value={item.customFinishDesc ?? ''}
                onChange={e => onUpdate({ customFinishDesc: e.target.value || null })}
                className="w-full px-3 py-2 bg-white border border-[#EDE8E1] rounded-lg text-sm focus:outline-none focus:border-terracotta"
              />
            )}
          </SpecGroup>

          {/* Drainage / holes */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="w-3.5 h-3.5 inline-flex items-center justify-center rounded-full bg-charcoal-100 text-charcoal-500 text-[8px] font-bold">○</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">Drainage holes</span>
            </div>
            <div className="inline-flex rounded-lg bg-cream/50 p-1 border border-[#EDE8E1]">
              {([
                { v: null,             l: 'Not specified' },
                { v: 'with_holes',     l: 'With holes' },
                { v: 'without_holes',  l: 'Without holes' },
              ] as const).map(opt => (
                <button
                  key={String(opt.v)}
                  type="button"
                  onClick={() => onUpdate({ holesOption: opt.v as Item['holesOption'] })}
                  className={`px-3 py-1.5 rounded-md text-[11px] font-semibold transition-colors ${
                    item.holesOption === opt.v
                      ? 'bg-white text-charcoal-900 shadow-sm'
                      : 'text-charcoal-500 hover:text-charcoal-700'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-500 mb-1.5">Item notes</label>
            <input
              placeholder="Optional — special instructions for this item"
              value={item.notes ?? ''}
              onChange={e => onUpdate({ notes: e.target.value || null })}
              className="w-full px-3 py-2 bg-white border border-[#EDE8E1] rounded-lg text-sm focus:outline-none focus:border-terracotta"
            />
          </div>
        </div>
      )}
    </div>
  )
}

/* ── SpecGroup wrapper ──────────────────────────────── */
interface SpecGroupProps {
  icon:         React.ReactNode
  label:        string
  mode:         SpecMode
  onModeChange: (m: SpecMode) => void
  hasPreset:    boolean
  allowCustom:  boolean
  children:     React.ReactNode
}

function SpecGroup({ icon, label, mode, onModeChange, hasPreset, allowCustom, children }: SpecGroupProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5 text-charcoal-500">
          {icon}
          <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </div>
        {allowCustom && (
          <div className="inline-flex rounded-lg bg-cream/50 p-0.5 border border-[#EDE8E1]">
            <button
              type="button"
              onClick={() => onModeChange('preset')}
              disabled={!hasPreset}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                mode === 'preset'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-700'
              } disabled:opacity-30 disabled:cursor-not-allowed`}
            >
              Preset
            </button>
            <button
              type="button"
              onClick={() => onModeChange('custom')}
              className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-colors ${
                mode === 'custom'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-700'
              }`}
            >
              Custom
            </button>
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

/* ── UnitDropdown ──────────────────────────────────── */
function UnitDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`h-[38px] w-16 flex items-center justify-between gap-1 px-2.5 border rounded-lg text-sm font-semibold bg-white transition-colors ${
          open ? 'border-terracotta ring-2 ring-terracotta/10 text-terracotta' : 'border-charcoal-200 text-charcoal-700 hover:border-terracotta/50'
        }`}
      >
        <span>{value}</span>
        <ChevronDown className={`w-3 h-3 flex-shrink-0 transition-transform ${open ? 'rotate-180 text-terracotta' : 'text-charcoal-400'}`} />
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-white border border-[#EDE8E1] rounded-xl shadow-lg overflow-hidden min-w-[64px]">
          {DIM_UNITS.map(u => (
            <button
              key={u}
              type="button"
              onClick={() => { onChange(u); setOpen(false) }}
              className={`w-full px-3 py-2 text-left text-sm font-semibold transition-colors ${
                u === value
                  ? 'bg-terracotta/5 text-terracotta'
                  : 'text-charcoal-700 hover:bg-cream/60'
              }`}
            >
              {u}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── NumInput ──────────────────────────────────────── */
function NumInput({ placeholder, value, onChange }: { placeholder: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <input
      type="number"
      step="0.01"
      placeholder={placeholder}
      value={value ?? ''}
      onChange={e => onChange(e.target.value ? parseFloat(e.target.value) : null)}
      className="px-3 py-2 bg-white border border-[#EDE8E1] rounded-lg text-sm focus:outline-none focus:border-terracotta"
    />
  )
}
