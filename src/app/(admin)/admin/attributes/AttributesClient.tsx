'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Tag, Palette, Layers, Zap, ArrowRight } from 'lucide-react'

interface PreviewData {
  categories: { id: string; name: string; isActive: boolean }[]
  colors:     { id: string; name: string; hexCode?: string }[]
  textures:   { id: string; name: string; imageUrl?: string }[]
  finishes:   { id: string; name: string }[]
}

const ATTR_CFG = [
  {
    key:         'categories',
    label:       'Categories',
    href:        '/admin/attributes/categories',
    icon:        Tag,
    description: 'Product classification tree',
    accent:      'bg-terracotta/10 text-terracotta',
  },
  {
    key:         'colors',
    label:       'Colors',
    href:        '/admin/attributes/colors',
    icon:        Palette,
    description: 'Colour palette & RAL codes',
    accent:      'bg-amber-50 text-amber-700',
  },
  {
    key:         'textures',
    label:       'Textures',
    href:        '/admin/attributes/textures',
    icon:        Layers,
    description: 'Surface texture finishes',
    accent:      'bg-sage/15 text-sage-600',
  },
  {
    key:         'finishes',
    label:       'Finishes',
    href:        '/admin/attributes/finishes',
    icon:        Zap,
    description: 'Gloss, matte & satin types',
    accent:      'bg-blue-50 text-blue-600',
  },
]

function getArr(d: any): any[] {
  return d?.data || (Array.isArray(d) ? d : [])
}

export default function AttributesClient({ readonly = false }: { readonly?: boolean }) {
  const [preview,  setPreview]  = useState<PreviewData | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/attributes/categories').then(r => r.json()),
      fetch('/api/attributes/colors').then(r => r.json()),
      fetch('/api/attributes/textures').then(r => r.json()),
      fetch('/api/attributes/finishes').then(r => r.json()),
    ]).then(([cats, cols, texs, fins]) => {
      setPreview({
        categories: getArr(cats),
        colors:     getArr(cols),
        textures:   getArr(texs),
        finishes:   getArr(fins),
      })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const totalItems = preview
    ? preview.categories.length + preview.colors.length + preview.textures.length + preview.finishes.length
    : 0

  return (
    <div className="space-y-6">

      {/* ── Header ───────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Admin Portal</p>
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Product Attributes</h1>
          <p className="text-sm text-charcoal-400 mt-1.5">Colors, textures, finishes, categories &amp; dimensions</p>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
          <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
            <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">
              {loading ? '—' : ATTR_CFG.length}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Types</span>
          </div>
          <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-terracotta/8 border border-terracotta/15">
            <span className="font-heading text-2xl font-bold text-terracotta leading-none">
              {loading ? '—' : totalItems}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-terracotta/70 mt-0.5">Total Items</span>
          </div>
        </div>
      </div>

      {/* ── Attribute grid ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {ATTR_CFG.map(cfg => {
          const Icon  = cfg.icon
          const count = preview ? (preview[cfg.key as keyof PreviewData] as any[]).length : 0
          const items =  preview ? (preview[cfg.key as keyof PreviewData] as any[]) : []

          return (
            <Link
              key={cfg.key}
              href={cfg.href}
              className="group relative bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden hover:border-terracotta/30 hover:shadow-warm-sm transition-all duration-200"
            >
              <div className="p-5">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.accent}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-heading text-lg font-bold text-charcoal-900">{cfg.label}</h3>
                      <p className="text-xs text-charcoal-400">{cfg.description}</p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-heading text-3xl font-bold text-charcoal-900 leading-none">
                      {loading ? '—' : count}
                    </span>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Items</p>
                  </div>
                </div>

                {/* Preview content */}
                <div className="min-h-[44px] flex items-center">
                  {loading ? (
                    <div className="flex gap-1.5">
                      {[...Array(6)].map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-lg bg-charcoal-100 animate-pulse" />
                      ))}
                    </div>
                  ) : cfg.key === 'colors' ? (
                    /* Color swatches */
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {items.slice(0, 14).map((c: any) => (
                        <div
                          key={c.id}
                          className="w-7 h-7 rounded-lg border border-black/5 shadow-sm flex-shrink-0"
                          style={{ backgroundColor: c.hexCode }}
                          title={c.name}
                        />
                      ))}
                      {count > 14 && (
                        <span className="text-xs font-semibold text-charcoal-400 ml-1">+{count - 14}</span>
                      )}
                    </div>
                  ) : cfg.key === 'textures' ? (
                    /* Texture thumbnails */
                    <div className="flex items-center gap-2">
                      {items.slice(0, 5).map((t: any) => (
                        <div key={t.id} className="w-10 h-10 rounded-lg border border-[#E8E0D5] bg-cream overflow-hidden flex-shrink-0">
                          {t.imageUrl ? (
                            <img src={t.imageUrl} alt={t.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Layers className="w-4 h-4 text-charcoal-200" />
                            </div>
                          )}
                        </div>
                      ))}
                      {count === 0 && <p className="text-xs text-charcoal-300 italic">No textures yet</p>}
                    </div>
                  ) : cfg.key === 'categories' ? (
                    /* Category pills */
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {items.slice(0, 6).map((c: any) => (
                        <span key={c.id} className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${c.isActive ? 'bg-terracotta/8 text-terracotta' : 'bg-charcoal-100 text-charcoal-400 line-through'}`}>
                          {c.name}
                        </span>
                      ))}
                      {count === 0 && <p className="text-xs text-charcoal-300 italic">No categories yet</p>}
                      {count > 6 && <span className="text-xs font-semibold text-charcoal-400">+{count - 6} more</span>}
                    </div>
                  ) : cfg.key === 'finishes' ? (
                    /* Finish names */
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {items.slice(0, 6).map((f: any) => (
                        <span key={f.id} className="inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-600">
                          {f.name}
                        </span>
                      ))}
                      {count === 0 && <p className="text-xs text-charcoal-300 italic">No finishes yet</p>}
                    </div>
                  ) : null}
                </div>

                {/* Footer arrow */}
                <div className="flex items-center justify-end mt-4">
                  <div className="flex items-center gap-1 text-xs font-semibold text-charcoal-400 group-hover:text-terracotta transition-colors">
                    Manage
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
