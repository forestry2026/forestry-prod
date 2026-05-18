'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Edit2, Eye, Trash2, Filter, X, AlertCircle, Copy, Loader2,
  Download, FileText, FileSpreadsheet, Layers, Image as ImageIcon,
  Search, Package, Star, Grid3X3, List, ChevronDown,
} from 'lucide-react'
import { ProductImagePreview } from './ProductImagePreview'
import { ProductDeleteButton }  from './ProductDeleteButton'
import { FilterSidebar }        from './FilterSidebar'
import { BatchEditDialog }      from './BatchEditDialog'

interface ProductsListContentProps {
  products:    any[]
  categories?: { id: string; name: string }[]
  readonly?:   boolean
}

interface Filters {
  categoryIds:        string[]
  colorIds:           string[]
  textureIds:         string[]
  finishIds:          string[]
  dimensionIds:       string[]
  isActive:           boolean | null
  isFeatured:         boolean | null
  specificationRanges: { [specId: string]: { min: number; max: number } }
}

type ViewMode = 'grid' | 'list'
type SortKey  = 'newest' | 'name-asc' | 'name-desc' | 'featured'

/* ── helpers ─────────────────────────────────────────────────────── */
function parseSpecs(raw: any): any[] {
  try { return raw ? JSON.parse(raw) : [] } catch { return [] }
}

function getPrimaryImage(product: any): string | undefined {
  return (product.images?.find((i: any) => i.isPrimary) ?? product.images?.[0])?.url
}

/* ── Sort Dropdown ───────────────────────────────────────────────── */
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest',    label: 'Newest' },
  { value: 'name-asc',  label: 'Name A–Z' },
  { value: 'name-desc', label: 'Name Z–A' },
  { value: 'featured',  label: 'Featured first' },
]

