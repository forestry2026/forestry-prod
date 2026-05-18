'use client'

import { useState }                from 'react'
import Link                        from 'next/link'
import { useRouter }               from 'next/navigation'
import { ProductImagePopover }     from '@/components/shared/ProductImagePopover'
import {
  ArrowLeft, ArrowRight, Building2, User, Mail, Clock,
  Ruler, Palette, Layers, Droplets, FileText, ImageIcon,
  CheckCircle2, Eye, AlertCircle, Save, Loader2,
} from 'lucide-react'

interface Props {
  data: {
    id:               string
    title:            string
    description:      string | null
    quantity:         number
    status:           string
    adminNotes:       string | null
    holesOption:      string | null
    notes:            string | null
    customColorHex:   string | null
    customColorName:  string | null
    customColorRal:   string | null
    customTexture:    string | null
    customTextureUrl: string | null
    dimensions:       { label: string; value: string; unit: string }[]
    referenceImages:  { url: string; name: string }[]
    createdAt:        string
    vendorProfile:    { companyName: string; user: { name: string; email: string } }
    color:   { name: string; hexCode?: string | null } | null
    texture: { name: string; imageUrl?: string | null } | null
    finish:  { name: string } | null
  }
}

/* ── Status config ───────────────────────────────────────────── */
const STATUS_META: Record<string, { label: string; badge: string }> = {
  pending:   { label: 'Pending Review', badge: 'bg-amber-50  text-amber-700'  },
  reviewing: { label: 'In Progress',   badge: 'bg-blue-50   text-blue-700'   },
  quoted:    { label: 'Quoted',        badge: 'bg-green-50  text-green-700'  },
  rejected:  { label: 'Not Feasible', badge: 'bg-red-50    text-red-700'    },
}

const STATUS_OPTIONS = [
  { value: 'pending',   label: 'Pending Review', icon: Clock,        color: 'text-amber-600' },
  { value: 'reviewing', label: 'In Progress',    icon: Eye,          color: 'text-blue-600'  },
  { value: 'quoted',    label: 'Quoted',         icon: CheckCircle2, color: 'text-green-600' },
  { value: 'rejected',  label: 'Not Feasible',  icon: AlertCircle,  color: 'text-red-600'   },
]

/* ── Primitives ─────────────────────────────────────────────── */
function InfoRow({ icon: Icon, label, children }: { icon: React.ElementType; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400 mb-0.5">{label}</p>
        <div className="text-sm text-charcoal-700">{children}</div>
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-4">{children}</p>
  )
}

