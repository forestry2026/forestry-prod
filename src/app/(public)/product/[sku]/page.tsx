import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileText, Image as ImageIcon, Layers } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import ProductGallery from './ProductGallery'
import EnquiryConfigurator from './EnquiryConfigurator'

export default async function ProductDetailPage({ params }: { params: Promise<{ sku: string }> }) {
  const { sku } = await params

  const product = await prisma.product.findFirst({
    where: { sku, isActive: true },
    include: {
      images: { orderBy: { sortOrder: 'asc' } },
      colors: { include: { color: true }, orderBy: { color: { sortOrder: 'asc' } } },
      textures: { include: { texture: true }, orderBy: { texture: { sortOrder: 'asc' } } },
      finishes: { include: { finish: true }, orderBy: { finish: { sortOrder: 'asc' } } },
      categories: { include: { category: true } },
      files: true,
    },
  })

  if (!product) notFound()

  // Category display
  const categoryName = product.categories?.[0]?.category?.name ?? product.category ?? null

  // Parse group-format specifications (variants)
  let variants: Array<{
    id: string
    name: string
    price: number | null
    specifications: Array<{ name: string; value: number | null; unit?: string }>
  }> = []
  try {
    const parsed: any[] = JSON.parse(product.specifications || '[]')
    variants = parsed
      .filter((g: any) => g.name)
      .map((g: any) => ({
        id: g.id ?? g.name,
        name: g.name,
        price: g.price ?? null,
        specifications: Array.isArray(g.specifications)
          ? g.specifications.map((s: any) => ({ name: s.name, value: s.value ?? null, unit: s.unit ?? '' }))
          : [],
      }))
  } catch {}

  // Flat spec rows (non-group format) — for the specifications table
  let flatSpecs: Array<{ name: string; value: string }> = []
  if (variants.length === 0) {
    try {
      const parsed: any[] = JSON.parse(product.specifications || '[]')
      flatSpecs = parsed
        .filter((s: any) => s.value != null)
        .map((s: any) => ({ name: s.name, value: `${s.value}${s.unit ? ' ' + s.unit : ''}` }))
    } catch {}
  }

  const colors  = product.colors.map(c => ({ id: c.colorId, name: c.color.name, hexCode: c.color.hexCode }))
  const textures = product.textures.map(t => ({ id: t.textureId, name: t.texture.name, imageUrl: t.texture.imageUrl }))
  const finishes = product.finishes.map(f => ({ id: f.finishId, name: f.finish.name }))
  const files    = (product as any).files as Array<{ id: string; type: string; name: string; url: string; size?: number }> ?? []

  return (
    <div className="min-h-screen bg-cream pb-16 pt-28">

      <div className="max-w-7xl mx-auto px-6">

        {/* Back — inline, not fixed */}
        <Link
          href="/#products"
          className="inline-flex items-center gap-2 text-charcoal-500 hover:text-terracotta font-medium text-sm mb-8 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Products
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* LEFT: Gallery */}
          <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-28 lg:h-fit">
            <ProductGallery
              images={product.images.map(img => ({ url: img.url, alt: img.alt ?? product.name, isPrimary: img.isPrimary }))}
              productName={product.name}
            />
          </div>

          {/* RIGHT: Info */}
          <div className="lg:col-span-2 space-y-8">

            {/* SECTION 1: HEADER */}
            <div className="space-y-4">
              <div>
                {categoryName && (
                  <span className="inline-block badge badge-terra text-xs mb-3">{categoryName}</span>
                )}
                <h1 className="text-4xl font-bold text-charcoal-900 mb-2">{product.name}</h1>
                <p className="text-xs font-mono text-charcoal-400 mb-2">SKU: {product.sku}</p>
                {product.description && (
                  <p className="text-charcoal-600 leading-relaxed">{product.description}</p>
                )}
              </div>
            </div>

            <div className="h-px bg-charcoal-200" />

            {/* SECTION 2: CUSTOMIZATION + BASKET */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-charcoal-900 mb-2">Configure Your Order</h2>
                <p className="text-sm text-charcoal-600">Select your preferred options below</p>
              </div>

              <EnquiryConfigurator
                productId={product.id}
                productSku={product.sku}
                productName={product.name}
                variants={variants}
                colors={colors}
                textures={textures}
                finishes={finishes}
              />
            </div>

            <div className="h-px bg-charcoal-200" />

            {/* SECTION 3: SPECIFICATIONS */}
            {(flatSpecs.length > 0 || variants.length > 0) && (
              <>
                <div className="space-y-3">
                  <h3 className="font-semibold text-charcoal-900 uppercase tracking-wide text-sm">Specifications</h3>

                  {flatSpecs.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3">
                      {flatSpecs.map((spec, i) => (
                        <div key={i} className="bg-white rounded-lg border border-charcoal-100 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <span className="text-xs uppercase tracking-wide text-charcoal-600 font-semibold">{spec.name}</span>
                          <span className="text-sm font-semibold text-charcoal-900">{spec.value}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* Variant-format: show all variants as spec table */
                    <div className="overflow-hidden rounded-lg border border-charcoal-100">
                      <table className="w-full text-sm">
                        <thead className="bg-cream border-b border-charcoal-100">
                          <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-charcoal-600 uppercase tracking-wide">Variant</th>
                            {variants[0]?.specifications.filter(s => s.value != null).map((s, i) => (
                              <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold text-charcoal-600 uppercase tracking-wide">
                                {s.name}{s.unit ? ` (${s.unit})` : ''}
                              </th>
                            ))}
                            <th className="px-4 py-2.5 text-right text-xs font-semibold text-charcoal-600 uppercase tracking-wide">Price</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-charcoal-100">
                          {variants.map((v, i) => (
                            <tr key={v.id} className={i % 2 === 0 ? 'bg-white' : 'bg-cream/30'}>
                              <td className="px-4 py-3 font-semibold text-charcoal-900">{v.name}</td>
                              {v.specifications.filter(s => s.value != null).map((s, j) => (
                                <td key={j} className="px-4 py-3 text-charcoal-700">{s.value}</td>
                              ))}
                              <td className="px-4 py-3 text-right font-semibold text-terra-600">
                                {v.price != null ? `AED ${Number(v.price).toLocaleString()}` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
                <div className="h-px bg-charcoal-200" />
              </>
            )}

            {/* SECTION 4: DOWNLOADS */}
            {files.length > 0 && (
              <>
                <div className="h-px bg-charcoal-200" />
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-charcoal-900 uppercase tracking-wide text-sm mb-1">Download Files</h3>
                    <p className="text-xs text-charcoal-600 mb-3">Technical specifications and drawings</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {files.map(file => {
                      const isSpec = file.type === 'specification'
                      const isDwg  = file.type === 'dwg'
                      const isPng  = file.type === 'png'
                      return (
                        <a
                          key={file.id}
                          href={file.url}
                          download={file.name}
                          className="group bg-white border-2 border-charcoal-200 rounded-lg p-3 hover:border-terra-600 hover:shadow-md transition-all text-center"
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors ${
                            isSpec ? 'bg-red-100 group-hover:bg-red-200' :
                            isDwg  ? 'bg-blue-100 group-hover:bg-blue-200' :
                                     'bg-green-50 group-hover:bg-green-100'
                          }`}>
                            {isSpec && <FileText className="w-5 h-5 text-red-600" />}
                            {isDwg && (
                              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M3 3h18v18H3V3m2 2v14h14V5H5m3 3h2v2H8V8m4 0h2v2h-2V8m4 0h2v2h-2V8m-8 4h2v2H8v-2m4 0h2v2h-2v-2m4 0h2v2h-2v-2" />
                              </svg>
                            )}
                            {isPng && <ImageIcon className="w-5 h-5 text-green-600" />}
                          </div>
                          <h4 className="font-semibold text-charcoal-900 text-xs">
                            {isSpec ? 'PDF' : isDwg ? 'AutoCAD' : 'PNG'}
                          </h4>
                          <p className="text-xs text-charcoal-600 mt-0.5">
                            {isSpec ? 'Specs' : isDwg ? 'DWG' : 'Render'}
                          </p>
                        </a>
                      )
                    })}
                  </div>
                </div>
              </>
            )}

          </div>
        </div>
      </div>
    </div>
  )
}