function SortDropdown({ value, onChange }: { value: SortKey; onChange: (v: SortKey) => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const label = SORT_OPTIONS.find(o => o.value === value)?.label ?? 'Newest'

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEsc)
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleEsc) }
  }, [])

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-2 px-3 py-3 bg-white border border-[#E8E0D5] rounded-xl shadow-card hover:border-terracotta/40 transition-colors text-[13px] font-medium text-charcoal-700 whitespace-nowrap"
      >
        {label}
        <ChevronDown className={`w-3.5 h-3.5 text-charcoal-300 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-44 bg-white border border-[#E8E0D5] rounded-xl shadow-card-lg overflow-hidden">
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              className={`w-full text-left px-4 py-2.5 text-[13px] transition-colors ${
                opt.value === value
                  ? 'bg-terracotta/8 text-terracotta font-semibold'
                  : 'text-charcoal-700 hover:bg-cream font-medium'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Admin Grid Card ─────────────────────────────────────────────── */
function AdminGridCard({
  product, isSelected, readonly, duplicatingId,
  onSelect, onDuplicate,
}: {
  product:        any
  isSelected:     boolean
  readonly:       boolean
  duplicatingId:  string | null
  onSelect:       (id: string) => void
  onDuplicate:    (id: string) => void
}) {
  const [imgErr, setImgErr] = useState(false)
  const imgSrc  = getPrimaryImage(product)
  const cats    = product.categories?.map((c: any) => c.category?.name).filter(Boolean) ?? []
  const colors  = (product.colors ?? []).filter((c: any) => c.color?.hexCode).slice(0, 5)

  return (
    <div className={`group relative bg-white rounded-2xl border overflow-hidden transition-all duration-200 flex flex-col ${
      isSelected ? 'border-terracotta ring-2 ring-terracotta/20' : 'border-[#E8E0D5] hover:border-terracotta/40 hover:shadow-warm'
    }`}>
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-cream-dark flex-shrink-0">
        {imgSrc && !imgErr ? (
          <img src={imgSrc} alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-10 h-10 text-charcoal-200" />
          </div>
        )}

        {/* Checkbox overlay */}
        <div className="absolute top-2.5 left-2.5">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onSelect(product.id)}
            onClick={e => e.stopPropagation()}
            className="w-4 h-4 rounded cursor-pointer accent-terracotta bg-white/90 border-0 shadow-sm"
          />
        </div>

        {/* Featured badge */}
        {product.isFeatured && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white rounded-full text-[9px] font-bold shadow-sm">
            <Star className="w-2.5 h-2.5 fill-white" /> Featured
          </div>
        )}

        {/* Hover action overlay */}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 px-3 pb-3 pt-8 bg-gradient-to-t from-charcoal-900/80 to-transparent flex items-end gap-1.5">
          <Link
            href={`/product/${product.sku}`}
            target="_blank"
            title="Preview"
            onClick={e => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-white/90 hover:bg-white text-charcoal-900 text-xs font-bold rounded-lg transition-colors"
          >
            <Eye className="w-3 h-3" /> Preview
          </Link>
          {!readonly && (
            <Link
              href={`/admin/products/${product.id}/edit`}
              title="Edit"
              onClick={e => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-terracotta hover:bg-terracotta-dark text-white text-xs font-bold rounded-lg transition-colors"
            >
              <Edit2 className="w-3 h-3" /> Edit
            </Link>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3.5 gap-2">
        {/* Status */}
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
            product.isActive ? 'bg-sage/15 text-sage-600' : 'bg-charcoal-100 text-charcoal-400'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-sage-500' : 'bg-charcoal-300'}`} />
            {product.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Categories */}
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cats.slice(0, 2).map((c: string) => (
              <span key={c} className="px-2 py-0.5 bg-terracotta/8 text-terracotta text-[10px] font-bold uppercase tracking-wide rounded-full">{c}</span>
            ))}
          </div>
        )}

        {/* Name */}
        <h3 className="font-heading font-bold text-[13px] text-charcoal-900 leading-snug line-clamp-2">
          {product.name}
        </h3>

        {/* SKU */}
        <p className="font-mono text-[10px] text-charcoal-300">{product.sku}</p>

        {/* Colors */}
        {colors.length > 0 && (
          <div className="flex items-center gap-1 mt-auto">
            {colors.map((c: any, i: number) => (
              <span key={i} title={c.color?.name}
                className="w-3.5 h-3.5 rounded-full border border-white shadow-sm ring-1 ring-charcoal-100 flex-shrink-0"
                style={{ backgroundColor: c.color?.hexCode ?? '#ccc' }}
              />
            ))}
            {product.colors.length > 5 && (
              <span className="text-[10px] text-charcoal-400 font-semibold ml-0.5">+{product.colors.length - 5}</span>
            )}
          </div>
        )}

        {/* Bottom actions */}
        {!readonly && (
          <div className="flex items-center justify-between pt-2 border-t border-[#F0EBE1] mt-auto">
            <button
              type="button"
              title="Duplicate"
              disabled={duplicatingId === product.id}
              onClick={() => onDuplicate(product.id)}
              className="flex items-center gap-1 text-[10px] font-semibold text-charcoal-400 hover:text-charcoal-700 transition-colors disabled:opacity-40 disabled:cursor-wait"
            >
              {duplicatingId === product.id
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Copy className="w-3 h-3" />
              }
              Duplicate
            </button>
            <div onClick={e => e.stopPropagation()}>
              <ProductDeleteButton productId={product.id} productName={product.name} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export function ProductsListContent({ products, categories = [], readonly = false }: ProductsListContentProps) {
  const router = useRouter()
  const [viewMode,           setViewMode]            = useState<ViewMode>('list')
  const [sort,               setSort]                = useState<SortKey>('newest')
  const [duplicatingId,      setDuplicatingId]      = useState<string | null>(null)
  const [searchTerm,         setSearchTerm]          = useState('')
  const [filters,            setFilters]             = useState<Filters>({
    categoryIds: [], colorIds: [], textureIds: [], finishIds: [],
    dimensionIds: [], isActive: null, isFeatured: null, specificationRanges: {},
  })
  const [selectedProductIds, setSelectedProductIds]  = useState<string[]>([])
  const [batchEditOpen,      setBatchEditOpen]        = useState(false)
  const [sidebarOpen,        setSidebarOpen]          = useState(false)
  const [deleteConfirmOpen,  setDeleteConfirmOpen]    = useState(false)
  const [isDeleting,         setIsDeleting]           = useState(false)

  /* ── filter logic (unchanged) ─────────────────────────────────── */
  const filteredProducts = useMemo(() => {
    let result = products

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase()
      result = result.filter((product) => {
        if (product.name.toLowerCase().includes(q)) return true
        if (product.sku.toLowerCase().includes(q))  return true
        if (product.categories?.some((c: any) => c.category?.name?.toLowerCase().includes(q))) return true
        if (product.colors?.some((c: any)   => c.color?.name?.toLowerCase().includes(q)))   return true
        if (product.textures?.some((t: any) => t.texture?.name?.toLowerCase().includes(q))) return true
        if (product.finishes?.some((f: any) => f.finish?.name?.toLowerCase().includes(q)))  return true
        if (product.specifications) {
          const specs = parseSpecs(product.specifications)
          const matchSpec = (s: any) =>
            (s.name && s.name.toLowerCase().includes(q)) ||
            (s.value !== null && s.value !== undefined && String(s.value).includes(q)) ||
            (s.unit  && s.unit.toLowerCase().includes(q))
          const found = specs.some((item: any) =>
            Array.isArray(item.specifications)
              ? (item.name?.toLowerCase().includes(q)) || item.specifications.some(matchSpec)
              : matchSpec(item)
          )
          if (found) return true
        }
        return false
      })
    }

    result = result.filter((product) => {
      if (filters.categoryIds.length > 0) {
        const ids = product.categories?.map((c: any) => c.categoryId) || []
        if (!filters.categoryIds.some((id) => ids.includes(id))) return false
      }
      if (filters.colorIds.length > 0) {
        const ids = product.colors.map((c: any) => c.colorId)
        if (!filters.colorIds.some((id) => ids.includes(id))) return false
      }
      if (filters.textureIds.length > 0) {
        const ids = product.textures.map((t: any) => t.textureId)
        if (!filters.textureIds.some((id) => ids.includes(id))) return false
      }
      if (filters.finishIds.length > 0) {
        const ids = product.finishes.map((f: any) => f.finishId)
        if (!filters.finishIds.some((id) => ids.includes(id))) return false
      }
      if (filters.dimensionIds.length > 0) {
        const ids = product.dimensions.map((d: any) => d.dimensionId)
        if (!filters.dimensionIds.some((id) => ids.includes(id))) return false
      }
      if (filters.isActive !== null   && product.isActive   !== filters.isActive)   return false
      if (filters.isFeatured !== null && product.isFeatured !== filters.isFeatured) return false
      if (Object.keys(filters.specificationRanges).length > 0) {
        const specs = parseSpecs(product.specifications)
        for (const [specId, range] of Object.entries(filters.specificationRanges)) {
          const spec = specs.find((s: any) => s.id === specId)
          if (spec?.value !== null && typeof spec?.value === 'number') {
            if (spec.value < range.min || spec.value > range.max) return false
          }
        }
      }
      return true
    })

    // Sort
    switch (sort) {
      case 'name-asc':  result = [...result].sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name-desc': result = [...result].sort((a, b) => b.name.localeCompare(a.name)); break
      case 'featured':  result = [...result].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)); break
      // 'newest' — already ordered by createdAt desc from server
    }

    return result
  }, [searchTerm, filters, sort, products])

  /* ── handlers ─────────────────────────────────────────────────── */
  const handleSelectProduct = (id: string) =>
    setSelectedProductIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const handleSelectAll = () =>
    setSelectedProductIds(
      selectedProductIds.length === filteredProducts.length ? [] : filteredProducts.map(p => p.id)
    )

  const handleDuplicate = async (productId: string) => {
    setDuplicatingId(productId)
    try {
      const res = await fetch(`/api/products/${productId}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error()
      const { data } = await res.json()
      router.push(`/admin/products/${data.id}/edit`)
    } catch {
      alert('Failed to duplicate product.')
      setDuplicatingId(null)
    }
  }

  const handleBatchDelete = async () => {
    try {
      setIsDeleting(true)
      await Promise.all(selectedProductIds.map(id => fetch(`/api/products/${id}`, { method: 'DELETE' })))
      setSelectedProductIds([])
      setDeleteConfirmOpen(false)
      window.location.reload()
    } catch {
      alert('Failed to delete some products.')
      setIsDeleting(false)
    }
  }

  const handleBatchEditSuccess = () => {
    setSelectedProductIds([])
    setBatchEditOpen(false)
    window.location.reload()
  }

  /* ── export helpers (unchanged logic) ─────────────────────────── */
  const buildExportRow = (product: any) => {
    const specs = parseSpecs(product.specifications)
    const specParts: string[] = []
    specs.forEach((item: any) => {
      if (Array.isArray(item.specifications)) {
        const prefix = item.name ? `${item.name}${item.price != null ? ` (AED ${Number(item.price).toLocaleString()})` : ''}: ` : ''
        const vals   = item.specifications
          .filter((s: any) => s.value !== null && s.value !== undefined)
          .map((s: any) => `${s.name} ${s.value}${s.unit ? ' ' + s.unit : ''}`).join(', ')
        if (vals) specParts.push(prefix + vals)
      } else if (item.value !== null && item.value !== undefined) {
        specParts.push(`${item.name}: ${item.value}${item.unit ? ' ' + item.unit : ''}`)
      }
    })
    return {
      SKU:       product.sku,
      Name:      product.name,
      Categories: product.categories?.map((c: any) => c.category?.name).filter(Boolean).join(', ') || '',
      Colors:    product.colors?.map((c: any) => c.color?.name).filter(Boolean).join(', ') || '',
      Textures:  product.textures?.map((t: any) => t.texture?.name).filter(Boolean).join(', ') || '',
      Finishes:  product.finishes?.map((f: any) => f.finish?.name).filter(Boolean).join(', ') || '',
      'Dimensions & Specifications': specParts.join(' | '),
      Status:   product.isActive   ? 'Active'   : 'Inactive',
      Featured: product.isFeatured ? 'Yes'       : 'No',
    }
  }

  const handleExportCSV = () => {
    const rows = filteredProducts.filter(p => selectedProductIds.includes(p.id)).map(buildExportRow)
    if (!rows.length) return
    const headers = Object.keys(rows[0])
    const escape  = (v: any) => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const csv  = [headers.join(','), ...rows.map(r => headers.map(h => escape((r as any)[h])).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = `products-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const handleExportExcel = async () => {
    const rows = filteredProducts.filter(p => selectedProductIds.includes(p.id)).map(buildExportRow)
    if (!rows.length) return
    const XLSX     = await import('xlsx')
    const ws       = XLSX.utils.json_to_sheet(rows)
    ws['!cols']    = Object.keys(rows[0]).map(key => ({ wch: Math.max(key.length, ...rows.map(r => String((r as any)[key] ?? '').length), 10) }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    XLSX.writeFile(wb, `products-export-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  const handleExportPDF = async () => {
    const selected = filteredProducts.filter(p => selectedProductIds.includes(p.id))
    if (!selected.length) return

    const { default: jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const PW = 210; const PH = 297; const M = 12; const CW = PW - M * 2
    const TOP = 16; const BOTTOM = PH - 9
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

    type RGB = [number,number,number]
    const T  : RGB = [201,107, 74]
    const CH : RGB = [ 45, 41, 38]
    const CR : RGB = [245,237,224]
    const CD : RGB = [222,208,188]
    const MU : RGB = [140,126,114]

    const hex2rgb = (h:string): RGB => {
      const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h)
      return r ? [parseInt(r[1],16),parseInt(r[2],16),parseInt(r[3],16)] : [200,188,170]
    }

    const toDataUrl = (url:string): Promise<string|null> =>
      new Promise(resolve => {
        const img = new Image(); img.crossOrigin='anonymous'
        img.onload = () => { try {
          const cv = document.createElement('canvas')
          cv.width=img.naturalWidth; cv.height=img.naturalHeight
          cv.getContext('2d')!.drawImage(img,0,0)
          resolve(cv.toDataURL('image/jpeg',0.88))
        } catch { resolve(null) } }
        img.onerror = ()=>resolve(null); img.src = url
      })

    const imgMap: Record<string,string|null> = {}
    await Promise.all(selected.map(async p => {
      const pr = p.images?.find((i:any)=>i.isPrimary)||p.images?.[0]
      imgMap[p.id] = pr?.url ? await toDataUrl(pr.url) : null
    }))

    const texImgMap: Record<string,string|null> = {}
    const allTextures = selected.flatMap(p => (p.textures||[]).map((t:any)=>t.texture).filter(Boolean))
    const uniqueTextures = allTextures.filter((t:any,i:number,arr:any[])=>arr.findIndex((x:any)=>x.id===t.id)===i)
    await Promise.all(uniqueTextures.map(async (t:any) => {
      texImgMap[t.id] = t.imageUrl ? await toDataUrl(t.imageUrl) : null
    }))

    const drawChrome = (pageNum:number, total:number) => {
      doc.setFillColor(...T); doc.rect(0,0,PW,TOP-2,'F')
      doc.setTextColor(255,255,255)
      doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.text('FORESTRY', M, TOP-5)
      doc.setFontSize(6.5); doc.setFont('helvetica','normal')
      doc.text('Product Catalog', M+17, TOP-5)
      doc.text(`${dateStr}  ·  Page ${pageNum}/${total}  ·  ${selected.length} products`, PW-M, TOP-5, {align:'right'})
      doc.setFillColor(...CD); doc.rect(0,PH-8,PW,8,'F')
      doc.setTextColor(...MU); doc.setFontSize(6); doc.setFont('helvetica','normal')
      doc.text('Forestry Admin — Confidential', M, PH-3)
    }

    const CARD_IMG = 22; const CARD_PAD = 3
    const IX = M + CARD_IMG + 4; const IW = CW - CARD_IMG - 4
    let y = TOP + 2
    const guard = (h:number) => { if (y+h > BOTTOM) { doc.addPage(); y = TOP+2 } }
    const tag = (text:string, x:number, ty:number, bg:RGB, fg:RGB) => {
      doc.setFontSize(5.5); doc.setFont('helvetica','bold')
      const w = doc.getTextWidth(text)+3.5
      doc.setFillColor(...bg); doc.roundedRect(x, ty-3, w, 4.5, 1,1,'F')
      doc.setTextColor(...fg); doc.text(text, x+1.75, ty); return w+1.5
    }

    selected.forEach((product, idx) => {
      let specGroups: any[] = parseSpecs(product.specifications)
      const colorCount  = (product.colors||[]).length
      const textureObjs = (product.textures||[]).map((t:any)=>t.texture).filter(Boolean) as any[]
      const finishes    = (product.finishes||[]).map((f:any)=>f.finish?.name).filter(Boolean) as string[]
      const groups      = specGroups.filter((g:any)=>(Array.isArray(g.specifications)?g.specifications:[g]).some((s:any)=>s.value!=null))

      guard(CARD_IMG + CARD_PAD * 2)
      const cardTop = y
      const imgY = cardTop + CARD_PAD
      const durl = imgMap[product.id]
      if (durl) {
        doc.addImage(durl,'JPEG', M+3, imgY, CARD_IMG, CARD_IMG, undefined,'FAST')
        doc.setDrawColor(...CD); doc.setLineWidth(0.25); doc.roundedRect(M+3, imgY, CARD_IMG, CARD_IMG, 1,1,'S')
      } else {
        doc.setFillColor(...CD); doc.roundedRect(M+3, imgY, CARD_IMG, CARD_IMG, 1,1,'F')
        doc.setTextColor(...MU); doc.setFontSize(5.5)
        doc.text('No image', M+3+CARD_IMG/2, imgY+CARD_IMG/2+1, {align:'center'})
      }

      let iy = cardTop + CARD_PAD + 2
      doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(...CH)
      doc.text(doc.splitTextToSize(product.name, IW-22)[0], IX, iy)
      doc.setFontSize(6); doc.setFont('helvetica','normal'); doc.setTextColor(...MU)
      doc.text(product.sku, M+CW, iy, {align:'right'}); iy += 4.5

      const cats = (product.categories||[]).map((c:any)=>c.category?.name).filter(Boolean) as string[]
      if (cats.length) {
        doc.setFontSize(6); doc.setFont('helvetica','bold'); doc.setTextColor(...T)
        doc.text('Category:', IX, iy)
        const cw = doc.getTextWidth('Category:') + 2
        doc.setFont('helvetica','normal'); doc.setTextColor(...CH)
        doc.text(doc.splitTextToSize(cats.join(', '), IW-cw-2)[0], IX+cw, iy); iy += 4.5
      }

      let bx = IX
      bx += tag(product.isActive?'Active':'Inactive', bx, iy,
        product.isActive?[215,240,220] as RGB:[245,220,220] as RGB,
        product.isActive?[35,120,60]  as RGB:[150,55,55]   as RGB)
      if (product.isFeatured) tag('★ Featured', bx, iy, [255,244,210] as RGB, [155,105,15] as RGB)
      iy += 5.5

      if (colorCount > 0) {
        const colors = (product.colors||[]).map((c:any)=>c.color).filter(Boolean)
        const SW = 3.2; const SGAP = 1.8; let sx = IX; let sy = iy
        colors.forEach((color:any) => {
          if (sx + SW > M+CW-2) { sx = IX; sy += SW + 2.5 }
          const rgb = hex2rgb(color.hexCode||'#D4C5A9')
          doc.setFillColor(...rgb); doc.circle(sx+SW/2, sy+SW/2, SW/2,'F')
          doc.setDrawColor(200,188,172); doc.setLineWidth(0.15); doc.circle(sx+SW/2, sy+SW/2, SW/2,'S')
          sx += SW + SGAP
        })
        doc.setFontSize(5.5); doc.setFont('helvetica','normal'); doc.setTextColor(...MU)
        doc.text(`${colorCount} color${colorCount!==1?'s':''}`, sx+1, iy+SW/2+1); iy = sy + SW + 6
      }

      if (textureObjs.length) {
        doc.setFontSize(5.8); doc.setFont('helvetica','bold'); doc.setTextColor(...T)
        doc.text('Textures:', IX, iy); iy += 3.5
        const TS = 7; const TGAP = 2.5; let tx2 = IX
        textureObjs.forEach((tex:any) => {
          if (tx2 + TS > M+CW-2) { tx2 = IX; iy += TS + 6 }
          const tdata = texImgMap[tex.id]
          if (tdata) {
            doc.addImage(tdata,'JPEG', tx2, iy, TS, TS, undefined,'FAST')
            doc.setDrawColor(...CD); doc.setLineWidth(0.2); doc.roundedRect(tx2, iy, TS, TS, 0.5,0.5,'S')
          } else {
            doc.setFillColor(...CD); doc.roundedRect(tx2, iy, TS, TS, 0.5,0.5,'F')
          }
          doc.setFontSize(4.5); doc.setFont('helvetica','normal'); doc.setTextColor(...MU)
          doc.text(doc.splitTextToSize(tex.name||'', TS+TGAP)[0], tx2+TS/2, iy+TS+2, {align:'center'})
          tx2 += TS + TGAP
        }); iy += TS + 6
      }

      if (finishes.length) {
        doc.setFontSize(5.8); doc.setFont('helvetica','bold'); doc.setTextColor(...T)
        doc.text('Finishes:', IX, iy)
        const fw = doc.getTextWidth('Finishes:') + 2.5
        doc.setFont('helvetica','normal'); doc.setTextColor(...CH)
        doc.text(doc.splitTextToSize(finishes.join(', '), IW-fw-2)[0], IX+fw, iy); iy += 5.5
      }

      if (groups.length) {
        doc.setDrawColor(...CD); doc.setLineWidth(0.2); doc.line(IX, iy, M+CW-2, iy); iy += 3
        groups.forEach((group:any) => {
          const isGroup = Array.isArray(group.specifications)
          const items   = isGroup ? group.specifications : [group]
          const withVal = items.filter((s:any)=>s.value!=null)
          if (!withVal.length) return
          if (iy + 5 > BOTTOM) {
            doc.addPage(); y = TOP+2; iy = TOP+2
            doc.setFontSize(6); doc.setFont('helvetica','bold'); doc.setTextColor(...MU)
            doc.text(`${product.name} (continued)`, IX, iy); iy += 4
            doc.setDrawColor(...CD); doc.setLineWidth(0.2); doc.line(IX, iy, M+CW-2, iy); iy += 3
          }
          if (isGroup && group.name) {
            doc.setFontSize(5.8); doc.setFont('helvetica','bold'); doc.setTextColor(...T)
            doc.text(group.name+': ', IX, iy)
            const vw = doc.getTextWidth(group.name+': ')
            doc.setFont('helvetica','normal'); doc.setTextColor(...CH)
            const specStr  = withVal.map((s:any)=>`${s.name} ${s.value}${s.unit?' '+s.unit:''}`).join('  ·  ')
            const priceStr = group.price != null ? `AED ${Number(group.price).toLocaleString()}` : ''
            const priceW   = priceStr ? doc.getTextWidth(priceStr)+2 : 0
            doc.text(doc.splitTextToSize(specStr, IW-vw-priceW-4)[0], IX+vw, iy)
            if (priceStr) { doc.setFont('helvetica','bold'); doc.setTextColor(...T); doc.text(priceStr, M+CW-2, iy, {align:'right'}) }
          } else {
            doc.setFontSize(5.8); doc.setFont('helvetica','normal'); doc.setTextColor(...CH)
            doc.text(doc.splitTextToSize(withVal.map((s:any)=>`${s.name}: ${s.value}${s.unit?' '+s.unit:''}`).join('  ·  '), IW-2)[0], IX, iy)
          }
          iy += 5
        })
      }

      iy += CARD_PAD
      doc.setDrawColor(...CD); doc.setLineWidth(0.3); doc.line(M, iy, M+CW, iy)
      y = iy + 2
    })

    const total = (doc.internal as any).getNumberOfPages()
    for (let p=1; p<=total; p++) { doc.setPage(p); drawChrome(p, total) }
    doc.save(`forestry-catalog-${new Date().toISOString().slice(0,10)}.pdf`)
  }

  const activeFilterCount =
    filters.categoryIds.length + filters.colorIds.length + filters.textureIds.length +
    filters.finishIds.length   + filters.dimensionIds.length +
    (filters.isActive   !== null ? 1 : 0) +
    (filters.isFeatured !== null ? 1 : 0)

  const allSelected  = filteredProducts.length > 0 && selectedProductIds.length === filteredProducts.length
  const someSelected = selectedProductIds.length > 0

  /* ── render ──────────────────────────────────────────────────── */
  return (
    <div className="space-y-4">

      {/* ── Row 1: count + view toggle (mirrors vendor header) ─────── */}
      <div className="flex items-end justify-between">
        <p className="text-[13px] text-charcoal-400">
          {filteredProducts.length} item{filteredProducts.length !== 1 ? 's' : ''}
        </p>
        <div className="flex bg-white border border-[#E8E0D5] rounded-xl overflow-hidden shadow-card">
          <button
            onClick={() => setViewMode('grid')}
            title="Grid view"
            className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-terracotta/10 text-terracotta' : 'text-charcoal-300 hover:bg-cream'}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            title="List view"
            className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-terracotta/10 text-terracotta' : 'text-charcoal-300 hover:bg-cream'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Row 2: search + filter (mirrors vendor filter bar) ──────── */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, SKU, category, colour, specification…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 placeholder-charcoal-300 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all shadow-card"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-semibold transition-all shadow-card flex-shrink-0 ${
            activeFilterCount > 0
              ? 'bg-terracotta text-white border-terracotta'
              : 'bg-white text-charcoal-700 border-[#E8E0D5] hover:border-terracotta/40'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white/25 text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      {/* ── Filter Sidebar ──────────────────────────────────────── */}
      <FilterSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onFiltersChange={setFilters}
        filters={filters}
        products={products}
        categories={categories}
      />

      {/* ── Batch toolbar ───────────────────────────────────────── */}
      {someSelected && (
        <div className="flex items-center justify-between px-5 py-3 bg-charcoal-900 rounded-xl gap-4">
          <div className="flex items-center gap-2.5">
            <span className="text-sm font-semibold text-white">
              {selectedProductIds.length} selected
            </span>
            <button
              onClick={() => setSelectedProductIds([])}
              className="text-charcoal-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {!readonly && (
              <button
                onClick={() => setBatchEditOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-terracotta hover:bg-terracotta-dark text-white rounded-lg text-xs font-semibold transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
              title="Export CSV"
            >
              <FileText className="w-3.5 h-3.5" /> CSV
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
              title="Export Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-green-400" /> Excel
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors"
              title="Export PDF"
            >
              <Download className="w-3.5 h-3.5 text-red-400" /> PDF
            </button>
            {!readonly && (
              <>
                <div className="w-px h-5 bg-white/20" />
                <button
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-xs font-semibold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Result count ────────────────────────────────────────── */}
      {(searchTerm || activeFilterCount > 0) && (
        <p className="text-xs text-charcoal-400 px-1">
          {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''}
          {searchTerm && <> for <span className="font-semibold text-charcoal-600">"{searchTerm}"</span></>}
          {activeFilterCount > 0 && <> with {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}</>}
          {(searchTerm || activeFilterCount > 0) && (
            <button
              onClick={() => { setSearchTerm(''); setFilters({ categoryIds: [], colorIds: [], textureIds: [], finishIds: [], dimensionIds: [], isActive: null, isFeatured: null, specificationRanges: {} }) }}
              className="ml-2 font-semibold text-terracotta hover:text-terracotta-dark transition-colors"
            >
              Clear all
            </button>
          )}
        </p>
      )}

      {/* ── Products (grid or table) ────────────────────────────── */}
      {filteredProducts.length > 0 ? (
        viewMode === 'grid' ? (
          /* ── Grid view ─────────────────────────────────────────── */
          <>
            {/* Select-all strip */}
            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded cursor-pointer accent-terracotta"
              />
              <span className="text-xs text-charcoal-400 font-medium">
                {allSelected ? 'Deselect all' : `Select all (${filteredProducts.length})`}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredProducts.map(product => (
                <AdminGridCard
                  key={product.id}
                  product={product}
                  isSelected={selectedProductIds.includes(product.id)}
                  readonly={readonly}
                  duplicatingId={duplicatingId}
                  onSelect={handleSelectProduct}
                  onDuplicate={handleDuplicate}
                />
              ))}
            </div>
          </>
        ) : (
          /* ── Table / list view ─────────────────────────────────── */
          <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
            <table className="w-full">
              <thead className="bg-cream border-b border-[#E8E0D5]">
                <tr>
                  <th className="pl-6 pr-3 py-4 w-10">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded cursor-pointer accent-terracotta"
                    />
                  </th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-charcoal-400">Product</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-charcoal-400 hidden md:table-cell">Category</th>
                  <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider text-charcoal-400 hidden lg:table-cell">Specifications</th>
                  <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-charcoal-400 pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E0D5]">
                {filteredProducts.map(product => {
                  const primaryImage  = product.images.find((i: any) => i.isPrimary) || product.images[0]
                  const specs         = parseSpecs(product.specifications)
                  const isGroupFormat = specs.length > 0 && Array.isArray(specs[0]?.specifications)
                  const isSelected    = selectedProductIds.includes(product.id)

                  return (
                    <tr
                      key={product.id}
                      className={`transition-colors ${isSelected ? 'bg-terracotta/5' : 'hover:bg-cream/30'}`}
                    >
                      {/* Checkbox */}
                      <td className="pl-6 pr-3 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectProduct(product.id)}
                          className="w-4 h-4 rounded cursor-pointer accent-terracotta"
                        />
                      </td>

                      {/* Product identity */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {product.images.length > 0 ? (
                            <ProductImagePreview imageUrl={primaryImage.url} productName={product.name} />
                          ) : (
                            <div className="w-11 h-11 bg-cream rounded-xl flex items-center justify-center flex-shrink-0 border border-[#E8E0D5]">
                              <Package className="w-5 h-5 text-charcoal-300" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-semibold text-charcoal-900 truncate max-w-[200px]">
                                {product.name}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                                product.isActive ? 'bg-sage/15 text-sage-600' : 'bg-charcoal-100 text-charcoal-400'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${product.isActive ? 'bg-sage-500' : 'bg-charcoal-300'}`} />
                                {product.isActive ? 'Active' : 'Inactive'}
                              </span>
                              {product.isFeatured && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700">
                                  <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                                  Featured
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-charcoal-400 font-mono mt-0.5">{product.sku}</p>
                          </div>
                        </div>
                      </td>

                      {/* Categories */}
                      <td className="px-4 py-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1.5">
                          {product.categories && product.categories.length > 0 ? (
                            product.categories.map((cat: any) => (
                              <span key={cat.categoryId} className="inline-block px-2 py-0.5 bg-terracotta/8 text-terracotta text-[11px] font-semibold rounded-lg">
                                {cat.category?.name}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-charcoal-300">—</span>
                          )}
                        </div>
                      </td>

                      {/* Specifications */}
                      <td className="px-4 py-4 hidden lg:table-cell max-w-[220px]">
                        {isGroupFormat ? (() => {
                          const byKey = new Map<string, { name: string; values: number[]; unit: string }>()
                          for (const g of specs) {
                            for (const s of (g.specifications ?? [])) {
                              if (s.value == null) continue
                              const unit  = s.unit ?? ''
                              const key   = `${s.name}||${unit}`
                              const entry = byKey.get(key)
                              if (entry) entry.values.push(Number(s.value))
                              else byKey.set(key, { name: s.name, values: [Number(s.value)], unit })
                            }
                          }
                          if (byKey.size === 0) return <span className="text-[11px] text-charcoal-300">—</span>
                          return (
                            <div className="space-y-0.5">
                              {Array.from(byKey.values()).map(({ name, values, unit }) => {
                                const min = Math.min(...values); const max = Math.max(...values)
                                const display = min === max ? `${min}${unit ? ` ${unit}` : ''}` : `${min}–${max}${unit ? ` ${unit}` : ''}`
                                return (
                                  <div key={`${name}||${unit}`} className="text-xs text-charcoal-500">
                                    <span className="font-medium text-charcoal-700">{name}:</span>{' '}{display}
                                  </div>
                                )
                              })}
                            </div>
                          )
                        })() : specs.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {specs.map((spec: any, idx: number) => (
                              <span key={idx} className="inline-block px-2 py-0.5 bg-[#E8F8F7] text-[#2A8B86] text-[10px] font-bold rounded">
                                {spec.name}:{' '}{spec.value != null ? `${spec.value} ${spec.unit ?? ''}` : 'N/A'}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-charcoal-300">—</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 pr-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          {(['specification', 'dwg', 'png'] as const).map(type => {
                            const file   = product.files?.find((f: any) => f.type === type)
                            if (!file) return null
                            const icons  = { specification: FileText, dwg: Layers, png: ImageIcon }
                            const colors = { specification: 'text-red-400', dwg: 'text-blue-400', png: 'text-green-500' }
                            const Icon   = icons[type]
                            return (
                              <a key={type} href={file.url} download title={`Download ${type}`}
                                 className={`p-2 ${colors[type]} hover:bg-cream rounded-lg transition-colors`}>
                                <Icon className="w-3.5 h-3.5" />
                              </a>
                            )
                          })}
                          <Link href={`/product/${product.sku}`} target="_blank" title="Preview"
                            className="p-2 text-charcoal-300 hover:text-charcoal-700 hover:bg-cream rounded-lg transition-colors">
                            <Eye className="w-4 h-4" />
                          </Link>
                          {!readonly && (
                            <>
                              <Link href={`/admin/products/${product.id}/edit`} title="Edit"
                                className="p-2 text-terracotta hover:bg-terracotta/8 rounded-lg transition-colors">
                                <Edit2 className="w-4 h-4" />
                              </Link>
                              <button type="button" title="Duplicate"
                                disabled={duplicatingId === product.id}
                                onClick={() => handleDuplicate(product.id)}
                                className="p-2 text-charcoal-300 hover:text-charcoal-700 hover:bg-cream rounded-lg transition-colors disabled:opacity-40 disabled:cursor-wait"
                              >
                                {duplicatingId === product.id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Copy className="w-4 h-4" />
                                }
                              </button>
                              <ProductDeleteButton productId={product.id} productName={product.name} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card">
          <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-5">
              <Package className="w-6 h-6 text-terracotta/40" />
            </div>
            <p className="font-heading text-lg font-bold text-charcoal-900 mb-1">
              {searchTerm || activeFilterCount > 0 ? 'No matching products' : 'No products yet'}
            </p>
            <p className="text-sm text-charcoal-400">
              {searchTerm
                ? `No results for "${searchTerm}"`
                : activeFilterCount > 0
                ? 'Try adjusting your filters'
                : 'Add your first product to get started.'}
            </p>
            {(searchTerm || activeFilterCount > 0) && (
              <button
                onClick={() => { setSearchTerm(''); setFilters({ categoryIds: [], colorIds: [], textureIds: [], finishIds: [], dimensionIds: [], isActive: null, isFeatured: null, specificationRanges: {} }) }}
                className="mt-4 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Batch Edit Dialog ───────────────────────────────────── */}
      {batchEditOpen && (
        <BatchEditDialog
          selectedProductIds={selectedProductIds}
          onSuccess={handleBatchEditSuccess}
          onCancel={() => setBatchEditOpen(false)}
        />
      )}

      {/* ── Delete Confirmation Modal ───────────────────────────── */}
      {deleteConfirmOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 backdrop-blur-sm" onClick={() => setDeleteConfirmOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-xl max-w-md w-full">
              <div className="px-6 py-5 flex items-start gap-4 border-b border-[#E8E0D5]">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-charcoal-900">Delete {selectedProductIds.length} {selectedProductIds.length === 1 ? 'product' : 'products'}?</h2>
                  <p className="text-sm text-charcoal-400 mt-0.5">This action cannot be undone</p>
                </div>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-charcoal-600">
                  All associated data (images, files, attributes) will be permanently removed.
                </p>
              </div>
              <div className="px-6 py-4 flex gap-3 justify-end border-t border-[#E8E0D5]">
                <button
                  onClick={() => setDeleteConfirmOpen(false)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 border border-[#E8E0D5] text-charcoal-600 text-sm font-semibold rounded-xl hover:bg-cream transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBatchDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
                >
                  {isDeleting
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Deleting…</>
                    : 'Delete'
                  }
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
