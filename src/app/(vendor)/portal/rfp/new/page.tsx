import { Metadata }        from 'next'
import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import Link                 from 'next/link'
import { ArrowLeft, Package, ClipboardList } from 'lucide-react'
import { RfpSubmissionForm } from '@/components/vendor/RfpSubmissionForm'

export const metadata: Metadata = {
  title: 'Submit RFP — Forestry Vendor Portal',
}

export default async function RfpNewPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'VENDOR') redirect('/login')

  const items = await prisma.enquiryItem.findMany({
    where:   { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
  })
  if (items.length === 0) redirect('/portal/enquiry')

  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { userId: session.user.id },
  })
  if (!vendorProfile) redirect('/portal/profile')

  const productIds = [...new Set(items.map(i => i.productId))]
  const products   = await prisma.product.findMany({
    where:  { id: { in: productIds } },
    select: { id: true, name: true, sku: true },
  })
  const productMap = Object.fromEntries(products.map(p => [p.id, p]))

  const totalUnits    = items.reduce((s, i) => s + i.quantity, 0)
  const productCount  = productIds.length

  function detailLine(item: typeof items[0]) {
    const parts: string[] = []
    if (item.variantName)      parts.push(item.variantName)
    else if (item.isCustomSize) parts.push('Custom size')
    if (item.customColorName)
      parts.push(item.customColorName + (item.customColorRal ? ` RAL ${item.customColorRal}` : ''))
    else if (item.customColorHex) parts.push(item.customColorHex)
    if (item.holesOption === 'with_holes')    parts.push('With holes')
    if (item.holesOption === 'without_holes') parts.push('Without holes')
    return parts.join(' · ')
  }

  return (
    <div className="space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-charcoal-400">
        <Link
          href="/portal/enquiry"
          className="inline-flex items-center gap-1.5 hover:text-charcoal-700 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          My Enquiry
        </Link>
        <span className="text-charcoal-300">/</span>
        <span className="text-charcoal-700 font-medium">Submit RFP</span>
      </div>

      {/* ── Step progress bar ── */}
      <div className="flex items-center gap-0">
        {/* Step 1 — done */}
        <div className="flex items-center gap-2.5 px-5 py-3 bg-terracotta/10 border border-terracotta/20 rounded-l-xl">
          <span className="w-6 h-6 rounded-full bg-terracotta flex items-center justify-center flex-shrink-0">
            <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
          <span className="text-xs font-bold text-terracotta">Products Selected</span>
          <span className="text-[10px] text-terracotta/60 font-medium ml-1">{items.length} line{items.length !== 1 ? 's' : ''}</span>
        </div>

        {/* Connector */}
        <div className="w-8 h-px bg-[#E8E0D5] relative flex-shrink-0">
          <div className="absolute inset-y-0 -left-0 -right-0 flex items-center justify-center">
            <svg className="w-3 h-3 text-charcoal-200" viewBox="0 0 12 12" fill="none">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        {/* Step 2 — active */}
        <div className="flex items-center gap-2.5 px-5 py-3 bg-charcoal-900 border border-charcoal-900 rounded-r-xl">
          <span className="w-6 h-6 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
            <span className="text-[10px] font-bold text-white">2</span>
          </span>
          <span className="text-xs font-bold text-white">Project Details</span>
          <span className="text-[10px] text-white/50 font-medium ml-1">current step</span>
        </div>
      </div>

      {/* ── Two-column card ── */}
      <div className="grid grid-cols-5 rounded-2xl overflow-hidden border border-[#E8E0D5] shadow-card-lg">

        {/* ── Left: Order Manifest ── */}
        <div className="col-span-2 flex flex-col" style={{ background: '#F5EFE6' }}>

          {/* Terracotta accent strip */}
          <div className="h-1 bg-terracotta flex-shrink-0" />

          {/* Header */}
          <div className="px-7 pt-7 pb-6 border-b border-[#E2D9CE]">
            <div className="flex items-center gap-2.5 mb-5">
              <div className="w-8 h-8 rounded-lg bg-terracotta/15 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-terracotta" />
              </div>
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-terracotta">Order Manifest</p>
                <p className="text-[10px] text-charcoal-400 font-medium">Review before submitting</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/70 rounded-xl px-4 py-3 border border-[#E2D9CE]">
                <p className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400 mb-1">Products</p>
                <p className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{productCount}</p>
              </div>
              <div className="bg-terracotta/10 rounded-xl px-4 py-3 border border-terracotta/20">
                <p className="text-[9px] font-bold uppercase tracking-wider text-terracotta mb-1">Total Units</p>
                <p className="font-heading text-2xl font-bold text-terracotta leading-none">{totalUnits}</p>
              </div>
            </div>
          </div>

          {/* Item list */}
          <div className="flex-1 px-7 py-5 space-y-0.5 overflow-y-auto">
            {items.map((item, index) => {
              const product = productMap[item.productId]
              const detail  = detailLine(item)
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 py-3 border-b border-[#E2D9CE] last:border-0"
                >
                  {/* Index dot */}
                  <span className="w-5 h-5 rounded-full bg-white border border-[#E2D9CE] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="font-mono text-[9px] font-bold text-charcoal-400 tabular-nums">
                      {index + 1}
                    </span>
                  </span>

                  {/* Name + detail */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-charcoal-900 leading-snug truncate">
                      {product?.name ?? item.productId}
                    </p>
                    {detail && (
                      <p className="text-[11px] text-charcoal-400 mt-0.5 truncate">{detail}</p>
                    )}
                    {product?.sku && (
                      <p className="font-mono text-[9px] text-charcoal-300 mt-0.5">{product.sku}</p>
                    )}
                  </div>

                  {/* Qty badge */}
                  <span className="flex-shrink-0 inline-flex items-center justify-center h-5 min-w-[28px] px-2 rounded-full bg-charcoal-900 text-white text-[10px] font-bold tabular-nums">
                    ×{item.quantity}
                  </span>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-7 h-[72px] flex items-center border-t border-[#E8E0D5] bg-[#EDE4D8]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-charcoal-400" />
                <span className="text-xs text-charcoal-500 font-medium">{items.length} line item{items.length !== 1 ? 's' : ''}</span>
              </div>
              <span className="font-heading text-lg font-bold text-terracotta">{totalUnits} units</span>
            </div>
          </div>

        </div>

        {/* ── Right: Form ── */}
        <div className="col-span-3 bg-white flex flex-col border-l border-[#E8E0D5]">
          <RfpSubmissionForm vendorProfileId={vendorProfile.id} items={items} />
        </div>

      </div>
    </div>
  )
}
