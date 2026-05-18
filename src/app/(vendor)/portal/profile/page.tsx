import { Metadata }          from 'next'
import { getServerSession }   from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions }        from '@/lib/auth'
import { prisma }             from '@/lib/prisma'
import {
  Building2, Mail, Phone, Globe, MapPin, ShieldCheck,
  Clock, Calendar, FileCheck, AlertTriangle, XCircle,
  MessageSquare, Hash,
} from 'lucide-react'
import { VendorLogoUpload } from '@/components/vendor/VendorLogoUpload'

export const metadata: Metadata = { title: 'My Profile — Forestry Vendor Portal' }

/* ── Helpers ─────────────────────────────────────────────────────── */
function initials(name: string | null) {
  if (!name) return 'V'
  return name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()
}
function fmtDate(d: Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtDateTime(d: Date | null | undefined) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    + ' · ' + new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
}

/* ── Status config ───────────────────────────────────────────────── */
const STATUS_MAP: Record<string, { label: string; cls: string; dot: string; Icon: React.ElementType }> = {
  APPROVED: { label: 'Approved',         cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-400', Icon: ShieldCheck   },
  PENDING:  { label: 'Pending Approval', cls: 'bg-amber-50  text-amber-700  border-amber-200',    dot: 'bg-amber-400',   Icon: Clock         },
  REJECTED: { label: 'Rejected',         cls: 'bg-rose-50   text-rose-700   border-rose-200',     dot: 'bg-rose-400',    Icon: XCircle       },
}

function StatusBadge({ status }: { status: string }) {
  const cfg  = STATUS_MAP[status] ?? STATUS_MAP.PENDING
  const Icon = cfg.Icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${cfg.cls}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  )
}

