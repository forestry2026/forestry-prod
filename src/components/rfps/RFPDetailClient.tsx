'use client'

import { useState }    from 'react'
import { useRouter }   from 'next/navigation'
import Link            from 'next/link'
import {
  ArrowLeft, Plus, AlertTriangle, Play, CheckCircle2,
  Building2, User, Mail, MapPin, Truck, StickyNote, Clock,
  Archive, Trash2, ArchiveRestore, Package, Hash,
} from 'lucide-react'
import QuotationForm         from '@/components/quotations/QuotationForm'
import { StatusTimeline }    from '@/components/rfps/StatusTimeline'
import { QuoteBuilder }      from '@/components/rfps/QuoteBuilder'
import { RfpActivityLog }    from '@/components/rfps/RfpActivityLog'
import { RfpNotesPanel }     from '@/components/rfps/RfpNotesPanel'
import { TexturePopover }      from '@/components/shared/TexturePopover'
import { ProductImagePopover } from '@/components/shared/ProductImagePopover'

interface Props {
  rfp:                any
  brandLogoDataUrl?:  string | null
  vendorLogoDataUrl?: string | null
  companyInfo?: {
    name:    string | null
    trn:     string | null
    email:   string | null
    phone:   string | null
    address: string | null
  } | null
  currentUser:        { id: string; role: string; name: string }
}

/* ── Status config ───────────────────────────────────── */
const STATUS_META: Record<string, { label: string; badge: string; strip: string }> = {
  DRAFT:         { label: 'Draft',         badge: 'bg-charcoal-100 text-charcoal-600',       strip: 'bg-charcoal-300'   },
  SUBMITTED:     { label: 'Submitted',     badge: 'bg-sky-100 text-sky-700',                 strip: 'bg-sky-400'        },
  PENDING:       { label: 'Pending',       badge: 'bg-amber-100 text-amber-700',             strip: 'bg-amber-400'      },
  UNDER_REVIEW:  { label: 'Under Review',  badge: 'bg-amber-100 text-amber-700',             strip: 'bg-amber-400'      },
  QUOTED:        { label: 'Quoted',        badge: 'bg-violet-100 text-violet-700',           strip: 'bg-violet-400'     },
  APPROVED:      { label: 'Approved',      badge: 'bg-emerald-100 text-emerald-700',         strip: 'bg-emerald-400'    },
  ACCEPTED:      { label: 'Accepted',      badge: 'bg-emerald-100 text-emerald-700',         strip: 'bg-emerald-400'    },
  IN_PRODUCTION: { label: 'In Production', badge: 'bg-terracotta/10 text-terracotta',        strip: 'bg-terracotta'     },
  COMPLETED:     { label: 'Completed',     badge: 'bg-charcoal-100 text-charcoal-600',       strip: 'bg-charcoal-400'   },
  REJECTED:      { label: 'Rejected',      badge: 'bg-rose-100 text-rose-700',               strip: 'bg-rose-400'       },
}

/* ── Item spec resolvers ─────────────────────────────── */
function sizeLabel(item: any): string | null {
  if (item.variantName) return item.variantName
  if (item.isCustomSize) {
    try {
      const dims = JSON.parse(item.customDimensions || '[]') as Array<{ label: string; value: string; unit: string }>
      return dims.map(d => `${d.label}: ${d.value}${d.unit}`).join(', ') || 'Custom'
    } catch { return 'Custom' }
  }
  if (item.dimension?.name) return item.dimension.name
  if (item.customWidth)     return `${item.customWidth}×${item.customHeight}×${item.customDepth} cm`
  return null
}

