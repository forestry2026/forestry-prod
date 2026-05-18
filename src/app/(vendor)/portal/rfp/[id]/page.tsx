import { Metadata }          from 'next'
import { getServerSession }  from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions }        from '@/lib/auth'
import { prisma }             from '@/lib/prisma'
import Link                   from 'next/link'
import { ArrowLeft, MapPin, Building2, Truck, StickyNote, Clock, Package } from 'lucide-react'
import { StatusTimeline }        from '@/components/rfps/StatusTimeline'
import { QuotationView }         from '@/components/rfps/QuotationView'
import { WithdrawRfpButton }     from '@/components/vendor/WithdrawRfpButton'
import { VendorDeleteRfpButton } from '@/components/vendor/VendorDeleteRfpButton'
import { VendorQuotePdfButton }  from '@/components/vendor/VendorQuotePdfButton'
import { logoToDataUrl }         from '@/lib/logoUtils'

export const metadata: Metadata = { title: 'RFP Details — Forestry Vendor Portal' }

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  DRAFT:         { label: 'Draft',         color: 'bg-charcoal-100  text-charcoal-600' },
  SUBMITTED:     { label: 'Submitted',     color: 'bg-blue-100      text-blue-700' },
  PENDING:       { label: 'Pending',       color: 'bg-yellow-100    text-yellow-700' },
  UNDER_REVIEW:  { label: 'Under Review',  color: 'bg-yellow-100    text-yellow-700' },
  QUOTED:        { label: 'Quoted',        color: 'bg-sage/20       text-sage-600' },
  APPROVED:      { label: 'Approved',      color: 'bg-green-100     text-green-700' },
  ACCEPTED:      { label: 'Accepted',      color: 'bg-green-100     text-green-700' },
  IN_PRODUCTION: { label: 'In Production', color: 'bg-blue-100      text-blue-700' },
  COMPLETED:     { label: 'Completed',     color: 'bg-green-100     text-green-700' },
  REJECTED:      { label: 'Rejected',      color: 'bg-red-100       text-red-700' },
  CANCELLED:     { label: 'Withdrawn',     color: 'bg-charcoal-100  text-charcoal-500' },
}

const QUOTED_OR_LATER  = ['QUOTED', 'APPROVED', 'ACCEPTED', 'IN_PRODUCTION', 'COMPLETED']
const WITHDRAWABLE     = ['SUBMITTED', 'PENDING']
const DELETABLE        = ['DRAFT', 'CANCELLED', 'REJECTED']

/* Resolve size label from item fields */
function sizeLabel(item: any): string | null {
  if (item.variantName)   return item.variantName
  if (item.isCustomSize) {
    try {
      const dims = JSON.parse(item.customDimensions || '[]') as Array<{ label: string; value: string; unit: string }>
      return dims.map(d => `${d.label}: ${d.value}${d.unit}`).join(', ') || 'Custom'
    } catch { return 'Custom' }
  }
  if (item.dimension?.name)  return item.dimension.name
  if (item.customWidth)      return `${item.customWidth}×${item.customHeight}×${item.customDepth} cm`
  return null
}

function colorLabel(item: any): { hex: string | null; name: string } | null {
  if (item.customColorName || item.customColorHex) {
    const parts: string[] = []
    if (item.customColorName) parts.push(item.customColorName)
    if (item.customColorRal)  parts.push(`RAL ${item.customColorRal}`)
    return { hex: item.customColorHex ?? null, name: parts.join(' · ') || item.customColorHex || '' }
  }
  if (item.color?.name) return { hex: item.color.hexCode ?? null, name: item.color.name }
  return null
}

function textureLabel(item: any): string | null {
  if (item.customTextureUrl) return 'Custom texture'
  if (item.texture?.name)    return item.texture.name
  return null
}

function finishLabel(item: any): string | null {
  if (item.customFinishDesc) return item.customFinishDesc
  if (item.finish?.name)     return item.finish.name
  return null
}