/* ── Field ───────────────────────────────────────────────────────── */
function Field({ icon: Icon, label, value }: {
  icon:  React.ElementType
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-[#F0EBE3] last:border-b-0">
      <div className="w-7 h-7 rounded-lg bg-cream-dark flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5 text-charcoal-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-charcoal-400 mb-0.5">{label}</p>
        <div className="text-sm font-semibold text-charcoal-900 break-words">{value}</div>
      </div>
    </div>
  )
}

/* ── Section card ────────────────────────────────────────────────── */
function Section({ label, children, className = '' }: {
  label:      string
  children:   React.ReactNode
  className?: string
}) {
  return (
    <div className={`bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden ${className}`}>
      <div className="px-5 py-3 border-b border-[#F0EBE3] bg-cream/50">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-400">{label}</p>
      </div>
      <div className="px-5">{children}</div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */
export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'VENDOR') redirect('/login')

  const user = await prisma.user.findUnique({
    where:   { id: session.user.id },
    include: { vendorProfile: true },
  })
  if (!user || !user.vendorProfile) notFound()

  const vp   = user.vendorProfile
  const ini  = initials(user.name)
  const scfg = STATUS_MAP[vp.status] ?? STATUS_MAP.PENDING

  return (
    <div className="space-y-5">

      {/* ══ HERO ═══════════════════════════════════════════════════ */}
      <div className="relative rounded-2xl overflow-hidden shadow-warm">
        <div className="absolute inset-0 bg-gradient-to-br from-[#FAF6F1] via-cream to-[#F0E8DC]" />
        <div className="absolute -top-10 right-24 w-72 h-72 rounded-full bg-terracotta/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-32 w-48 h-48 rounded-full bg-terracotta/5 blur-2xl pointer-events-none" />

        {/* Main hero row */}
        <div className="relative px-8 py-8 flex items-center gap-7">

          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-warm bg-gradient-to-br from-terracotta to-terracotta-dark flex items-center justify-center">
              {vp.logoUrl ? (
                <img src={vp.logoUrl} alt={user.name ?? 'Logo'} className="w-full h-full object-cover" />
              ) : (
                <span className="font-heading text-3xl font-bold text-white leading-none tracking-wide">{ini}</span>
              )}
            </div>
            {user.isActive && (
              <span className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 ring-[3px] ring-cream" />
            )}
          </div>

          {/* Identity block */}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-terracotta mb-1.5">Vendor Account</p>
            <h1 className="font-heading text-3xl font-bold text-charcoal-900 leading-tight mb-1">{user.name ?? 'Vendor'}</h1>
            <p className="text-sm text-charcoal-400 mb-4">{user.email}</p>
            <StatusBadge status={vp.status} />
          </div>

          {/* Right: 3 quick-stat pills */}
          <div className="hidden lg:flex flex-col gap-2 flex-shrink-0">
            {/* Company */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/70 border border-[#E8E0D5]">
              <Building2 className="w-3.5 h-3.5 text-terracotta flex-shrink-0" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Company</p>
                <p className="text-xs font-semibold text-charcoal-800 leading-tight">{vp.companyName}</p>
              </div>
            </div>
            {/* Member since */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/70 border border-[#E8E0D5]">
              <Calendar className="w-3.5 h-3.5 text-charcoal-400 flex-shrink-0" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Member since</p>
                <p className="text-xs font-semibold text-charcoal-800 leading-tight">{fmtDate(user.createdAt)}</p>
              </div>
            </div>
            {/* Status */}
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/70 border border-[#E8E0D5]">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${scfg.dot}`} />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-charcoal-400">Account status</p>
                <p className="text-xs font-semibold text-charcoal-800 leading-tight">
                  {user.isActive ? 'Active' : 'Inactive'} · {scfg.label}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom metadata strip */}
        <div className="relative px-8 py-3 border-t border-[#E8E0D5] bg-cream/60 flex items-center gap-5 flex-wrap">
          {vp.tradeLicense && (
            <span className="flex items-center gap-1.5 text-xs text-charcoal-400">
              <FileCheck className="w-3.5 h-3.5 text-charcoal-300" />
              <span className="font-medium">TL:</span> {vp.tradeLicense}
            </span>
          )}
          {(vp.city || vp.country) && (
            <span className="flex items-center gap-1.5 text-xs text-charcoal-400">
              <MapPin className="w-3.5 h-3.5 text-charcoal-300" />
              {[vp.city, vp.country].filter(Boolean).join(', ')}
            </span>
          )}
          {vp.website && (
            <a href={vp.website} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-charcoal-400 hover:text-terracotta transition-colors">
              <Globe className="w-3.5 h-3.5 text-charcoal-300" />
              {vp.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {user.lastLoginAt && (
            <span className="flex items-center gap-1.5 text-xs text-charcoal-300 ml-auto">
              <Clock className="w-3.5 h-3.5" />
              Last login {fmtDateTime(user.lastLoginAt)}
            </span>
          )}
        </div>
      </div>

      {/* ══ LOGO UPLOAD ════════════════════════════════════════════ */}
      <VendorLogoUpload initialLogoUrl={vp.logoUrl ?? null} companyName={vp.companyName} />

      {/* ══ 3-COLUMN INFO GRID ═════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* Contact */}
        <Section label="Contact Details">
          <Field icon={Mail}  label="Email address" value={user.email ?? '—'} />
          <Field icon={Phone} label="Phone"          value={
            user.phone
              ? user.phone
              : <span className="text-charcoal-300 font-normal italic text-xs">Not provided</span>
          } />
        </Section>

        {/* Company */}
        <Section label="Company">
          <Field icon={Building2} label="Company name"  value={vp.companyName} />
          {vp.tradeLicense && (
            <Field icon={Hash} label="Trade licence" value={vp.tradeLicense} />
          )}
          {(vp.city || vp.country) && (
            <Field icon={MapPin} label="Location" value={[vp.city, vp.country].filter(Boolean).join(', ')} />
          )}
          {vp.website && (
            <Field icon={Globe} label="Website" value={
              <a href={vp.website} target="_blank" rel="noopener noreferrer"
                className="text-terracotta hover:text-terracotta-dark transition-colors break-all">
                {vp.website.replace(/^https?:\/\//, '')}
              </a>
            } />
          )}
        </Section>

        {/* Timeline */}
        <Section label="Account Timeline">
          <Field icon={Calendar}    label="Joined"      value={fmtDate(user.createdAt)} />
          <Field icon={Clock}       label="Last login"  value={fmtDateTime(user.lastLoginAt)} />
          {vp.approvedAt && (
            <Field icon={ShieldCheck} label="Approved on" value={fmtDate(vp.approvedAt)} />
          )}
          {vp.rejectedAt && vp.rejectionNote && (
            <Field icon={AlertTriangle} label="Rejection note" value={
              <span className="text-rose-600">{vp.rejectionNote}</span>
            } />
          )}
        </Section>
      </div>

      {/* ══ SUPPORT CTA ════════════════════════════════════════════ */}
      <div className="flex items-center gap-5 px-6 py-5 rounded-2xl border border-[#E8E0D5] bg-white shadow-card">
        <div className="w-11 h-11 rounded-xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
          <MessageSquare className="w-5 h-5 text-terracotta" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-charcoal-900">Need to update your details?</p>
          <p className="text-xs text-charcoal-400 mt-0.5">
            Contact our support team to update your profile or company information.
          </p>
        </div>
        <a
          href="mailto:support@forestry.ae"
          className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 bg-terracotta hover:bg-terracotta-dark text-white text-xs font-bold rounded-xl transition-colors shadow-warm-sm"
        >
          <Mail className="w-3.5 h-3.5" />
          Email Support
        </a>
      </div>

    </div>
  )
}