function colorInfo(item: any): { hex: string | null; name: string } | null {
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

export default function RFPDetailClient({ rfp, brandLogoDataUrl, vendorLogoDataUrl, companyInfo, currentUser }: Props) {
  const router = useRouter()
  const [showQuotationForm,  setShowQuotationForm]  = useState(false)
  const [startingProduction, setStartingProduction] = useState(false)
  const [productionError,    setProductionError]    = useState<string | null>(null)
  const [completing,         setCompleting]         = useState(false)
  const [completeError,      setCompleteError]      = useState<string | null>(null)
  const [archiving,          setArchiving]          = useState(false)
  const [archiveError,       setArchiveError]       = useState<string | null>(null)
  const [isArchived,         setIsArchived]         = useState<boolean>(rfp.isArchived ?? false)
  const [deleting,           setDeleting]           = useState(false)
  const [deleteError,        setDeleteError]        = useState<string | null>(null)
  const [confirmDelete,      setConfirmDelete]      = useState(false)

  const handleQuotationSuccess = () => { setShowQuotationForm(false); router.refresh() }

  const isApproved     = rfp.status === 'APPROVED'
  const isInProduction = rfp.status === 'IN_PRODUCTION'
  const hasQuotes      = rfp.quotes && rfp.quotes.length > 0
  const totalUnits     = (rfp.items ?? []).reduce((s: number, i: any) => s + i.quantity, 0)
  const statusMeta     = STATUS_META[rfp.status] ?? { label: rfp.status, badge: 'bg-charcoal-100 text-charcoal-600', strip: 'bg-charcoal-300' }

  const canShowQuoteBuilder = ['SUBMITTED','PENDING','QUOTED','APPROVED','IN_PRODUCTION','COMPLETED'].includes(rfp.status)

  const quoteItems = (rfp.items ?? []).map((item: any) => {
    const ci = colorInfo(item)
    return {
      id:              item.id,
      productName:     item.productName ?? item.product?.name ?? null,
      productSku:      item.productSku  ?? item.product?.sku  ?? null,
      productImageUrl: item.product?.images?.[0]?.url ?? null,
      isCustom:        item.isCustom ?? false,
      quantity:        item.quantity,
      sizeLabel:       sizeLabel(item),
      color:           ci              ? { name: ci.name }              : null,
      texture:         textureLabel(item) ? { name: textureLabel(item)! } : null,
      finish:          finishLabel(item)  ? { name: finishLabel(item)! }  : null,
      unitPrice:       item.unitPrice ?? null,
    }
  })

  const latestQuote   = rfp.quotes?.[0] ?? null
  const existingQuote = latestQuote ? {
    subtotal:        latestQuote.subtotal,
    discount:        latestQuote.discount,
    tax:             latestQuote.tax,
    shipping:        latestQuote.shipping,
    total:           latestQuote.total,
    validUntil:      latestQuote.validUntil,
    terms:           latestQuote.terms,
    notes:           latestQuote.notes,
    productionDays:  latestQuote.productionDays  ?? null,
    deliveryDays:    latestQuote.deliveryDays    ?? null,
    deliveryCharges: latestQuote.deliveryCharges ?? null,
    sentAt:          latestQuote.sentAt,
  } : null

  async function handleMarkCompleted() {
    setCompleting(true); setCompleteError(null)
    try {
      const res = await fetch(`/api/rfp/${rfp.id}/complete`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to mark completed')
      router.refresh()
    } catch (e: any) { setCompleteError(e.message) }
    finally { setCompleting(false) }
  }

  async function handleArchive() {
    setArchiving(true); setArchiveError(null)
    try {
      const res  = await fetch(`/api/rfp/${rfp.id}/archive`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to archive')
      setIsArchived(data.isArchived)
    } catch (e: any) { setArchiveError(e.message) }
    finally { setArchiving(false) }
  }

  async function handleDelete() {
    setDeleting(true); setDeleteError(null)
    try {
      const res  = await fetch(`/api/rfp/${rfp.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      router.push('/admin/rfps')
    } catch (e: any) {
      setDeleteError(e.message)
      setDeleting(false)
    }
  }

  async function handleStartProduction() {
    setStartingProduction(true); setProductionError(null)
    try {
      const res = await fetch(`/api/rfp/${rfp.id}/start-production`, { method: 'POST' })
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to start production')
      router.refresh()
    } catch (e: any) { setProductionError(e.message) }
    finally { setStartingProduction(false) }
  }

  /* ── initials for vendor avatar ── */
  const initials = (rfp.vendorProfile.companyName as string)
    .split(' ').slice(0, 2).map((w: string) => w[0]).join('').toUpperCase()

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm text-charcoal-400">
        <Link
          href="/admin/rfps"
          className="inline-flex items-center gap-1.5 hover:text-terracotta transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/40 rounded"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          All RFPs
        </Link>
        <span className="text-charcoal-200">/</span>
        <span className="font-mono text-charcoal-500 font-medium">{rfp.rfpNumber}</span>
      </div>

      {/* ── Hero header card ── */}
      <div className="bg-white rounded-2xl border border-[#EDE8E1] shadow-sm overflow-hidden">
        {/* Status colour strip */}
        <div className={`h-1 w-full ${statusMeta.strip}`} />

        {/* Header body */}
        <div className="px-7 pt-5 pb-0">
          <div className="flex items-start justify-between gap-6 mb-5">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-1">
                <span className="font-mono text-2xl font-bold text-charcoal-900 tracking-tight">{rfp.rfpNumber}</span>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusMeta.badge}`}>
                  {statusMeta.label}
                </span>
              </div>
              {rfp.projectName && (
                <p className="text-sm font-medium text-charcoal-500 truncate">{rfp.projectName}</p>
              )}
            </div>

            {/* Stats pills */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cream border border-[#EDE8E1]">
                <Package className="w-3.5 h-3.5 text-charcoal-400" aria-hidden="true" />
                <span className="text-xs font-bold text-charcoal-700 tabular-nums">{totalUnits} <span className="font-medium text-charcoal-400">units</span></span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cream border border-[#EDE8E1]">
                <Hash className="w-3.5 h-3.5 text-charcoal-400" aria-hidden="true" />
                <span className="text-xs font-bold text-charcoal-700 tabular-nums">{rfp.items.length} <span className="font-medium text-charcoal-400">lines</span></span>
              </div>
              {rfp.submittedAt && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cream border border-[#EDE8E1]">
                  <Clock className="w-3.5 h-3.5 text-charcoal-400" aria-hidden="true" />
                  <span className="text-xs font-medium text-charcoal-500">
                    {new Date(rfp.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Timeline */}
          <div className="pb-5">
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
        </div>
      </div>

      {/* ── Alerts ── */}
      {rfp.revisionRequest && (
        <div className="flex items-start gap-4 bg-amber-50 border border-amber-200/80 rounded-2xl px-5 py-4">
          <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold text-amber-900 text-sm">Vendor Requested a Revision</p>
            <p className="text-sm text-amber-700 mt-0.5 leading-relaxed">{rfp.revisionRequest}</p>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200/70 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-emerald-900 text-sm">Quotation Approved</p>
              <p className="text-xs text-emerald-700 mt-0.5">Ready to move into production.</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={handleStartProduction}
              disabled={startingProduction}
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
              style={{ touchAction: 'manipulation' }}
            >
              <Play className="w-3.5 h-3.5" aria-hidden="true" />
              {startingProduction ? 'Starting…' : 'Start Production'}
            </button>
            {productionError && <p className="text-xs text-red-600">{productionError}</p>}
          </div>
        </div>
      )}

      {isInProduction && (
        <div className="flex items-center justify-between bg-[#FDF6F2] border border-terracotta/20 rounded-2xl px-5 py-4">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
              <Play className="w-4 h-4 text-terracotta" aria-hidden="true" />
            </div>
            <div>
              <p className="font-semibold text-charcoal-800 text-sm">In Production</p>
              <p className="text-xs text-charcoal-500 mt-0.5">Mark as completed once the order is fulfilled and delivered.</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <button
              onClick={handleMarkCompleted}
              disabled={completing}
              className="inline-flex items-center gap-2 bg-terracotta hover:bg-[#B85C3B] active:bg-[#A84F30] text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/50"
              style={{ touchAction: 'manipulation' }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" />
              {completing ? 'Completing…' : 'Mark as Completed'}
            </button>
            {completeError && <p className="text-xs text-red-600">{completeError}</p>}
          </div>
        </div>
      )}

      {/* ── Two-column panel ── */}
      <div className="grid grid-cols-5 rounded-2xl overflow-hidden border border-[#EDE8E1] shadow-sm">

        {/* ── Left: vendor + project ── */}
        <div className="col-span-2 bg-[#F9F6F2] flex flex-col divide-y divide-[#EDE8E1]">

          {/* Vendor */}
          <div className="px-6 py-6">
            {/* Vendor avatar + name */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-terracotta">{initials}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-terracotta mb-0.5">Vendor</p>
                <p className="text-sm font-bold text-charcoal-900 truncate">{rfp.vendorProfile.companyName}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-2.5">
                <User className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 mb-0.5">Contact</p>
                  <p className="text-sm text-charcoal-700">{rfp.vendorProfile.user.name}</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5">
                <Mail className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 mb-0.5">Email</p>
                  <p className="text-sm text-charcoal-700 break-all">{rfp.vendorProfile.user.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Project */}
          {(rfp.projectName || rfp.projectLocation || rfp.deliveryAddress || rfp.notes) && (
            <div className="px-6 py-5 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-terracotta">Project</p>
              {rfp.projectName && (
                <div className="flex items-start gap-2.5">
                  <Building2 className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 mb-0.5">Name</p>
                    <p className="text-sm text-charcoal-700">{rfp.projectName}</p>
                  </div>
                </div>
              )}
              {rfp.projectLocation && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 mb-0.5">Location</p>
                    <p className="text-sm text-charcoal-700">{rfp.projectLocation}</p>
                  </div>
                </div>
              )}
              {rfp.deliveryAddress && (
                <div className="flex items-start gap-2.5">
                  <Truck className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 mb-0.5">Delivery</p>
                    <p className="text-sm text-charcoal-700 leading-relaxed">{rfp.deliveryAddress}</p>
                  </div>
                </div>
              )}
              {rfp.notes && (
                <div className="flex items-start gap-2.5">
                  <StickyNote className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 mb-0.5">Notes</p>
                    <p className="text-sm text-charcoal-700 leading-relaxed">{rfp.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer timestamp */}
          <div className="mt-auto px-6 py-4 flex items-center gap-2.5">
            <Clock className="w-3.5 h-3.5 text-charcoal-300" aria-hidden="true" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">Received</p>
              <p className="text-xs text-charcoal-600 font-medium mt-0.5">
                {rfp.submittedAt
                  ? new Date(rfp.submittedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* ── Right: line items ── */}
        <div className="col-span-3 bg-white px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-400">Items Requested</p>
            <span className="text-xs font-bold text-terracotta tabular-nums">{totalUnits} units</span>
          </div>

          <div className="space-y-2">
            {(rfp.items ?? []).map((item: any, index: number) => {
              const size       = sizeLabel(item)
              const color      = colorInfo(item)
              const texture    = textureLabel(item)
              const finish     = finishLabel(item)
              const productImg = item.product?.images?.[0]?.url ?? null

              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 px-3.5 py-3 rounded-xl bg-white border border-[#EDE8E1] hover:border-terracotta/25 hover:bg-[#FDFAF7] transition-colors"
                >
                  {/* Image or index */}
                  {productImg ? (
                    <ProductImagePopover
                      imageUrl={productImg}
                      productName={item.product?.name ?? item.productName ?? 'Product'}
                      sku={item.product?.sku ?? item.productSku ?? null}
                    />
                  ) : (
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-cream border border-[#EDE8E1] flex items-center justify-center">
                      <span className="font-mono text-[11px] font-bold text-terracotta/50 tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-charcoal-900 text-sm leading-snug">
                      {item.product?.name ?? item.productName ?? '—'}
                    </p>
                    {(item.product?.sku ?? item.productSku) && (
                      <p className="font-mono text-[10px] text-charcoal-300 mt-0.5">
                        {item.product?.sku ?? item.productSku}
                      </p>
                    )}

                    {/* Spec chips */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {size && (
                        <span className="inline-flex items-center gap-1 bg-cream rounded-md px-2 py-0.5 border border-[#EDE8E1]">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Size</span>
                          <span className="text-[10px] font-semibold text-charcoal-700">{size}</span>
                        </span>
                      )}
                      {color && (
                        <span className="inline-flex items-center gap-1.5 bg-cream rounded-md px-2 py-0.5 border border-[#EDE8E1]">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Colour</span>
                          {color.hex && (
                            <span className="w-3 h-3 rounded-full border border-black/10 flex-shrink-0" style={{ backgroundColor: color.hex }} />
                          )}
                          <span className="text-[10px] font-semibold text-charcoal-700">{color.name}</span>
                        </span>
                      )}
                      {item.customTextureUrl ? (
                        <span className="inline-flex items-center gap-1.5 bg-cream rounded-md px-2 py-0.5 border border-[#EDE8E1]">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Texture</span>
                          <TexturePopover imageUrl={item.customTextureUrl} name="Custom texture" />
                          <span className="text-[10px] font-semibold text-charcoal-700">Custom</span>
                        </span>
                      ) : texture ? (
                        <span className="inline-flex items-center gap-1.5 bg-cream rounded-md px-2 py-0.5 border border-[#EDE8E1]">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Texture</span>
                          {item.texture?.imageUrl && (
                            <TexturePopover imageUrl={item.texture.imageUrl} name={item.texture.name} />
                          )}
                          <span className="text-[10px] font-semibold text-charcoal-700">{texture}</span>
                        </span>
                      ) : null}
                      {finish && (
                        <span className="inline-flex items-center gap-1 bg-cream rounded-md px-2 py-0.5 border border-[#EDE8E1]">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Finish</span>
                          <span className="text-[10px] font-semibold text-charcoal-700">{finish}</span>
                        </span>
                      )}
                      {item.holesOption && (
                        <span className="inline-flex items-center gap-1 bg-cream rounded-md px-2 py-0.5 border border-[#EDE8E1]">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Drainage</span>
                          <span className="text-[10px] font-semibold text-charcoal-700">
                            {item.holesOption === 'with_holes' ? 'With holes' : 'Without holes'}
                          </span>
                        </span>
                      )}
                      {item.notes && (
                        <span className="inline-flex items-center gap-1 bg-cream rounded-md px-2 py-0.5 border border-[#EDE8E1] max-w-[180px]">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400 flex-shrink-0">Note</span>
                          <span className="text-[10px] font-semibold text-charcoal-700 truncate">{item.notes}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Vendor-submitted unit price (variant price from product spec) */}
                  {item.unitPrice != null && (
                    <span className="flex-shrink-0 inline-flex flex-col items-end leading-tight px-2.5 py-1 rounded-lg bg-cream border border-[#EDE8E1]">
                      <span className="text-[8px] font-bold uppercase tracking-wider text-charcoal-400">Submitted</span>
                      <span className="text-xs font-bold text-terracotta tabular-nums">
                        AED {Number(item.unitPrice).toLocaleString()}
                      </span>
                      {item.quantity > 1 && (
                        <span className="text-[9px] text-charcoal-400 tabular-nums">
                          ×{item.quantity} = {(Number(item.unitPrice) * item.quantity).toLocaleString()}
                        </span>
                      )}
                    </span>
                  )}

                  {/* Quantity */}
                  <span className="flex-shrink-0 inline-flex items-center justify-center h-7 min-w-[36px] px-2 rounded-lg bg-terracotta/8 text-terracotta text-xs font-bold tabular-nums border border-terracotta/15">
                    ×{item.quantity}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

      </div>

      {/* ── Quote Builder ── */}
      {canShowQuoteBuilder && (
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-[#EDE8E1]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal-400">Quotation</p>
            <div className="h-px flex-1 bg-[#EDE8E1]" />
          </div>
          <QuoteBuilder
            rfpId={rfp.id}
            rfpNumber={rfp.rfpNumber}
            companyName={rfp.vendorProfile.companyName}
            contactName={rfp.vendorProfile.user.name}
            contactEmail={rfp.vendorProfile.user.email}
            brandLogoDataUrl={brandLogoDataUrl ?? null}
            vendorLogoDataUrl={vendorLogoDataUrl ?? null}
            companyInfo={companyInfo ?? null}
            items={quoteItems}
            existingQuote={existingQuote}
            currentStatus={rfp.status}
          />
        </div>
      )}

      {/* Legacy form trigger */}
      {isApproved && !hasQuotes && !canShowQuoteBuilder && (
        <div className="bg-sky-50 border border-sky-200/80 rounded-2xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sky-900 text-sm">Ready to Create Quotation</p>
              <p className="text-xs text-sky-700 mt-0.5">This RFP is approved and ready for pricing</p>
            </div>
            <button
              onClick={() => setShowQuotationForm(true)}
              className="inline-flex items-center gap-2 bg-terracotta hover:bg-[#B85C3B] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-terracotta/50"
              style={{ touchAction: 'manipulation' }}
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              Create Quotation
            </button>
          </div>
        </div>
      )}

      {/* Quotation Form Modal */}
      {showQuotationForm && (
        <QuotationForm
          rfpId={rfp.id}
          rfpItems={rfp.items}
          onClose={() => setShowQuotationForm(false)}
          onSuccess={handleQuotationSuccess}
        />
      )}

      {/* ── Notes + Activity side-by-side ── */}
      <div className="grid grid-cols-5 gap-5 items-start">
        <div className="col-span-3">
          <RfpNotesPanel rfpId={rfp.id} currentUser={currentUser} />
        </div>
        <div className="col-span-2">
          <RfpActivityLog rfpId={rfp.id} />
        </div>
      </div>

      {/* ── Manage (Danger Zone) — always last ── */}
      <div className="rounded-2xl border border-[#EDE8E1] overflow-hidden bg-white">
        <div className="px-6 py-3 border-b border-[#EDE8E1] bg-[#FAFAF9]">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-400">Manage</p>
        </div>
        <div className="divide-y divide-[#EDE8E1]">

          {/* Archive / Unarchive */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-charcoal-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                {isArchived
                  ? <ArchiveRestore className="w-3.5 h-3.5 text-charcoal-500" aria-hidden="true" />
                  : <Archive className="w-3.5 h-3.5 text-charcoal-500" aria-hidden="true" />
                }
              </div>
              <div>
                <p className="text-sm font-semibold text-charcoal-800">
                  {isArchived ? 'Unarchive RFP' : 'Archive RFP'}
                </p>
                <p className="text-xs text-charcoal-400 mt-0.5">
                  {isArchived
                    ? 'Restore this RFP to the active list.'
                    : 'Hide from the active list. Data is preserved and can be restored.'}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-6">
              <button
                onClick={handleArchive}
                disabled={archiving}
                className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl border transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal-400/40 bg-white border-[#DDD8D0] hover:bg-cream text-charcoal-700"
                style={{ touchAction: 'manipulation' }}
              >
                {isArchived
                  ? <><ArchiveRestore className="w-3.5 h-3.5" aria-hidden="true" />{archiving ? 'Restoring…' : 'Unarchive'}</>
                  : <><Archive className="w-3.5 h-3.5" aria-hidden="true" />{archiving ? 'Archiving…' : 'Archive'}</>
                }
              </button>
              {archiveError && <p className="text-xs text-red-500 mt-1">{archiveError}</p>}
            </div>
          </div>

          {/* Delete */}
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-400" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-charcoal-800">Delete RFP</p>
                <p className="text-xs text-charcoal-400 mt-0.5">
                  Permanently removes this RFP and all associated data. Cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-6">
              {!confirmDelete ? (
                <button
                  onClick={() => setConfirmDelete(true)}
                  className="inline-flex items-center gap-2 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold px-4 py-2 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40"
                  style={{ touchAction: 'manipulation' }}
                >
                  <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Delete
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="px-3 py-2 text-xs font-semibold text-charcoal-500 hover:text-charcoal-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal-400/40 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50"
                    style={{ touchAction: 'manipulation' }}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                    {deleting ? 'Deleting…' : 'Confirm Delete'}
                  </button>
                </div>
              )}
              {deleteError && <p className="text-xs text-red-500 mt-1">{deleteError}</p>}
            </div>
          </div>

        </div>
      </div>

    </div>
  )
}
