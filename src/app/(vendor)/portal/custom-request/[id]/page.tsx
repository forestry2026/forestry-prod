import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import {
  ArrowLeft, Clock, CheckCircle2, AlertCircle, Eye,
  Ruler, Palette, Layers, Droplets, FileText, ImageIcon, Wand2, Calendar, Package,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

const STATUS_MAP: Record<string, { label: string; color: string; dot: string; icon: React.ElementType; desc: string }> = {
  pending:   { label: 'Under Review',  color: 'bg-amber-50  text-amber-700  border-amber-200',  dot: 'bg-amber-400',  icon: Clock,         desc: 'Your request has been received and is awaiting review by our team.' },
  reviewing: { label: 'In Progress',   color: 'bg-blue-50   text-blue-700   border-blue-200',   dot: 'bg-blue-400',   icon: Eye,           desc: 'Our team is actively working on your custom design request.' },
  quoted:    { label: 'Quoted',        color: 'bg-green-50  text-green-700  border-green-200',  dot: 'bg-green-400',  icon: CheckCircle2,  desc: 'A quote has been prepared for your custom design.' },
  rejected:  { label: 'Not Feasible',  color: 'bg-red-50    text-red-700    border-red-200',    dot: 'bg-red-400',    icon: AlertCircle,   desc: 'Unfortunately this design cannot be produced as specified.' },
}

export default async function VendorCustomRequestDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } })
  if (!vendor) redirect('/portal')

  const req = await prisma.customDesignRequest.findUnique({
    where: { id },
    include: {
      vendorProfile: { select: { id: true } },
    },
  })

  // Guard: must belong to this vendor
  if (!req || req.vendorProfile.id !== vendor.id) notFound()

  // Resolve catalog selections
  const [color, texture, finish] = await Promise.all([
    req.colorId   ? prisma.color.findUnique({ where: { id: req.colorId } })     : null,
    req.textureId ? prisma.texture.findUnique({ where: { id: req.textureId } }) : null,
    req.finishId  ? prisma.finish.findUnique({ where: { id: req.finishId } })   : null,
  ])

  const dims   = JSON.parse(req.dimensions      || '[]') as { label: string; value: string; unit: string }[]
  const images = JSON.parse(req.referenceImages || '[]') as { url: string; name: string }[]
  const st     = STATUS_MAP[req.status] ?? STATUS_MAP.pending
  const StatusIcon = st.icon

  return (
    <div className="space-y-7">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/custom-request"
            className="inline-flex items-center gap-1.5 text-charcoal-400 hover:text-terracotta text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All Requests
          </Link>
          <span className="text-charcoal-200">/</span>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center flex-shrink-0">
              <Wand2 className="w-4 h-4 text-terracotta" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-charcoal-900 leading-tight">{req.title}</h1>
              <p className="text-xs text-charcoal-400">
                Submitted {new Date(req.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Status badge */}
        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold flex-shrink-0 ${st.color}`}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot}`} />
          {st.label}
        </span>
      </div>

      {/* Status banner */}
      <div className={`flex items-start gap-3 px-4 py-3.5 rounded-2xl border ${st.color}`}>
        <StatusIcon className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold">{st.label}</p>
          <p className="text-xs mt-0.5 opacity-80">{st.desc}</p>
        </div>
      </div>

      {/* Admin notes — highlighted if present */}
      {req.adminNotes && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-blue-500 mb-1.5">Note from our team</p>
          <p className="text-sm text-blue-800 leading-relaxed">{req.adminNotes}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Left — main details */}
        <div className="lg:col-span-2 space-y-5">

          {/* Brief */}
          <div className="bg-white border border-[#EDE7DE] rounded-2xl overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#EDE7DE] bg-[#FAF7F4]">
              <FileText className="w-4 h-4 text-terracotta" />
              <h2 className="font-heading font-semibold text-sm text-charcoal-900">Design Brief</h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-1">Design Name</p>
                  <p className="text-sm font-semibold text-charcoal-900">{req.title}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-1">Quantity</p>
                  <div className="flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-charcoal-400" />
                    <p className="text-sm font-semibold text-charcoal-900">{req.quantity} units</p>
                  </div>
                </div>
              </div>
              {req.description && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-1">Description</p>
                  <p className="text-sm text-charcoal-700 leading-relaxed">{req.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dimensions */}
          {dims.length > 0 && (
            <div className="bg-white border border-[#EDE7DE] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#EDE7DE] bg-[#FAF7F4]">
                <Ruler className="w-4 h-4 text-terracotta" />
                <h2 className="font-heading font-semibold text-sm text-charcoal-900">Dimensions</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {dims.map((d, i) => (
                    <div key={i} className="bg-[#FAF7F4] border border-[#EDE7DE] rounded-xl px-4 py-3">
                      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-charcoal-400">{d.label}</p>
                      <p className="text-lg font-bold text-charcoal-900 font-mono mt-0.5">
                        {d.value}
                        <span className="text-sm font-normal text-charcoal-400 ml-1">{d.unit}</span>
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Colour / Texture / Finish */}
          {(color || req.customColorHex || texture || req.customTexture || finish || req.holesOption) && (
            <div className="bg-white border border-[#EDE7DE] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#EDE7DE] bg-[#FAF7F4]">
                <Palette className="w-4 h-4 text-terracotta" />
                <h2 className="font-heading font-semibold text-sm text-charcoal-900">Finish Specifications</h2>
              </div>
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Colour */}
                {(color || req.customColorHex) && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-2">Colour</p>
                    {color ? (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg border border-black/10 flex-shrink-0" style={{ background: color.hexCode ?? '#ccc' }} />
                        <span className="text-sm font-medium text-charcoal-800">{color.name}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg border border-black/10 flex-shrink-0" style={{ background: req.customColorHex ?? '#ccc' }} />
                        <div>
                          <p className="text-sm font-medium text-charcoal-800">{req.customColorName || 'Custom'}</p>
                          {req.customColorRal && <p className="text-[10px] font-mono text-charcoal-400">RAL {req.customColorRal}</p>}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Texture */}
                {(texture || req.customTexture || req.customTextureUrl) && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-2">Texture</p>
                    {texture ? (
                      <div className="flex items-center gap-2.5">
                        {texture.imageUrl && (
                          <div className="w-7 h-7 rounded-lg border border-[#EDE7DE] overflow-hidden flex-shrink-0">
                            <img src={texture.imageUrl} alt={texture.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-charcoal-800">{texture.name}</span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        {req.customTexture && <p className="text-sm text-charcoal-700 leading-snug">{req.customTexture}</p>}
                        {req.customTextureUrl && (
                          <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#EDE7DE]">
                            <img src={req.customTextureUrl} alt="Custom texture" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Finish */}
                {finish && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-2">Surface Finish</p>
                    <span className="text-sm font-medium text-charcoal-800">{finish.name}</span>
                  </div>
                )}

                {/* Holes */}
                {req.holesOption && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400 mb-2">Drainage</p>
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3.5 h-3.5 text-charcoal-400" />
                      <span className="text-sm font-medium text-charcoal-800">{req.holesOption}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {req.notes && (
            <div className="bg-white border border-[#EDE7DE] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#EDE7DE] bg-[#FAF7F4]">
                <FileText className="w-4 h-4 text-terracotta" />
                <h2 className="font-heading font-semibold text-sm text-charcoal-900">Additional Notes</h2>
              </div>
              <div className="p-5">
                <p className="text-sm text-charcoal-700 leading-relaxed">{req.notes}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Meta */}
          <div className="bg-white border border-[#EDE7DE] rounded-2xl p-5 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-charcoal-400">Request Details</p>
            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-charcoal-400">Submitted</p>
                  <p className="text-xs font-semibold text-charcoal-800">
                    {new Date(req.createdAt).toLocaleDateString('en-AE', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <Package className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0" />
                <div>
                  <p className="text-[10px] text-charcoal-400">Quantity</p>
                  <p className="text-xs font-semibold text-charcoal-800">{req.quantity} units</p>
                </div>
              </div>
              {dims.length > 0 && (
                <div className="flex items-center gap-2.5">
                  <Ruler className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0" />
                  <div>
                    <p className="text-[10px] text-charcoal-400">Dimensions</p>
                    <p className="text-xs font-semibold text-charcoal-800">{dims.length} specified</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Reference images */}
          {images.length > 0 && (
            <div className="bg-white border border-[#EDE7DE] rounded-2xl overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#EDE7DE] bg-[#FAF7F4]">
                <ImageIcon className="w-4 h-4 text-terracotta" />
                <h2 className="font-heading font-semibold text-sm text-charcoal-900">Reference Images</h2>
                <span className="ml-auto text-[10px] font-bold text-charcoal-400">{images.length}</span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2">
                {images.map((img, i) => (
                  <a key={i} href={img.url} target="_blank" rel="noopener noreferrer"
                    className="block aspect-square rounded-xl overflow-hidden border border-[#EDE7DE] hover:opacity-90 transition-opacity">
                    <img src={img.url} alt={img.name || `Reference ${i + 1}`} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