function Chip({ label, value, accent }: { label: string; value: React.ReactNode; accent?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1 bg-white rounded-md px-2 py-0.5 border border-[#E8E0D5]">
      <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">{label}</span>
      <span className={`text-[10px] font-semibold ${accent ? 'text-terracotta' : 'text-charcoal-700'}`}>{value}</span>
    </span>
  )
}

/* ── Main ───────────────────────────────────────────────────── */
export function CustomDesignAdmin({ data }: Props) {
  const [status,     setStatus]     = useState(data.status)
  const [adminNotes, setAdminNotes] = useState(data.adminNotes ?? '')
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)
  const [converting,  setConverting]  = useState(false)
  const [lightbox,    setLightbox]    = useState<string | null>(null)
  const router = useRouter()

  const statusMeta = STATUS_META[status] ?? STATUS_META.pending

  async function handleConvert() {
    if (!confirm(`Convert "${data.title}" to an RFP? This will create a new RFP in SUBMITTED state for the vendor's quotation workflow.`)) return
    setConverting(true)
    try {
      const res  = await fetch(`/api/custom-design/${data.id}/convert-to-rfp`, { method: 'POST' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      router.push(`/admin/rfps/${json.rfpId}`)
    } catch (e: any) {
      alert(`Conversion failed: ${e.message}`)
      setConverting(false)
    }
  }

async function handleSave() {
    setSaving(true)
    setSaved(false)
    await fetch(`/api/custom-design/${data.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ status, adminNotes: adminNotes.trim() || null }),
    })
    setSaving(false)
    setSaved(true)
    router.refresh()
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-5">

      {/* ── Breadcrumb ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-charcoal-400">
        <Link href="/admin/custom-designs" className="inline-flex items-center gap-1.5 hover:text-charcoal-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          All Custom Designs
        </Link>
        <span className="text-charcoal-300">/</span>
        <span className="text-charcoal-700 font-medium truncate max-w-xs">{data.title}</span>
      </div>

      {/* ── Status bar ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
        <div className="flex items-center gap-4 px-7 py-4 bg-cream border-b border-[#E8E0D5]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-heading text-lg font-bold text-charcoal-900 tracking-tight">
                {data.title}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusMeta.badge}`}>
                {statusMeta.label}
              </span>
            </div>
            <p className="text-xs text-charcoal-400 mt-0.5 font-medium">
              {data.vendorProfile.companyName} · {data.quantity} unit{data.quantity !== 1 ? 's' : ''}
              {data.dimensions.length > 0 && ` · ${data.dimensions.length} dimension${data.dimensions.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">Submitted</p>
            <p className="text-xs text-charcoal-600 font-medium mt-0.5">
              {new Date(data.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Two-column panel ─────────────────────────────────── */}
      <div className="grid grid-cols-5 rounded-2xl overflow-hidden border border-[#E8E0D5] shadow-card-lg">

        {/* Left: context (cream) */}
        <div className="col-span-2 bg-cream-dark flex flex-col">

          {/* Vendor */}
          <div className="px-7 pt-7 pb-5 border-b border-[#E8E0D5]">
            <SectionLabel>Vendor</SectionLabel>
            <div className="space-y-3.5">
              <InfoRow icon={Building2} label="Company">
                <span className="font-semibold text-charcoal-900">{data.vendorProfile.companyName}</span>
              </InfoRow>
              <InfoRow icon={User} label="Contact">
                {data.vendorProfile.user.name}
              </InfoRow>
              <InfoRow icon={Mail} label="Email">
                <span className="break-all">{data.vendorProfile.user.email}</span>
              </InfoRow>
            </div>
          </div>

          {/* Brief */}
          <div className="px-7 py-5 border-b border-[#E8E0D5]">
            <SectionLabel>Brief</SectionLabel>
            <div className="space-y-3.5">
              <InfoRow icon={FileText} label="Design Name">
                <span className="font-semibold text-charcoal-900">{data.title}</span>
              </InfoRow>
              <InfoRow icon={FileText} label="Quantity">
                <span className="font-semibold text-charcoal-900">{data.quantity} units</span>
              </InfoRow>
              {data.description && (
                <InfoRow icon={FileText} label="Description">
                  <span className="leading-relaxed text-charcoal-600">{data.description}</span>
                </InfoRow>
              )}
            </div>
          </div>

          {/* Vendor notes */}
          {data.notes && (
            <div className="px-7 py-5 border-b border-[#E8E0D5]">
              <SectionLabel>Vendor Notes</SectionLabel>
              <p className="text-sm text-charcoal-600 leading-relaxed">{data.notes}</p>
            </div>
          )}

          {/* Footer timestamp */}
          <div className="mt-auto px-7 py-5 border-t border-[#E8E0D5] bg-cream-darker/40 flex items-center gap-2.5">
            <Clock className="w-3.5 h-3.5 text-charcoal-300" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">Received</p>
              <p className="text-xs text-charcoal-600 font-medium">
                {new Date(data.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Right: spec details (white) */}
        <div className="col-span-3 bg-white px-7 py-7 space-y-6">

          {/* Dimensions */}
          {data.dimensions.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 flex items-center gap-1.5">
                  <Ruler className="w-3 h-3" /> Dimensions
                </p>
                <span className="text-xs text-charcoal-400">{data.dimensions.length} spec{data.dimensions.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.dimensions.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 bg-cream/60 border border-[#E8E0D5] rounded-lg px-3 py-2">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">{d.label}</span>
                    <span className="w-px h-3 bg-[#DDD4C8]" />
                    <span className="text-sm font-mono font-bold text-charcoal-900">{d.value}</span>
                    <span className="text-xs text-charcoal-500">{d.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Colour */}
          {(data.color || data.customColorHex) && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 flex items-center gap-1.5 mb-3">
                <Palette className="w-3 h-3" /> Colour
              </p>
              <div className="flex items-center gap-3 py-3 px-3 rounded-xl bg-cream/60 border border-[#E8E0D5]">
                <div
                  className="w-10 h-10 rounded-lg border border-black/10 shadow-sm flex-shrink-0"
                  style={{ background: data.color?.hexCode ?? data.customColorHex ?? '#ccc' }}
                />
                <div className="flex flex-wrap gap-1.5">
                  {data.color ? (
                    <>
                      <Chip label="Name" value={data.color.name} />
                      <Chip label="Type" value="Catalog" />
                    </>
                  ) : (
                    <>
                      {data.customColorName && <Chip label="Name" value={data.customColorName} />}
                      {data.customColorRal  && <Chip label="RAL"  value={data.customColorRal} accent />}
                      {data.customColorHex  && <Chip label="Hex"  value={data.customColorHex.toUpperCase()} accent />}
                      <Chip label="Type" value="Custom" />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Texture */}
          {(data.texture || data.customTexture || data.customTextureUrl) && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 flex items-center gap-1.5 mb-3">
                <Layers className="w-3 h-3" /> Texture
              </p>
              <div className="flex items-start gap-3 py-3 px-3 rounded-xl bg-cream/60 border border-[#E8E0D5]">
                {data.texture ? (
                  <>
                    {data.texture.imageUrl && (
                      <div className="w-10 h-10 rounded-lg border border-[#E8E0D5] overflow-hidden flex-shrink-0">
                        <img src={data.texture.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      <Chip label="Name" value={data.texture.name} />
                      <Chip label="Type" value="Catalog" />
                    </div>
                  </>
                ) : (
                  <div className="flex items-start gap-3 w-full">
                    {data.customTextureUrl && (
                      <ProductImagePopover
                        imageUrl={data.customTextureUrl}
                        productName="Texture Reference"
                      />
                    )}
                    <div>
                      {data.customTexture && (
                        <p className="text-sm text-charcoal-600 leading-relaxed mb-2">{data.customTexture}</p>
                      )}
                      <Chip label="Type" value="Custom" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Finish & Drainage */}
          {(data.finish || data.holesOption) && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 flex items-center gap-1.5 mb-3">
                <Droplets className="w-3 h-3" /> Finish & Drainage
              </p>
              <div className="flex flex-wrap gap-1.5">
                {data.finish      && <Chip label="Finish"  value={data.finish.name} />}
                {data.holesOption && <Chip label="Drainage" value={data.holesOption} />}
              </div>
            </div>
          )}

          {/* Reference Images */}
          {data.referenceImages.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3" /> Reference Images
                </p>
                <span className="text-xs text-charcoal-400">{data.referenceImages.length} image{data.referenceImages.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {data.referenceImages.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setLightbox(img.url)}
                    className="aspect-square rounded-xl overflow-hidden border border-[#E8E0D5] hover:border-terracotta/40 hover:scale-[1.03] transition-all"
                  >
                    <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Admin Response panel (full-width, below) ─────────── */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal-400">Admin Response</p>
        </div>

        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
          <div className="px-7 py-5 border-b border-[#E8E0D5] bg-cream">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-0.5">Set Status</p>
            <div className="flex gap-1.5 flex-wrap mt-3">
              {STATUS_OPTIONS.map(s => {
                const Icon   = s.icon
                const active = status === s.value
                return (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStatus(s.value)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-sm transition-all ${
                      active
                        ? 'border-terracotta bg-white font-semibold text-charcoal-900 shadow-sm'
                        : 'border-[#E8E0D5] text-charcoal-500 hover:border-charcoal-300 hover:text-charcoal-700 bg-white'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${s.color}`} />
                    {s.label}
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-terracotta flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="px-7 py-5 space-y-4">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-charcoal-400 mb-2 block">
                Note to Vendor
              </label>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                placeholder="Add a note visible to the vendor — pricing estimate, feasibility comment, follow-up questions…"
                rows={3}
                className="form-input resize-none text-sm w-full"
              />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || converting}
                className={`flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all disabled:opacity-60 ${
                  saved
                    ? 'bg-green-600 text-white'
                    : 'bg-terracotta hover:bg-[#B85C3B] text-white'
                }`}
              >
                {saving
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>
                  : saved
                  ? <><CheckCircle2 className="w-4 h-4" /> Saved</>
                  : <><Save className="w-4 h-4" /> Save Response</>
                }
              </button>

              <div className="w-px h-6 bg-[#E8E0D5]" />

              <button
                type="button"
                onClick={handleConvert}
                disabled={saving || converting}
                className="flex items-center gap-2 font-semibold px-6 py-2.5 rounded-xl text-sm border border-charcoal-200 bg-white hover:border-charcoal-400 text-charcoal-700 transition-all disabled:opacity-60"
              >
                {converting
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Converting…</>
                  : <><ArrowRight className="w-4 h-4" /> Convert to RFP</>
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────── */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[500] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt="Reference"
            className="max-w-full max-h-[88vh] rounded-2xl shadow-2xl object-contain"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
