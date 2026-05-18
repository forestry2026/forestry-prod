import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { FileText, ArrowLeft, ShoppingBag } from 'lucide-react'
import { RemoveItemButton } from './RemoveItemButton'
import { TexturePopover }   from '@/components/shared/TexturePopover'

export const metadata: Metadata = {
  title: 'My Enquiry — Forestry Vendor Portal',
}

export default async function EnquiryPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'VENDOR') redirect('/login')

  const items = await prisma.enquiryItem.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })

  const productIds = [...new Set(items.map(i => i.productId))]

  const [products, primaryImages, dims, colors, textures, finishes] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: productIds } } }),

    // Primary image per product
    prisma.productImage.findMany({
      where: { productId: { in: productIds }, isPrimary: true },
    }),

    // Linked attributes
    (() => {
      const ids = items.map(i => i.dimensionId).filter(Boolean) as string[]
      return ids.length ? prisma.dimension.findMany({ where: { id: { in: ids } } }) : Promise.resolve([])
    })(),
    (() => {
      const ids = items.map(i => i.colorId).filter(Boolean) as string[]
      return ids.length ? prisma.color.findMany({ where: { id: { in: ids } } }) : Promise.resolve([])
    })(),
    (() => {
      const ids = items.map(i => i.textureId).filter(Boolean) as string[]
      return ids.length ? prisma.texture.findMany({ where: { id: { in: ids } } }) : Promise.resolve([])
    })(),
    (() => {
      const ids = items.map(i => i.finishId).filter(Boolean) as string[]
      return ids.length ? prisma.finish.findMany({ where: { id: { in: ids } } }) : Promise.resolve([])
    })(),
  ])

  const productMap   = Object.fromEntries(products.map(p => [p.id, p]))
  const imageMap     = Object.fromEntries(primaryImages.map(img => [img.productId, img.url]))
  const dimMap       = Object.fromEntries(dims.map(d => [d.id, d]))
  const colorMap     = Object.fromEntries(colors.map(c => [c.id, c]))
  const textureMap   = Object.fromEntries(textures.map(t => [t.id, t]))
  const finishMap    = Object.fromEntries(finishes.map(f => [f.id, f]))

  /* ── Label helpers ── */
  function sizeLabel(item: typeof items[0]) {
    if (item.variantName) return item.variantName
    if (item.isCustomSize) {
      try {
        const parsed = JSON.parse(item.customDimensions || '[]') as Array<{ label: string; value: string; unit: string }>
        return parsed.map(d => `${d.label}: ${d.value}${d.unit}`).join(', ') || 'Custom'
      } catch { return 'Custom' }
    }
    if (item.dimensionId && dimMap[item.dimensionId]) return dimMap[item.dimensionId].name
    if (item.customWidth) return `${item.customWidth}×${item.customHeight}×${item.customDepth} cm`
    return null
  }

  // Returns { hex, name } or null
  function colorInfo(item: typeof items[0]): { hex: string | null; name: string } | null {
    if (item.customColorHex || item.customColorName) {
      const parts: string[] = []
      if (item.customColorName) parts.push(item.customColorName)
      if (item.customColorRal)  parts.push(`RAL ${item.customColorRal}`)
      return { hex: item.customColorHex ?? null, name: parts.join(' · ') || item.customColorHex || '' }
    }
    if (item.colorId && colorMap[item.colorId]) {
      const c = colorMap[item.colorId]
      return { hex: c.hexCode ?? null, name: c.name }
    }
    return null
  }

  // Returns { imageUrl, name } or null
  function textureInfo(item: typeof items[0]): { imageUrl: string | null; name: string } | null {
    if (item.customTextureUrl) return { imageUrl: item.customTextureUrl, name: 'Custom texture' }
    if (item.textureId && textureMap[item.textureId]) {
      const t = textureMap[item.textureId]
      return { imageUrl: t.imageUrl ?? null, name: t.name }
    }
    return null
  }

  function finishLabel(item: typeof items[0]) {
    if (item.customFinishDesc) return item.customFinishDesc
    if (item.finishId && finishMap[item.finishId]) return finishMap[item.finishId].name
    return null
  }

  const totalUnits   = items.reduce((sum, i) => sum + i.quantity, 0)
  const productTypes = new Set(items.map(i => i.productId)).size
  const lastUpdated  = items.length
    ? new Date(items[items.length - 1].updatedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : null

  async function removeItem(id: string) {
    'use server'
    const sess = await getServerSession(authOptions)
    if (!sess) return
    await prisma.enquiryItem.delete({ where: { id, userId: sess.user.id } })
    revalidatePath('/portal/enquiry')
    revalidatePath('/portal', 'layout')
  }

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <p className="section-label">RFP Basket</p>
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">My Enquiry</h1>
        </div>
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card">
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-6">
              <ShoppingBag className="w-7 h-7 text-terracotta/40" />
            </div>
            <h3 className="font-heading text-xl font-bold text-charcoal-900 mb-2">Your enquiry is empty</h3>
            <p className="text-sm text-charcoal-400 max-w-xs mb-8 leading-relaxed">
              Browse our product catalogue, configure your specifications, and add items here to build your RFP.
            </p>
            <Link href="/portal/products" className="btn-primary">Browse Products</Link>
          </div>
        </div>
      </div>
    )
  }

  /* ── Filled state ── */
  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <p className="section-label mb-0">RFP Basket</p>
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-terracotta text-white text-[10px] font-bold leading-none">
              {items.length}
            </span>
          </div>
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">My Enquiry</h1>
          <p className="text-sm text-charcoal-400 mt-1.5">Review your selection, then submit as an RFP</p>
        </div>
      </div>

      {/* Summary strip */}
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
        <div className="grid grid-cols-3 divide-x divide-[#E8E0D5]">
          <div className="px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-charcoal-400 mb-1.5">Total Units</p>
            <p className="font-heading text-3xl font-bold text-terracotta leading-none">{totalUnits}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-charcoal-400 mb-1.5">Product Types</p>
            <p className="font-heading text-3xl font-bold text-charcoal-900 leading-none">{productTypes}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-charcoal-400 mb-1.5">Last Updated</p>
            <p className="text-sm font-semibold text-charcoal-900 mt-1">{lastUpdated}</p>
          </div>
        </div>
      </div>

      {/* Item cards */}
      <div className="space-y-3">
        {items.map((item, index) => {
          const size    = sizeLabel(item)
          const color   = colorInfo(item)
          const texture = textureInfo(item)
          const finish  = finishLabel(item)
          const imgUrl  = imageMap[item.productId]
          const product = productMap[item.productId]

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden group
                         hover:border-terracotta/30 hover:shadow-warm-sm transition-all duration-200"
            >
              <div className="flex items-stretch">

                {/* Terracotta accent bar */}
                <div className="w-[3px] bg-terracotta/20 group-hover:bg-terracotta transition-colors duration-300 flex-shrink-0" />

                {/* Product image — clicks through to product page */}
                <Link
                  href={`/portal/products/${item.productId}`}
                  className="w-[88px] flex-shrink-0 relative overflow-hidden bg-cream border-r border-[#E8E0D5] cursor-pointer"
                  title={`View ${product?.name ?? 'product'}`}
                >
                  {imgUrl ? (
                    <Image
                      src={imgUrl}
                      alt={product?.name ?? 'Product'}
                      fill
                      sizes="88px"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-110"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-cream">
                      <div className="w-8 h-8 rounded-lg bg-charcoal-100 flex items-center justify-center">
                        <svg className="w-4 h-4 text-charcoal-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {/* Hover overlay hint */}
                  <div className="absolute inset-0 bg-charcoal-900/0 group-hover:bg-charcoal-900/20 transition-colors duration-300 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </Link>

                {/* Card body */}
                <div className="flex-1 px-5 py-4 min-w-0">
                  <div className="flex items-start gap-4">

                    {/* Left: index + name + spec chips */}
                    <div className="flex-1 min-w-0">

                      {/* Product name row */}
                      <div className="flex items-baseline gap-2.5 mb-3">
                        <span className="font-mono text-xs text-charcoal-300 flex-shrink-0 tabular-nums">
                          {String(index + 1).padStart(2, '0')}
                        </span>
                        <h3 className="font-heading font-semibold text-charcoal-900 text-[15px] leading-snug truncate">
                          {product?.name ?? 'Product'}
                        </h3>
                        {product?.sku && (
                          <span className="text-[10px] font-mono text-charcoal-400 flex-shrink-0">{product.sku}</span>
                        )}
                      </div>

                      {/* Spec chips */}
                      <div className="flex flex-wrap items-center gap-2 pl-[26px]">

                        {/* Size */}
                        {size && (
                          <span className="inline-flex items-center gap-1.5 bg-cream rounded-lg px-2.5 py-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Size</span>
                            <span className="text-[11px] font-semibold text-charcoal-700">{size}</span>
                          </span>
                        )}

                        {/* Color — round swatch + name */}
                        {color && (
                          <span className="inline-flex items-center gap-2 bg-cream rounded-lg px-2.5 py-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Colour</span>
                            {color.hex ? (
                              <span
                                className="w-4 h-4 rounded-full border-2 border-white shadow-sm ring-1 ring-black/10 flex-shrink-0"
                                style={{ backgroundColor: color.hex }}
                                title={color.hex}
                              />
                            ) : (
                              <span className="w-4 h-4 rounded-full bg-charcoal-200 flex-shrink-0" />
                            )}
                            <span className="text-[11px] font-semibold text-charcoal-700">{color.name}</span>
                          </span>
                        )}

                        {/* Texture — round image + name */}
                        {texture && (
                          <span className="inline-flex items-center gap-2 bg-cream rounded-lg px-2.5 py-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Texture</span>
                            {texture.imageUrl ? (
                              <TexturePopover imageUrl={texture.imageUrl} name={texture.name} />
                            ) : (
                              <span className="w-4 h-4 rounded-full bg-charcoal-200 flex-shrink-0" />
                            )}
                            <span className="text-[11px] font-semibold text-charcoal-700">{texture.name}</span>
                          </span>
                        )}

                        {/* Finish */}
                        {finish && (
                          <span className="inline-flex items-center gap-1.5 bg-cream rounded-lg px-2.5 py-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Finish</span>
                            <span className="text-[11px] font-semibold text-charcoal-700">{finish}</span>
                          </span>
                        )}

                        {/* Drainage holes */}
                        {item.holesOption && (
                          <span className="inline-flex items-center gap-1.5 bg-cream rounded-lg px-2.5 py-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Drainage</span>
                            <span className="text-[11px] font-semibold text-charcoal-700">
                              {item.holesOption === 'with_holes' ? 'With holes' : 'Without holes'}
                            </span>
                          </span>
                        )}

                        {/* Notes */}
                        {item.notes && (
                          <span className="inline-flex items-center gap-1.5 bg-cream rounded-lg px-2.5 py-1 max-w-[260px]">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400 flex-shrink-0">Note</span>
                            <span className="text-[11px] font-semibold text-charcoal-700 truncate">{item.notes}</span>
                          </span>
                        )}

                      </div>
                    </div>

                    {/* Right: quantity + delete */}
                    <div className="flex items-center gap-4 flex-shrink-0 pl-4 border-l border-[#E8E0D5]">
                      <div className="text-center min-w-[40px]">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400 block mb-0.5">Qty</span>
                        <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">
                          {item.quantity}
                        </span>
                      </div>
                      <RemoveItemButton itemId={item.id} productName={product?.name ?? 'this item'} removeAction={removeItem} />
                    </div>

                  </div>
                </div>

              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom actions */}
      <div className="flex items-center justify-between pt-6 border-t border-[#E8E0D5]">
        <Link href="/portal/products" className="btn-ghost inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
        <Link href="/portal/rfp/new" className="btn-primary inline-flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Submit RFP Now
        </Link>
      </div>

    </div>
  )
}