export default async function RfpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'VENDOR') redirect('/login')

  const { id } = await params

  const brandLogoSetting = await prisma.siteSetting.findUnique({ where: { key: 'logoUrl' } })

  const rfp = await prisma.rfp.findUnique({
    where: { id },
    include: {
      items: { include: { product: { include: { images: { where: { isPrimary: true }, take: 1 } } }, dimension: true, color: true, texture: true, finish: true } },
      vendorProfile: { include: { user: true } },
      quotes: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!rfp) notFound()
  if (rfp.vendorProfile.user.id !== session.user.id) redirect('/portal/rfp/history')

  const [brandLogoDataUrl, vendorLogoDataUrl] = await Promise.all([
    logoToDataUrl(brandLogoSetting?.value),
    logoToDataUrl(rfp.vendorProfile.logoUrl),
  ])

  const latestQuote      = rfp.quotes[0] ?? null
  const showQuotation    = latestQuote && QUOTED_OR_LATER.includes(rfp.status)
  const canWithdraw      = WITHDRAWABLE.includes(rfp.status)
  const canDelete        = DELETABLE.includes(rfp.status)
  const totalUnits       = rfp.items.reduce((s, i) => s + i.quantity, 0)
  const statusMeta       = STATUS_LABEL[rfp.status] ?? { label: rfp.status, color: 'bg-charcoal-100 text-charcoal-600' }
  const hasProjectInfo   = rfp.projectName || rfp.projectLocation || rfp.deliveryAddress || rfp.notes

  return (
    <div className="space-y-5">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-charcoal-400">
        <Link href="/portal/rfp/history" className="inline-flex items-center gap-1.5 hover:text-charcoal-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          RFP History
        </Link>
        <span className="text-charcoal-300">/</span>
        <span className="font-mono text-charcoal-700 font-medium">{rfp.rfpNumber}</span>
        {(canWithdraw || canDelete) && (
          <div className="ml-auto flex items-center gap-1">
            {canWithdraw && <WithdrawRfpButton rfpId={rfp.id} rfpNumber={rfp.rfpNumber} />}
            {canDelete   && <VendorDeleteRfpButton rfpId={rfp.id} rfpNumber={rfp.rfpNumber} />}
          </div>
        )}
      </div>

      {/* ── Main two-column card ── */}
      <div className="grid grid-cols-5 rounded-2xl overflow-hidden border border-[#E8E0D5] shadow-card-lg">

        {/* Left: warm meta panel */}
        <div className="col-span-2 bg-cream-dark flex flex-col">

          {/* Header */}
          <div className="px-8 pt-8 pb-6 border-b border-[#E8E0D5]">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-3">
              Request for Proposal
            </p>
            <h1 className="font-heading text-3xl font-bold text-charcoal-900 leading-tight tracking-tight">
              {rfp.rfpNumber}
            </h1>
            {rfp.projectName && (
              <p className="text-sm text-charcoal-500 mt-1.5 font-medium">{rfp.projectName}</p>
            )}

            {/* Status badge */}
            <div className="mt-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusMeta.color}`}>
                {statusMeta.label}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 divide-x divide-[#E8E0D5] border-b border-[#E8E0D5]">
            <div className="px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-charcoal-400 mb-1">Lines</p>
              <p className="font-heading text-3xl font-bold text-charcoal-900 leading-none">{rfp.items.length}</p>
            </div>
            <div className="px-6 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-charcoal-400 mb-1">Units</p>
              <p className="font-heading text-3xl font-bold text-terracotta leading-none">{totalUnits}</p>
            </div>
          </div>

          {/* Project meta */}
          <div className="px-8 py-6 space-y-4 flex-1">
            {rfp.projectName && (
              <div className="flex items-start gap-2.5">
                <Building2 className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 mb-0.5">Project</p>
                  <p className="text-sm text-charcoal-700 font-medium">{rfp.projectName}</p>
                </div>
              </div>
            )}
            {rfp.projectLocation && (
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 mb-0.5">Location</p>
                  <p className="text-sm text-charcoal-700">{rfp.projectLocation}</p>
                </div>
              </div>
            )}
            {rfp.deliveryAddress && (
              <div className="flex items-start gap-2.5">
                <Truck className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 mb-0.5">Delivery</p>
                  <p className="text-sm text-charcoal-700 leading-relaxed">{rfp.deliveryAddress}</p>
                </div>
              </div>
            )}
            {rfp.notes && (
              <div className="flex items-start gap-2.5">
                <StickyNote className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 mb-0.5">Notes</p>
                  <p className="text-sm text-charcoal-700 leading-relaxed">{rfp.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer date */}
          <div className="px-8 py-5 border-t border-[#E8E0D5] bg-cream-darker/40 flex items-center gap-2.5">
            <Clock className="w-3.5 h-3.5 text-charcoal-300" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">Submitted</p>
              <p className="text-xs text-charcoal-600 font-medium">
                {rfp.submittedAt
                  ? new Date(rfp.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>

        </div>

        {/* Right: timeline + items */}
        <div className="col-span-3 bg-white flex flex-col">

          {/* Timeline */}
          <div className="px-8 pt-7 pb-6 border-b border-[#E8E0D5]">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-4">Progress</p>
            <StatusTimeline
              currentStatus={rfp.status}
              dates={{
                SUBMITTED:     rfp.submittedAt          ?? undefined,
                UNDER_REVIEW:  rfp.submittedAt          ?? undefined,
                QUOTED:        rfp.quotationSentAt      ?? undefined,
                APPROVED:      rfp.respondedAt          ?? undefined,
                IN_PRODUCTION: rfp.productionStartedAt  ?? undefined,
                COMPLETED:     rfp.completedAt          ?? undefined,
              }}
            />
          </div>

          {/* Items */}
          <div className="flex-1 px-8 py-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-4">Items Requested</p>
            <div className="space-y-2.5">
              {rfp.items.map((item, index) => {
                const size    = sizeLabel(item)
                const color   = colorLabel(item)
                const texture = textureLabel(item)
                const finish  = finishLabel(item)

                const imageUrl = item.product?.images?.[0]?.url ?? null

                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 py-3.5 px-4 rounded-xl bg-cream/60 border border-[#E8E0D5] hover:border-terracotta/20 transition-colors"
                  >
                    {/* Product thumbnail */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden border border-[#E8E0D5] bg-white">
                      {imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-4 h-4 text-charcoal-200" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-charcoal-900 text-[14px] leading-snug truncate">
                        {item.product?.name ?? item.productName ?? item.productId ?? '—'}
                      </p>
                      {item.product?.sku && (
                        <p className="font-mono text-[10px] text-charcoal-300 mt-0.5">{item.product.sku}</p>
                      )}
                      {/* Spec chips */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {size && (
                          <span className="inline-flex items-center gap-1 bg-white rounded-md px-2 py-0.5 border border-[#E8E0D5]">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Size</span>
                            <span className="text-[10px] font-semibold text-charcoal-700">{size}</span>
                          </span>
                        )}
                        {color && (
                          <span className="inline-flex items-center gap-1.5 bg-white rounded-md px-2 py-0.5 border border-[#E8E0D5]">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Colour</span>
                            {color.hex && (
                              <span className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0"
                                style={{ backgroundColor: color.hex }} />
                            )}
                            <span className="text-[10px] font-semibold text-charcoal-700">{color.name}</span>
                          </span>
                        )}
                        {texture && (
                          <span className="inline-flex items-center gap-1 bg-white rounded-md px-2 py-0.5 border border-[#E8E0D5]">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Texture</span>
                            <span className="text-[10px] font-semibold text-charcoal-700">{texture}</span>
                          </span>
                        )}
                        {finish && (
                          <span className="inline-flex items-center gap-1 bg-white rounded-md px-2 py-0.5 border border-[#E8E0D5]">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Finish</span>
                            <span className="text-[10px] font-semibold text-charcoal-700">{finish}</span>
                          </span>
                        )}
                        {item.holesOption && (
                          <span className="inline-flex items-center gap-1 bg-white rounded-md px-2 py-0.5 border border-[#E8E0D5]">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Drainage</span>
                            <span className="text-[10px] font-semibold text-charcoal-700">
                              {item.holesOption === 'with_holes' ? 'With holes' : 'Without holes'}
                            </span>
                          </span>
                        )}
                        {item.notes && (
                          <span className="inline-flex items-center gap-1 bg-white rounded-md px-2 py-0.5 border border-[#E8E0D5] max-w-[200px]">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400 flex-shrink-0">Note</span>
                            <span className="text-[10px] font-semibold text-charcoal-700 truncate">{item.notes}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="flex-shrink-0 inline-flex items-center justify-center h-7 min-w-[28px] px-2 rounded-lg bg-terracotta/10 text-terracotta border border-terracotta/15 text-xs font-bold tabular-nums">
                      ×{item.quantity}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Awaiting quote state */}
          {!showQuotation && rfp.quotes.length === 0 && (
            <div className="mx-8 mb-8 rounded-2xl border border-[#E8E0D5] overflow-hidden">
              {/* Status strip */}
              <div className="bg-[#2D2926] px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Your enquiry has been received</p>
                  <p className="text-[11px] text-white/50 mt-0.5">Reference: {rfp.rfpNumber}</p>
                </div>
              </div>

              {/* Steps */}
              <div className="bg-cream/40 px-6 py-5">
                <p className="text-[9px] font-bold tracking-[0.18em] uppercase text-charcoal-400 mb-4">What happens now</p>
                <div className="space-y-3.5">
                  {[
                    { done: true,  label: 'Enquiry submitted',           desc: 'Your request has been logged and is in our system.' },
                    { done: rfp.status === 'UNDER_REVIEW', label: 'Team review in progress', desc: 'Our team checks specifications, availability, and lead times.' },
                    { done: false, label: 'Quote sent to you',           desc: 'We\'ll email you a detailed quote — usually within 24 hours.' },
                    { done: false, label: 'You accept or request changes',desc: 'Review pricing, approve to begin production, or ask for a revision.' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={[
                        'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border-2',
                        item.done
                          ? 'bg-terracotta border-terracotta'
                          : 'bg-white border-[#E8E0D5]',
                      ].join(' ')}>
                        {item.done ? (
                          <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#E8E0D5]" />
                        )}
                      </div>
                      <div>
                        <p className={`text-xs font-semibold leading-none ${item.done ? 'text-charcoal-800' : 'text-charcoal-400'}`}>
                          {item.label}
                        </p>
                        <p className="text-[11px] text-charcoal-400 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-charcoal-400 mt-5 pt-4 border-t border-[#E8E0D5]">
                  Questions? Email <span className="font-semibold text-terracotta">hello@forestry.ae</span> with your reference number.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Quotation section — shown below when status is QUOTED or later */}
      {showQuotation && (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
          <div className="px-8 py-5 border-b border-[#E8E0D5] flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-0.5">Quotation</p>
              <h2 className="font-heading text-xl font-bold text-charcoal-900">Your Quote</h2>
            </div>
            <VendorQuotePdfButton
              rfpNumber={rfp.rfpNumber}
              companyName={rfp.vendorProfile.companyName}
              contactName={rfp.vendorProfile.user.name ?? ''}
              contactEmail={rfp.vendorProfile.user.email}
              brandLogoDataUrl={brandLogoDataUrl ?? null}
              vendorLogoDataUrl={vendorLogoDataUrl ?? null}
              items={rfp.items.map(item => ({
                id:          item.id,
                productName: item.productName ?? item.product?.name ?? null,
                productSku:  item.productSku  ?? item.product?.sku  ?? null,
                quantity:    item.quantity,
                unitPrice:   item.unitPrice != null ? Number(item.unitPrice) : null,
                isCustom:    item.isCustom,
                imageUrl:    item.product?.images?.[0]?.url ?? null,
                sizeLabel:   sizeLabel(item),
                colorName:   item.customColorName ?? item.color?.name ?? null,
                textureName: item.customTextureUrl ? 'Custom texture' : (item.texture?.name ?? null),
                finishName:  item.customFinishDesc ?? item.finish?.name ?? null,
              }))}
              subtotal={Number(latestQuote.subtotal)}
              discount={latestQuote.discount   != null ? Number(latestQuote.discount)   : null}
              tax={latestQuote.tax             != null ? Number(latestQuote.tax)        : null}
              shipping={latestQuote.shipping   != null ? Number(latestQuote.shipping)   : null}
              deliveryCharges={(latestQuote as any).deliveryCharges != null ? Number((latestQuote as any).deliveryCharges) : null}
              total={Number(latestQuote.total)}
              validUntil={latestQuote.validUntil?.toString() ?? ''}
              productionDays={(latestQuote as any).productionDays ?? null}
              deliveryDays={(latestQuote as any).deliveryDays ?? null}
              terms={latestQuote.terms ?? null}
            />
          </div>
          <div className="p-8">
            <QuotationView
              rfpId={rfp.id}
              rfpNumber={rfp.rfpNumber}
              quote={{
                subtotal:   Number(latestQuote.subtotal),
                discount:   latestQuote.discount   != null ? Number(latestQuote.discount)   : null,
                tax:        latestQuote.tax        != null ? Number(latestQuote.tax)        : null,
                shipping:   latestQuote.shipping   != null ? Number(latestQuote.shipping)   : null,
                total:      Number(latestQuote.total),
                validUntil: latestQuote.validUntil,
                terms:      latestQuote.terms,
                sentAt:     latestQuote.sentAt,
              }}
              items={rfp.items.map(item => ({
                id:          item.id,
                productName: item.productName ?? item.product?.name ?? null,
                quantity:    item.quantity,
                unitPrice:   item.unitPrice != null ? Number(item.unitPrice) : null,
                isCustom:    item.isCustom,
                customWidth: item.customWidth ?? null,
                customHeight:item.customHeight ?? null,
                customDepth: item.customDepth ?? null,
              }))}
              currentStatus={rfp.status}
              revisionRequest={rfp.revisionRequest ?? null}
            />
          </div>
        </div>
      )}

    </div>
  )
}
