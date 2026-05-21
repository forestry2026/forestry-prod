import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  ArrowLeft, Star, FileText, Image as ImageIcon,
  Ruler, Palette, Layers, Sparkles, Download,
} from 'lucide-react'
import { ProductCustomizer } from '@/components/vendor/ProductCustomizer'
import { ProductGallery } from './product-gallery'

export const metadata: Metadata = {
  title: 'Product Details — Forestry Vendor Portal',
}

/* ── Section label ─────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-300 leading-none select-none mb-4">
      {children}
    </p>
  )
}

/* ── Divider ───────────────────────────────────────────────────── */
function Divider() {
  return <div className="h-px bg-[#EDE7DE] my-8" />
}

/* ── File type config ──────────────────────────────────────────── */
function fileConfig(type: string) {
  if (type === 'specification') return { label: 'PDF', sub: 'Specification sheet', color: 'text-rose-600', bg: 'bg-rose-50', icon: FileText }
  if (type === 'dwg')           return { label: 'DWG', sub: 'AutoCAD drawing',     color: 'text-sky-600',  bg: 'bg-sky-50',  icon: Ruler   }
  return                               { label: 'IMG', sub: 'Render / image',       color: 'text-sage-600', bg: 'bg-sage-50', icon: ImageIcon }
}

