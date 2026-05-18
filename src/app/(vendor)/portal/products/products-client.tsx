'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import Link from 'next/link'
import {
  Search, X, Package, SlidersHorizontal,
  Grid3X3, List, ChevronRight, Star, ChevronDown,
} from 'lucide-react'

/* ── Sort Dropdown ──────────────────────────────────────────────── */
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
        className="flex items-center gap-2 px-3 py-2.5 bg-white border border-[#E8E0D5] rounded-xl shadow-card hover:border-terracotta/40 transition-colors text-[13px] font-medium text-charcoal-700 whitespace-nowrap"
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
import { FilterSidebar } from '@/components/admin/FilterSidebar'

/* ── Types ──────────────────────────────────────────────────────── */
interface Product {
  id:          string
  name:        string
  sku:         string
  category:    string | null
  basePrice:   number | null
  isFeatured?: boolean
  images:      Array<{ id: string; url: string; isPrimary: boolean }>
  dimensions:  Array<{ id?: string; dimension: { id: string; name: string; label?: string } }>
  colors:      Array<{ colorId?: string; color?: { id: string; name: string; hexCode?: string | null } }>
  textures?:   Array<{ textureId?: string; texture?: { id: string; name: string } }>
  finishes?:   Array<{ finishId?: string; finish?: { id: string; name: string } }>
  categories?: Array<{ categoryId: string; category: { id: string; name: string } }>
  specifications?: string
}

interface CategoryOption { id: string; name: string }

interface VendorFilters {
  categoryIds:         string[]
  colorIds:            string[]
  textureIds:          string[]
  finishIds:           string[]
  dimensionIds:        string[]
  isActive:            boolean | null
  isFeatured:          boolean | null
  specificationRanges: Record<string, { min: number; max: number }>
}

interface Props {
  products:          Product[]
  categories:        CategoryOption[]
  initialSearch:     string
  initialCategoryId: string
}

type SortKey  = 'newest' | 'name-asc' | 'name-desc' | 'featured'
type ViewMode = 'grid' | 'list'

const ITEMS_PER_PAGE = 20

const DEFAULT_FILTERS: VendorFilters = {
  categoryIds: [], colorIds: [], textureIds: [],
  finishIds: [], dimensionIds: [],
  isActive: null, isFeatured: null,
  specificationRanges: {},
}

/* ── Helpers ────────────────────────────────────────────────────── */
function getCategories(p: Product): string[] {
  if (p.categories?.length) return p.categories.map(c => c.category.name)
  if (p.category) return [p.category]
  return []
}
function getPrimaryImage(p: Product): string | undefined {
  return (p.images.find(i => i.isPrimary) ?? p.images[0])?.url
}
function countActiveFilters(f: VendorFilters, search: string): number {
  return (
    f.categoryIds.length + f.colorIds.length + f.textureIds.length +
    f.finishIds.length + f.dimensionIds.length +
    (f.isFeatured !== null ? 1 : 0) +
    Object.keys(f.specificationRanges).length +
    (search ? 1 : 0)
  )
}

/* ── Product Image ──────────────────────────────────────────────── */
function ProductImg({ src, alt }: { src?: string; alt: string }) {
  const [err, setErr] = useState(false)
  if (!src || err) return (
    <div className="w-full h-full bg-cream-dark flex items-center justify-center">
      <Package className="w-10 h-10 text-charcoal-200" />
    </div>
  )
  return (
    <img src={src} alt={alt}
      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
      onError={() => setErr(true)}
    />
  )
}

/* ── Grid Card ──────────────────────────────────────────────────── */
function GridCard({ product }: { product: Product }) {
  const cats   = getCategories(product)
  const colors = product.colors.filter(c => c.color?.hexCode).slice(0, 5)

  return (
    <Link
      href={`/portal/products/${product.id}`}
      className="group relative bg-white rounded-2xl border border-[#E8E0D5] overflow-hidden hover:border-terracotta/50 hover:shadow-warm transition-all duration-300 flex flex-col"
    >
      <div className="relative aspect-square overflow-hidden bg-cream-dark">
        <ProductImg src={getPrimaryImage(product)} alt={product.name} />
        {product.isFeatured && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 bg-terracotta text-white rounded-full text-[10px] font-bold shadow-sm">
            <Star className="w-2.5 h-2.5 fill-white" /> Featured
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 px-3 pb-3 pt-8 bg-gradient-to-t from-charcoal-900/75 to-transparent">
          <span className="flex items-center justify-center gap-1.5 w-full py-2 bg-white/95 text-charcoal-900 text-xs font-bold rounded-xl">
            View Product <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-3.5 gap-2">
        {cats.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {cats.slice(0, 2).map(c => (
              <span key={c} className="px-2 py-0.5 bg-terracotta/8 text-terracotta text-[10px] font-bold uppercase tracking-wide rounded-full">{c}</span>
            ))}
          </div>
        )}
        <h3 className="font-heading font-bold text-[14px] text-charcoal-900 leading-snug line-clamp-2 group-hover:text-terracotta transition-colors">
          {product.name}
        </h3>
        <p className="font-mono text-[11px] text-charcoal-300">{product.sku}</p>
        {colors.length > 0 && (
          <div className="flex items-center gap-1 mt-auto">
            {colors.map((c, i) => (
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
        <div className="flex items-center justify-between pt-2 border-t border-[#F0EBE1] mt-auto">
          {product.basePrice ? (
            <span className="font-heading font-bold text-terracotta text-sm">AED {product.basePrice.toLocaleString()}</span>
          ) : (
            <span className="text-[11px] text-charcoal-300 italic">Price on request</span>
          )}
          {product.dimensions.length > 0 && (
            <span className="text-[10px] text-charcoal-400 font-medium bg-charcoal-50 px-1.5 py-0.5 rounded-lg">
              {product.dimensions.length} size{product.dimensions.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

/* ── List Row ───────────────────────────────────────────────────── */
function ListRow({ product }: { product: Product }) {
  const cats   = getCategories(product)
  const colors = product.colors.filter(c => c.color?.hexCode).slice(0, 6)

  return (
    <Link
      href={`/portal/products/${product.id}`}
      className="group flex items-center gap-4 bg-white rounded-2xl border border-[#E8E0D5] p-3.5 hover:border-terracotta/50 hover:shadow-warm-sm transition-all duration-200"
    >
      <div className="w-16 h-16 rounded-xl overflow-hidden bg-cream-dark flex-shrink-0">
        <ProductImg src={getPrimaryImage(product)} alt={product.name} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-heading font-bold text-[14px] text-charcoal-900 group-hover:text-terracotta transition-colors truncate">
            {product.name}
          </h3>
          {product.isFeatured && (
            <span className="flex-shrink-0 flex items-center gap-1 px-1.5 py-0.5 bg-terracotta/10 text-terracotta rounded-full text-[9px] font-bold">
              <Star className="w-2 h-2 fill-terracotta" /> Featured
            </span>
          )}
        </div>
        <p className="font-mono text-[11px] text-charcoal-300 mb-1.5">{product.sku}</p>
        <div className="flex items-center gap-1.5">
          {cats.slice(0, 2).map(c => (
            <span key={c} className="px-2 py-0.5 bg-terracotta/8 text-terracotta text-[10px] font-bold uppercase tracking-wide rounded-full">{c}</span>
          ))}
          {colors.length > 0 && (
            <div className="flex items-center gap-0.5 ml-1">
              {colors.map((c, i) => (
                <span key={i} title={c.color?.name}
                  className="w-3 h-3 rounded-full border border-white shadow-sm ring-1 ring-charcoal-100"
                  style={{ backgroundColor: c.color?.hexCode ?? '#ccc' }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex-shrink-0 text-right">
        {product.basePrice ? (
          <p className="font-heading font-bold text-terracotta text-sm">AED {product.basePrice.toLocaleString()}</p>
        ) : (
          <p className="text-[11px] text-charcoal-300 italic">Price on request</p>
        )}
        {product.dimensions.length > 0 && (
          <p className="text-[10px] text-charcoal-400 mt-0.5">{product.dimensions.length} sizes</p>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-charcoal-200 group-hover:text-terracotta flex-shrink-0 transition-colors" />
    </Link>
  )
}

/* ── Main ───────────────────────────────────────────────────────── */
export default function ProductsCatalogueClient({
  products, categories, initialSearch = '', initialCategoryId = '',
}: Props) {
  const [search,     setSearch]     = useState(initialSearch)
  const [filters,    setFilters]    = useState<VendorFilters>({
    ...DEFAULT_FILTERS,
    categoryIds: initialCategoryId ? [initialCategoryId] : [],
  })
  const [sort,       setSort]       = useState<SortKey>('newest')
  const [view,       setView]       = useState<ViewMode>('grid')
  const [page,       setPage]       = useState(1)
  const [drawerOpen, setDrawerOpen] = useState(false)

  /* ── Filter + sort ─────────────────────────── */
  const filtered = useMemo(() => {
    let r = products

    // Search
    if (search.trim()) {
      const q = search.toLowerCase()
      r = r.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        getCategories(p).some(c => c.toLowerCase().includes(q))
      )
    }

    // Categories
    if (filters.categoryIds.length)
      r = r.filter(p => p.categories?.some(c => filters.categoryIds.includes(c.categoryId)))

    // Colors
    if (filters.colorIds.length)
      r = r.filter(p => p.colors.some(c => c.color && filters.colorIds.includes(c.color.id)))

    // Textures
    if (filters.textureIds.length)
      r = r.filter(p => p.textures?.some(t => t.texture && filters.textureIds.includes(t.texture.id)))

    // Finishes
    if (filters.finishIds.length)
      r = r.filter(p => p.finishes?.some(f => f.finish && filters.finishIds.includes(f.finish.id)))

    // Dimensions
    if (filters.dimensionIds.length)
      r = r.filter(p => p.dimensions.some(d => filters.dimensionIds.includes(d.dimension.id)))

    // Featured
    if (filters.isFeatured === true)  r = r.filter(p => p.isFeatured)
    if (filters.isFeatured === false) r = r.filter(p => !p.isFeatured)

    // Specification ranges
    if (Object.keys(filters.specificationRanges).length) {
      r = r.filter(p => {
        try {
          const specs = JSON.parse(p.specifications || '[]')
          for (const [specId, range] of Object.entries(filters.specificationRanges)) {
            const flat: any[] = []
            specs.forEach((s: any) => Array.isArray(s.specifications) ? flat.push(...s.specifications) : flat.push(s))
            const spec = flat.find((s: any) => s.id === specId)
            if (spec?.value != null && (spec.value < range.min || spec.value > range.max)) return false
          }
        } catch { /* skip */ }
        return true
      })
    }

    // Sort
    switch (sort) {
      case 'name-asc':  r = [...r].sort((a, b) => a.name.localeCompare(b.name)); break
      case 'name-desc': r = [...r].sort((a, b) => b.name.localeCompare(a.name)); break
      case 'featured':  r = [...r].sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0)); break
    }

    return r
  }, [products, search, filters, sort])

  const totalPages     = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paged          = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const activeCount    = countActiveFilters(filters, search)
  const hasFilters     = activeCount > 0

  function clearAll() {
    setSearch('')
    setFilters(DEFAULT_FILTERS)
    setPage(1)
  }

  function handleFiltersChange(f: VendorFilters) {
    setFilters(f)
    setPage(1)
  }

  return (
    <div className="space-y-4">

      {/* ── Page Header ──────────────────────────── */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-heading font-bold text-2xl text-charcoal-900">Products</h1>
          <p className="text-[13px] text-charcoal-400 mt-0.5">
            {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex bg-white border border-[#E8E0D5] rounded-xl overflow-hidden shadow-card">
          <button onClick={() => setView('grid')}
            className={`p-2.5 transition-colors ${view === 'grid' ? 'bg-terracotta/10 text-terracotta' : 'text-charcoal-300 hover:bg-cream'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setView('list')}
            className={`p-2.5 transition-colors ${view === 'list' ? 'bg-terracotta/10 text-terracotta' : 'text-charcoal-300 hover:bg-cream'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Filter Bar ───────────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Search products…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-8 py-2.5 text-[13px] bg-white border border-[#E8E0D5] rounded-xl text-charcoal-900 placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta/50 shadow-card transition-all"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-charcoal-300 hover:text-charcoal-700">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters button → opens right drawer */}
        <button
          onClick={() => setDrawerOpen(true)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[13px] font-semibold transition-all shadow-card ${
            activeCount > 0
              ? 'bg-terracotta text-white border-terracotta'
              : 'bg-white text-charcoal-700 border-[#E8E0D5] hover:border-terracotta/40'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-white/25 text-white text-[10px] font-bold flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </button>

        {/* Sort */}
        <SortDropdown value={sort} onChange={setSort} />
      </div>

      {/* ── Active Filter Chips ───────────────────── */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {search && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-terracotta/10 text-terracotta text-[12px] font-semibold rounded-full">
              "{search}" <button onClick={() => setSearch('')}><X className="w-3 h-3" /></button>
            </span>
          )}
          {filters.categoryIds.map(id => (
            <span key={id} className="flex items-center gap-1.5 px-3 py-1.5 bg-terracotta/10 text-terracotta text-[12px] font-semibold rounded-full">
              {categories.find(c => c.id === id)?.name ?? id}
              <button onClick={() => handleFiltersChange({ ...filters, categoryIds: filters.categoryIds.filter(x => x !== id) })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {filters.isFeatured === true && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-terracotta/10 text-terracotta text-[12px] font-semibold rounded-full">
              Featured <button onClick={() => handleFiltersChange({ ...filters, isFeatured: null })}><X className="w-3 h-3" /></button>
            </span>
          )}
          {(filters.colorIds.length > 0 || filters.textureIds.length > 0 || filters.finishIds.length > 0 || filters.dimensionIds.length > 0) && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-terracotta/10 text-terracotta text-[12px] font-semibold rounded-full">
              {filters.colorIds.length + filters.textureIds.length + filters.finishIds.length + filters.dimensionIds.length} attribute filter{filters.colorIds.length + filters.textureIds.length + filters.finishIds.length + filters.dimensionIds.length !== 1 ? 's' : ''}
              <button onClick={() => handleFiltersChange({ ...filters, colorIds: [], textureIds: [], finishIds: [], dimensionIds: [] })}><X className="w-3 h-3" /></button>
            </span>
          )}
          <button onClick={clearAll} className="text-[12px] text-charcoal-400 hover:text-charcoal-700 font-medium hover:underline underline-offset-2">
            Clear all
          </button>
        </div>
      )}

      {/* ── Empty State ──────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-[#E8E0D5]">
          <div className="w-14 h-14 rounded-2xl bg-cream-dark flex items-center justify-center mb-4">
            <Package className="w-7 h-7 text-charcoal-200" />
          </div>
          <h3 className="font-heading font-bold text-lg text-charcoal-900 mb-1.5">No products found</h3>
          <p className="text-[13px] text-charcoal-400 max-w-xs text-center mb-5">
            Try adjusting your search or clearing the active filters.
          </p>
          {hasFilters && (
            <button onClick={clearAll}
              className="px-5 py-2.5 bg-terracotta text-white text-[13px] font-bold rounded-xl hover:bg-terracotta-dark transition-colors">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {view === 'grid' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {paged.map(p => <GridCard key={p.id} product={p} />)}
            </div>
          )}
          {view === 'list' && (
            <div className="space-y-2.5">
              {paged.map(p => <ListRow key={p.id} product={p} />)}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-6 border-t border-[#E8E0D5]">
              <p className="text-[13px] text-charcoal-400">
                {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-[13px] font-medium text-charcoal-600 border border-[#E8E0D5] rounded-xl disabled:opacity-40 hover:bg-cream transition-colors">
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, page - 3), Math.min(totalPages, page + 2))
                  .map(n => (
                    <button key={n} onClick={() => setPage(n)}
                      className={`w-9 h-9 text-[13px] font-semibold rounded-xl transition-colors ${
                        n === page ? 'bg-terracotta text-white' : 'text-charcoal-600 border border-[#E8E0D5] hover:bg-cream'
                      }`}>{n}
                    </button>
                  ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-[13px] font-medium text-charcoal-600 border border-[#E8E0D5] rounded-xl disabled:opacity-40 hover:bg-cream transition-colors">
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Right-slide Filter Drawer ─────────────── */}
      <FilterSidebar
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
        products={products}
        categories={categories}
      />
    </div>
  )
}