/* ── Page ──────────────────────────────────────────────────────── */
export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'VENDOR') redirect('/login')

  const { id } = await params

  const product = await prisma.product.findUnique({
    where: { id, isActive: true },
    include: {
      images:     { orderBy: { sortOrder: 'asc' } },
      dimensions: { include: { dimension: true }, orderBy: { dimension: { sortOrder: 'asc' } } },
      colors:     { include: { color: true },     orderBy: { color:     { sortOrder: 'asc' } } },
      textures:   { include: { texture: true },   orderBy: { texture:   { sortOrder: 'asc' } } },
      finishes:   { include: { finish: true },     orderBy: { finish:    { sortOrder: 'asc' } } },
      categories: { include: { category: true } },
      files:      true,
    },
  })

  if (!product) notFound()

  /* ── Specs parsing ─────────────────────────────────────────── */
  let variants: Array<{
    id: string
    name: string
    price: number | null
    specifications: Array<{ name: string; value: number | null; unit?: string }>
  }> = []
  try {
    const parsed: any[] = JSON.parse(product.specifications || '[]')
    variants = parsed
      .filter((g: any) => g.name && Array.isArray(g.specifications))
      .map((g: any) => ({
        id:   g.id ?? g.name,
        name: g.name,
        price: g.price ?? null,
        specifications: g.specifications.map((s: any) => ({
          name:  s.name,
          value: s.value ?? null,
          unit:  s.unit ?? '',
        })),
      }))
  } catch {}

  let flatSpecs: Array<{ name: string; value: string }> = []
  if (variants.length === 0) {
    try {
      const parsed: any[] = JSON.parse(product.specifications || '[]')
      flatSpecs = parsed
        .filter((s: any) => s.value != null)
        .map((s: any) => ({ name: s.name, value: `${s.value}${s.unit ? ' ' + s.unit : ''}` }))
    } catch {}
  }

  const files = ((product as any).files as Array<{
    id: string; type: string; name: string; url: string; size?: number
  }>) ?? []

  const allCategories = product.categories?.map(c => c.category.name) ?? []
  if (allCategories.length === 0 && product.category) allCategories.push(product.category)
  const hasSpecs = flatSpecs.length > 0 || variants.length > 0

  /* ── Attribute counts for summary strip ───────────────────── */
  const attrSummary = [
    product.colors.length    > 0 && { label: 'Colour',    count: product.colors.length,    icon: Palette  },
    product.textures.length  > 0 && { label: 'Texture',   count: product.textures.length,  icon: Layers   },
    product.finishes.length  > 0 && { label: 'Finish',    count: product.finishes.length,  icon: Sparkles },
    product.dimensions.length > 0 && { label: 'Dimension', count: product.dimensions.length, icon: Ruler   },
  ].filter(Boolean) as { label: string; count: number; icon: React.ElementType }[]

  return (
    <div className="min-h-full">

      {/* ── Back nav ─────────────────────────────────────────── */}
      <div className="mb-6">
        <Link
          href="/portal/products"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-charcoal-400 hover:text-terracotta transition-colors group"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
          All Products
        </Link>
      </div>

      {/* ── Main two-column grid ──────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12 items-start">

        {/* ════ LEFT: Gallery ════ */}
        <div className="lg:col-span-1 space-y-5 lg:sticky lg:top-28 lg:h-fit">
          <ProductGallery images={product.images} productName={product.name} />

          {/* Attribute count strip */}
          {attrSummary.length > 0 && (
            <div className="grid grid-cols-2 gap-2">
              {attrSummary.map(({ label, count, icon: Icon }) => (
                <div
                  key={label}
                  className="flex items-center gap-2.5 bg-white border border-[#EDE7DE] rounded-xl px-3.5 py-2.5"
                >
                  <div className="w-7 h-7 rounded-lg bg-terracotta/8 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-terracotta" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-charcoal-900 leading-none">{count}</p>
                    <p className="text-[10px] text-charcoal-400 leading-none mt-0.5">{label}{count !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ════ RIGHT: Info ════ */}
        <div className="lg:col-span-2 space-y-0 min-w-0">

          {/* ── ZONE 1: Identity ─────────────────────────── */}
          <div>
            {/* Category pills */}
            {allCategories.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {allCategories.map(cat => (
                  <span
                    key={cat}
                    className="inline-flex items-center px-2.5 py-1 bg-terracotta/10 text-terracotta text-[11px] font-bold uppercase tracking-wide rounded-full"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}

            {/* Product name */}
            <h1 className="font-heading font-bold text-[32px] leading-[1.15] text-charcoal-900 mb-3">
              {product.name}
            </h1>

            {/* Meta row: SKU + featured */}
            <div className="flex items-center gap-3 mb-4">
              <span className="font-mono text-[11px] text-charcoal-300 bg-charcoal-50 px-2.5 py-1 rounded-lg tracking-wide">
                {product.sku}
              </span>
              {product.isFeatured && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-terracotta">
                  <Star className="w-3 h-3 fill-terracotta" /> Featured
                </span>
              )}
            </div>

            {/* Price */}
            {product.basePrice != null && (
              <div className="inline-flex items-baseline gap-1.5 bg-terracotta text-white px-4 py-2 rounded-xl mb-5">
                <span className="text-[11px] font-semibold opacity-80 tracking-wide uppercase">AED</span>
                <span className="font-heading font-bold text-xl leading-none">
                  {Number(product.basePrice).toLocaleString()}
                </span>
                <span className="text-[11px] opacity-70">base</span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <p className="text-[14px] text-charcoal-500 leading-relaxed max-w-prose">
                {product.description}
              </p>
            )}
          </div>

          <Divider />

          {/* ── ZONE 2: Customizer ───────────────────────── */}
          <div>
            <SectionLabel>Configure your order</SectionLabel>
            <div className="bg-white border border-[#EDE7DE] rounded-2xl overflow-hidden shadow-card">
              <div className="p-6">
                <ProductCustomizer
                  productId={product.id}
                  productName={product.name}
                  vendorId={session.user.vendorProfileId || ''}
                  variants={variants}
                  dimensions={product.dimensions.map(d => ({
                    id:   d.dimensionId,
                    name: d.dimension.name,
                  }))}
                  colors={product.colors.map(c => ({
                    id:      c.colorId,
                    name:    c.color.name,
                    hexCode: c.color.hexCode ?? undefined,
                  }))}
                  textures={product.textures.map(t => ({
                    id:   t.textureId,
                    name: t.texture.name,
                  }))}
                  finishes={product.finishes.map(f => ({
                    id:   f.finishId,
                    name: f.finish.name,
                  }))}
                />
              </div>
            </div>
          </div>

          {/* ── ZONE 3: Specifications ───────────────────── */}
          {hasSpecs && (
            <>
              <Divider />
              <div>
                <SectionLabel>Specifications</SectionLabel>

                {flatSpecs.length > 0 ? (
                  /* Flat specs: clean two-column table rows */
                  <div className="bg-white border border-[#EDE7DE] rounded-2xl overflow-hidden shadow-card">
                    {flatSpecs.map((spec, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between px-5 py-3.5 ${
                          i !== 0 ? 'border-t border-[#EDE7DE]' : ''
                        } ${i % 2 === 1 ? 'bg-cream/40' : 'bg-white'}`}
                      >
                        <span className="text-[12px] font-semibold text-charcoal-400 uppercase tracking-wide">
                          {spec.name}
                        </span>
                        <span className="text-[13px] font-bold text-charcoal-900 font-mono">
                          {spec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  /* Variant table: clean bordered */
                  <div className="bg-white border border-[#EDE7DE] rounded-2xl overflow-hidden shadow-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-[13px]">
                        <thead>
                          <tr className="border-b border-[#EDE7DE] bg-cream/60">
                            <th className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400">
                              Variant
                            </th>
                            {variants[0]?.specifications
                              .filter(s => s.value != null)
                              .map((s, i) => (
                                <th key={i} className="px-5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 whitespace-nowrap">
                                  {s.name}{s.unit ? ` (${s.unit})` : ''}
                                </th>
                              ))}
                            <th className="px-5 py-3 text-right text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400">
                              Price
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {variants.map((v, i) => (
                            <tr
                              key={v.id}
                              className={`border-b border-[#EDE7DE] last:border-0 transition-colors hover:bg-terracotta/4 ${
                                i % 2 === 1 ? 'bg-cream/30' : 'bg-white'
                              }`}
                            >
                              <td className="px-5 py-3.5 font-semibold text-charcoal-900">
                                {v.name}
                              </td>
                              {v.specifications
                                .filter(s => s.value != null)
                                .map((s, j) => (
                                  <td key={j} className="px-5 py-3.5 text-charcoal-600 font-mono">
                                    {s.value}
                                  </td>
                                ))}
                              <td className="px-5 py-3.5 text-right">
                                {v.price != null ? (
                                  <span className="font-bold text-terracotta">
                                    AED {Number(v.price).toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="text-charcoal-300 text-[12px]">On request</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── ZONE 4: Downloads ────────────────────────── */}
          {files.length > 0 && (
            <>
              <Divider />
              <div>
                <SectionLabel>Downloads</SectionLabel>
                <div className="space-y-2">
                  {files.map(file => {
                    const cfg  = fileConfig(file.type)
                    const Icon = cfg.icon
                    const sizeKb = file.size ? Math.round(file.size / 1024) : null
                    return (
                      <a
                        key={file.id}
                        href={file.url}
                        download={file.name}
                        className="group flex items-center gap-4 bg-white border border-[#EDE7DE] rounded-2xl px-5 py-4 hover:border-terracotta/40 hover:shadow-warm-sm transition-all duration-200"
                      >
                        {/* Icon */}
                        <div className={`w-10 h-10 rounded-xl ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-5 h-5 ${cfg.color}`} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-charcoal-900 truncate leading-none mb-0.5">
                            {file.name}
                          </p>
                          <p className="text-[11px] text-charcoal-400">
                            {cfg.sub}{sizeKb ? ` · ${sizeKb} KB` : ''}
                          </p>
                        </div>

                        {/* Badge + download icon */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${cfg.bg} ${cfg.color}`}>
                            {cfg.label}
                          </span>
                          <div className="w-7 h-7 rounded-lg bg-charcoal-50 group-hover:bg-terracotta/10 flex items-center justify-center transition-colors">
                            <Download className="w-3.5 h-3.5 text-charcoal-400 group-hover:text-terracotta transition-colors" />
                          </div>
                        </div>
                      </a>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {/* Bottom padding */}
          <div className="pb-4" />
        </div>
      </div>
    </div>
  )
}
