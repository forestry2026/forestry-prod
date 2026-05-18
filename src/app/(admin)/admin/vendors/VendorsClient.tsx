'use client'

import React, { useState, useMemo, useTransition, useEffect, useRef } from 'react'
import Link           from 'next/link'
import { useRouter }  from 'next/navigation'
import {
  Search, X, Truck, KeyRound, Send,
  CheckCircle, Copy, AlertTriangle, Mail, Clock,
  RefreshCw, ArrowRight, Building2, Trash2,
  XCircle, Phone, Globe, FileText, MessageSquare,
  ChevronDown, Paperclip, ExternalLink, ShieldOff,
  RotateCcw, UserPlus, Plus, Check, MapPin, BadgeCheck,
} from 'lucide-react'
import { DeleteConfirmDialog } from '@/components/admin/DeleteConfirmDialog'
import CountrySelect             from '@/components/ui/CountrySelect'
import PhoneInput                from '@/components/ui/PhoneInput'
import { COUNTRIES }             from '@/lib/countries'

/* ── Vendor (VendorProfile) types + config ─────────────────────── */
const VENDOR_STATUS_CFG: Record<string, { label: string; badge: string; dot: string; avatar: string }> = {
  APPROVED: { label: 'Approved', badge: 'bg-sage/15 text-sage-600',   dot: 'bg-sage-500',  avatar: '#87A878' },
  PENDING:  { label: 'Pending',  badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400', avatar: '#B07D2A' },
  REJECTED: { label: 'Rejected', badge: 'bg-red-50 text-red-600',     dot: 'bg-red-400',   avatar: '#9CA3AF' },
}

interface Vendor {
  id:          string
  companyName: string
  logoUrl:     string | null
  status:      string
  rfpCount:    number
  approvedAt:  string | null
  lastSentAt:  string | null
  createdAt:   string
  city?:       string | null
  country?:    string | null
  user:        { email: string; name: string }
}

/* ── AccessRequest types ───────────────────────────────────────── */
interface AccessRequest {
  id:               string
  name:             string
  email:            string
  companyName:      string
  phone:            string
  country:          string | null
  tradeLicense:     string | null
  documents:        string | null   // JSON array of file paths
  message:          string | null
  status:           string          // PENDING | APPROVED | REJECTED
  processedAt:      string | null
  createdAt:        string
  vendorProfileId:  string | null
  vendorApprovedAt: string | null
  vendorLastSentAt: string | null
}

interface ApprovalResult  { email: string; password: string; emailSent: boolean }
interface ResendResult     { email: string; password: string; emailSent: boolean }

/* ── Helpers ───────────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
function parseDocs(raw: string | null): string[] {
  if (!raw) return []
  try { return JSON.parse(raw) } catch { return [] }
}
function isImage(path: string) { return /\.(jpg|jpeg|png|webp)$/i.test(path) }

function AppStatusChip({ status }: { status: string }) {
  if (status === 'APPROVED') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700">
      <CheckCircle className="w-3 h-3" /> Approved
    </span>
  )
  if (status === 'REJECTED') return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-600">
      <XCircle className="w-3 h-3" /> Rejected
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700">
      <Clock className="w-3 h-3" /> Pending
    </span>
  )
}

/* ── CopyField (inline) ─────────────────────────────────────────── */
function VCopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div>
      {label && <p className="text-xs font-semibold text-charcoal-500 mb-1.5">{label}</p>}
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-charcoal-900 text-emerald-400 text-sm font-mono rounded-lg tracking-wide truncate">
          {value}
        </code>
        <button
          onClick={copy}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${
            copied ? 'bg-emerald-100 text-emerald-700' : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

/* ── AddVendorModal ─────────────────────────────────────────────── */
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png', 'webp']
const MAX_FILE_MB         = 10
const MAX_FILES           = 5

interface CreatedVendor {
  vendorId:     string
  userId:       string
  email:        string
  tempPassword: string
}

function AddVendorModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  /* Company */
  const [companyName,  setCompanyName]  = useState('')
  const [countryCode,  setCountryCode]  = useState('AE')
  const [city,         setCity]         = useState('')
  const [tradeLicense, setTradeLicense] = useState('')
  const [website,      setWebsite]      = useState('')
  const [address,      setAddress]      = useState('')
  const [notes,        setNotes]        = useState('')
  /* Contact */
  const [contactName,  setContactName]  = useState('')
  const [email,        setEmail]        = useState('')
  const [phone,        setPhone]        = useState('')
  const [phoneDialCode,setPhoneDialCode]= useState('+971')
  /* Documents */
  const [docFiles,     setDocFiles]     = useState<File[]>([])
  const [dragOver,     setDragOver]     = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  /* UI */
  const [err,    setErr]    = useState<string | null>(null)
  const [saving, startSave] = useTransition()
  const [sending,startSend] = useTransition()
  const [created, setCreated] = useState<CreatedVendor | null>(null)

  useEffect(() => {
    function esc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  function addFiles(list: FileList | File[] | null) {
    if (!list) return
    const valid = Array.from(list).filter(f => {
      const ext = f.name.split('.').pop()?.toLowerCase() ?? ''
      return ALLOWED_EXTENSIONS.includes(ext) && f.size <= MAX_FILE_MB * 1024 * 1024
    })
    setDocFiles(prev => [...prev, ...valid].slice(0, MAX_FILES))
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault(); setDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  function handleCreate() {
    startSave(async () => {
      setErr(null)
      // 1. Upload documents
      const paths: string[] = []
      for (const file of docFiles) {
        const fd = new window.FormData()
        fd.append('file', file)
        const up   = await fetch('/api/upload', { method: 'POST', body: fd })
        const upj  = await up.json().catch(() => ({}))
        if (!up.ok) { setErr((upj as any).error ?? 'File upload failed'); return }
        paths.push((upj as any).path)
      }
      // 2. Resolve country name from ISO code
      const countryName = COUNTRIES.find(c => c.code === countryCode)?.name ?? countryCode
      // 3. Create vendor
      const res  = await fetch('/api/admin/vendors', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          companyName, contactName, email,
          phone: phone.trim() ? `${phoneDialCode} ${phone.trim().replace(/^0+/, '')}` : undefined,
          country: countryName, city, tradeLicense, website, address, notes,
          documents: paths,
        }),
      })
      const data = await res.json().catch(() => ({ error: `Server error (${res.status})` }))
      if (!res.ok) { setErr((data as any).error ?? 'Something went wrong'); return }
      setCreated(data)
    })
  }

  function handleSendEmail() {
    if (!created) return
    startSend(async () => {
      await fetch(`/api/admin/vendors/${created.vendorId}/send-credentials`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tempPassword: created.tempPassword }),
      })
      onDone()
    })
  }

  const countryName = COUNTRIES.find(c => c.code === countryCode)?.name ?? countryCode
  const canSubmit   = companyName.trim() && contactName.trim() && email.trim()

  /* ── Step 2: Credential preview ── */
  if (created) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-white rounded-2xl border border-[#E8E0D5] shadow-card-lg w-full max-w-md overflow-hidden">
          <div className="flex items-start justify-between px-6 py-4 border-b border-[#E8E0D5] bg-cream">
            <div>
              <h2 className="font-heading text-base font-bold text-charcoal-900">Vendor Account Created</h2>
              <p className="text-xs text-charcoal-400 mt-0.5">Review and share credentials with the vendor</p>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-700 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center gap-2.5 px-3.5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <BadgeCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-sm font-semibold text-emerald-800">Account created and automatically approved</p>
            </div>
            <div className="flex items-center gap-3 p-3.5 bg-cream rounded-xl border border-[#E8E0D5]">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ backgroundColor: '#87A878' }}>
                {companyName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-charcoal-900 truncate">{companyName}</p>
                <p className="text-xs text-charcoal-400 truncate">{contactName} · {countryName}</p>
              </div>
              <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-sage/15 text-sage-600 flex-shrink-0">
                <CheckCircle className="w-2.5 h-2.5" /> Approved
              </span>
            </div>
            <div className="rounded-xl border border-[#E8E0D5] overflow-hidden">
              <div className="px-4 py-2.5 bg-charcoal-900 border-b border-charcoal-800">
                <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal-400">Login Credentials</p>
              </div>
              <div className="p-4 space-y-3 bg-charcoal-900">
                <VCopyField label="Username (Email)" value={created.email} />
                <VCopyField label="Password"         value={created.tempPassword} />
              </div>
            </div>
            <p className="text-[11px] text-charcoal-400 flex items-start gap-1.5">
              <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
              Copy and share these credentials securely. The password cannot be retrieved after this screen.
            </p>
            <div className="flex items-center gap-2.5 pt-1">
              <button onClick={handleSendEmail} disabled={sending}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50">
                {sending ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Mail className="w-4 h-4" />}
                {sending ? 'Sending…' : 'Send via Email'}
              </button>
              <button onClick={onDone}
                className="flex-1 inline-flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold text-charcoal-600 bg-cream hover:bg-cream-dark border border-[#E8E0D5] transition-colors">
                Done without email
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Step 1: Form ── */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl border border-[#E8E0D5] shadow-card-lg w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#E8E0D5] bg-cream flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4 text-terracotta" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-charcoal-900">Add Vendor</h2>
              <p className="text-xs text-charcoal-400 mt-0.5">New account created and immediately approved</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-700 transition-colors mt-0.5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-5">

          {/* ── Company Information ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-terracotta mb-3">Company Information</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Company Name *</label>
                <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                  className="form-input" placeholder="Acme Furniture LLC" autoFocus />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Trade License No.</label>
                <input type="text" value={tradeLicense} onChange={e => setTradeLicense(e.target.value)}
                  className="form-input" placeholder="TL-123456" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">City</label>
                <input type="text" value={city} onChange={e => setCity(e.target.value)}
                  className="form-input" placeholder="Dubai" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Country</label>
                <CountrySelect value={countryCode} onChange={setCountryCode} />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Address</label>
                <input type="text" value={address} onChange={e => setAddress(e.target.value)}
                  className="form-input" placeholder="123 Business Bay, Sheikh Zayed Rd" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Website</label>
                <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
                  className="form-input" placeholder="https://acmefurniture.ae" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Internal Notes</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2}
                  className="form-input resize-none" placeholder="Internal notes about this vendor…" />
              </div>
            </div>
          </div>

          {/* ── Documents ── */}
          <div className="border-t border-[#E8E0D5] pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-terracotta mb-3">Documents</p>
            <p className="text-xs text-charcoal-400 mb-3">Trade licence copy, tax certificate, or any other relevant documents.</p>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl px-5 py-6 text-center cursor-pointer transition-all select-none ${
                dragOver
                  ? 'border-terracotta bg-terracotta/5'
                  : 'border-[#E8E0D5] hover:border-terracotta/40 hover:bg-cream/60'
              }`}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-9 h-9 rounded-xl bg-terracotta/10 flex items-center justify-center mb-1">
                  <Paperclip className="w-4 h-4 text-terracotta" />
                </div>
                <p className="text-sm font-semibold text-charcoal-700">
                  {dragOver ? 'Drop files here' : 'Click to upload or drag & drop'}
                </p>
                <p className="text-xs text-charcoal-400">PDF, JPG, PNG — up to {MAX_FILE_MB}MB each · max {MAX_FILES} files</p>
              </div>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp"
                className="hidden"
                onChange={e => addFiles(e.target.files)}
              />
            </div>

            {/* File list */}
            {docFiles.length > 0 && (
              <ul className="mt-3 space-y-2">
                {docFiles.map((f, i) => (
                  <li key={i} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-cream border border-[#E8E0D5]">
                    <FileText className="w-4 h-4 text-terracotta flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-charcoal-800 truncate">{f.name}</p>
                      <p className="text-[10px] text-charcoal-400">{(f.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setDocFiles(prev => prev.filter((_, idx) => idx !== i)) }}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-charcoal-400 hover:bg-rose-50 hover:text-rose-500 transition-colors flex-shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── Contact Person ── */}
          <div className="border-t border-[#E8E0D5] pt-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-terracotta mb-3">Contact Person</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Full Name *</label>
                <input type="text" value={contactName} onChange={e => setContactName(e.target.value)}
                  className="form-input" placeholder="Mohammed Al Zaabi" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Email Address *</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="form-input" placeholder="vendor@acmefurniture.ae" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Phone</label>
                <PhoneInput
                  countryCode={phoneDialCode}
                  phone={phone}
                  onCountryCodeChange={setPhoneDialCode}
                  onPhoneChange={setPhone}
                  placeholder="50 123 4567"
                />
              </div>
            </div>
          </div>

          {err && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700 font-medium">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />{err}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#E8E0D5] bg-cream/40 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={handleCreate}
            disabled={saving || !canSubmit}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-warm-sm"
          >
            {saving
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating…</>
              : <><Plus className="w-4 h-4" /> Create Vendor</>
            }
          </button>
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-charcoal-600 hover:bg-cream-dark transition-colors border border-[#E8E0D5]">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Props ─────────────────────────────────────────────────────── */
interface Props {
  vendors:             Vendor[]
  statusCounts:        Record<string, number>
  accessRequests:      AccessRequest[]
  accessRequestCounts: Record<string, number>  // PENDING | APPROVED | REJECTED
  readonly?:           boolean
}

/* ── Main component ────────────────────────────────────────────── */
export default function VendorsClient({ vendors, statusCounts, accessRequests, accessRequestCounts, readonly = false }: Props) {
  const router = useRouter()

  /* ── Section / tab state ── */
  // activeSection: 'APPLICATIONS' | vendor status key ('ALL' | 'APPROVED' | 'PENDING' | 'REJECTED')
  const [activeSection,  setActiveSection]  = useState('ALL')
  const [appSubFilter,   setAppSubFilter]   = useState('PENDING')  // sub-tab when in APPLICATIONS
  const [query,          setQuery]          = useState('')

  const isApplications = activeSection === 'APPLICATIONS'

  /* ── Filtered vendors ── */
  const filteredVendors = useMemo(() => {
    let list = vendors
    if (activeSection !== 'ALL' && activeSection !== 'APPLICATIONS') {
      list = list.filter(v => v.status === activeSection)
    }
    if (query.trim() && !isApplications) {
      const q = query.toLowerCase()
      list = list.filter(v =>
        v.companyName.toLowerCase().includes(q) ||
        v.user.name.toLowerCase().includes(q)   ||
        v.user.email.toLowerCase().includes(q)  ||
        (v.city ?? '').toLowerCase().includes(q) ||
        v.status.toLowerCase().includes(q)
      )
    }
    return list
  }, [vendors, activeSection, query, isApplications])

  /* ── Filtered access requests ── */
  const filteredApps = useMemo(() => {
    let list = accessRequests
    if (appSubFilter !== 'ALL') list = list.filter(r => r.status === appSubFilter)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(r =>
        r.name.toLowerCase().includes(q)        ||
        r.email.toLowerCase().includes(q)       ||
        r.companyName.toLowerCase().includes(q) ||
        r.status.toLowerCase().includes(q)
      )
    }
    return list
  }, [accessRequests, appSubFilter, query])

  /* ── Stat counts ── */
  const approvedCount = statusCounts['APPROVED'] ?? 0
  const pendingCount  = statusCounts['PENDING']  ?? 0
  const appPending    = accessRequestCounts['PENDING']  ?? 0
  const appApproved   = accessRequestCounts['APPROVED'] ?? 0
  const appRejected   = accessRequestCounts['REJECTED'] ?? 0

  /* ═══════════════════════════════════════════════════════════════
     Vendor modal state (Login Details / Resend)
  ═══════════════════════════════════════════════════════════════ */
  const [addVendorOpen, setAddVendorOpen] = useState(false)
  const [isPending,     startTransition]  = useTransition()
  const [activeVendor,  setActiveVendor]  = useState<Vendor | null>(null)
  const [resendResult,  setResendResult]  = useState<ResendResult | null>(null)
  const [apiError,      setApiError]      = useState<string | null>(null)
  const [copied,        setCopied]        = useState<string | null>(null)
  const [confirming,    setConfirming]    = useState(false)
  const [deleteVendor,  setDeleteVendor]  = useState<Vendor | null>(null)
  const [deleteError,   setDeleteError]   = useState<string | null>(null)
  const [isDeleting,    setIsDeleting]    = useState(false)

  function openVendorModal(v: Vendor) {
    setActiveVendor(v); setResendResult(null); setApiError(null); setConfirming(false)
  }
  function closeVendorModal() {
    setActiveVendor(null); setResendResult(null); setApiError(null); setConfirming(false)
  }
  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }
  function handleVendorResend() {
    if (!activeVendor) return
    setApiError(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/vendors/${activeVendor.id}/resend-credentials`, { method: 'POST' })
        const j   = await res.json()
        if (!res.ok) { setApiError(j.error ?? 'Failed to resend.'); setConfirming(false) }
        else { setResendResult({ email: j.credentials.email, password: j.credentials.password, emailSent: j.emailSent }); setConfirming(false) }
      } catch { setApiError('Network error.'); setConfirming(false) }
    })
  }
  async function handleDeleteVendor() {
    if (!deleteVendor) return
    setIsDeleting(true); setDeleteError(null)
    try {
      const res = await fetch(`/api/vendors/${deleteVendor.id}`, { method: 'DELETE' })
      const j   = await res.json()
      if (!res.ok) { setDeleteError(j.error ?? 'Failed to delete vendor.'); setIsDeleting(false) }
      else { setDeleteVendor(null); router.refresh() }
    } catch { setDeleteError('Network error.'); setIsDeleting(false) }
  }

  /* ═══════════════════════════════════════════════════════════════
     Access Request action state
  ═══════════════════════════════════════════════════════════════ */
  const [rejectId,       setRejectId]       = useState<string | null>(null)
  const [rejectReason,   setRejectReason]   = useState('')
  const [revokeReq,      setRevokeReq]      = useState<AccessRequest | null>(null)
  const [revokeReason,   setRevokeReason]   = useState('')
  const [actionErr,      setActionErr]      = useState<string | null>(null)
  const [expanded,       setExpanded]       = useState<string | null>(null)
  const [approvalResult, setApprovalResult] = useState<ApprovalResult | null>(null)
  const [loginReq,       setLoginReq]       = useState<AccessRequest | null>(null)
  const [appResendResult,setAppResendResult]= useState<ResendResult | null>(null)
  const [appResendErr,   setAppResendErr]   = useState<string | null>(null)
  const [appConfirming,  setAppConfirming]  = useState(false)

  function approveApp(id: string) {
    setActionErr(null)
    startTransition(async () => {
      const res = await fetch(`/api/access-requests/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve' }),
      })
      const j = await res.json()
      if (!res.ok) { setActionErr(j.error || 'Approval failed') }
      else {
        setApprovalResult({ email: j.credentials.email, password: j.credentials.password, emailSent: j.emailSent })
        router.refresh()
      }
    })
  }
  function rejectApp(id: string) {
    setActionErr(null)
    startTransition(async () => {
      const res = await fetch(`/api/access-requests/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason: rejectReason.trim() || undefined }),
      })
      if (!res.ok) { const j = await res.json(); setActionErr(j.error || 'Rejection failed') }
      else { setRejectId(null); setRejectReason(''); router.refresh() }
    })
  }
  function revokeApp(id: string) {
    setActionErr(null)
    startTransition(async () => {
      const res = await fetch(`/api/access-requests/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', reason: revokeReason.trim() || undefined }),
      })
      if (!res.ok) { const j = await res.json(); setActionErr(j.error || 'Revoke failed') }
      else { setRevokeReq(null); setRevokeReason(''); router.refresh() }
    })
  }
  function reapproveApp(id: string) {
    setActionErr(null)
    startTransition(async () => {
      const res = await fetch(`/api/access-requests/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reapprove' }),
      })
      const j = await res.json()
      if (!res.ok) { setActionErr(j.error || 'Re-approval failed') }
      else {
        setApprovalResult({ email: j.credentials.email, password: j.credentials.password, emailSent: j.emailSent })
        router.refresh()
      }
    })
  }
  function openAppLoginModal(req: AccessRequest) {
    setLoginReq(req); setAppResendResult(null); setAppResendErr(null); setAppConfirming(false)
  }
  function closeAppLoginModal() {
    setLoginReq(null); setAppResendResult(null); setAppResendErr(null); setAppConfirming(false)
  }
  function handleAppResend() {
    if (!loginReq?.vendorProfileId) return
    setAppResendErr(null)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/vendors/${loginReq.vendorProfileId}/resend-credentials`, { method: 'POST' })
        const j   = await res.json()
        if (!res.ok) { setAppResendErr(j.error ?? 'Failed to send.'); setAppConfirming(false) }
        else { setAppResendResult({ email: j.credentials.email, password: j.credentials.password, emailSent: j.emailSent }); setAppConfirming(false); router.refresh() }
      } catch { setAppResendErr('Network error.'); setAppConfirming(false) }
    })
  }

  /* ═══════════════════════════════════════════════════════════════
     Render
  ═══════════════════════════════════════════════════════════════ */

  const VENDOR_TABS = [
    { key: 'ALL',      label: 'All'      },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'PENDING',  label: 'Pending'  },
    { key: 'REJECTED', label: 'Rejected' },
  ]
  const APP_SUB_TABS = [
    { key: 'PENDING',  label: 'Pending'  },
    { key: 'APPROVED', label: 'Approved' },
    { key: 'REJECTED', label: 'Rejected' },
    { key: 'ALL',      label: 'All'      },
  ]
  const appSubCounts: Record<string, number> = {
    PENDING: appPending, APPROVED: appApproved, REJECTED: appRejected,
    ALL: appPending + appApproved + appRejected,
  }

  return (
    <>
      <div className="space-y-6">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Admin Portal</p>
            <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Vendors</h1>
            <p className="text-sm text-charcoal-400 mt-1.5">
              {isApplications ? 'Review incoming vendor access applications' : 'Manage vendor profiles and credentials'}
            </p>
          </div>

          {/* Stat pills + Add Vendor */}
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {isApplications ? (
              <>
                <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
                  <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{appPending + appApproved + appRejected}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Total</span>
                </div>
                {appPending > 0 && (
                  <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="font-heading text-2xl font-bold text-amber-700 leading-none">{appPending}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 mt-0.5">Pending</span>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
                  <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{vendors.length}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Total</span>
                </div>
                {approvedCount > 0 && (
                  <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-sage/10 border border-sage/20">
                    <span className="font-heading text-2xl font-bold text-sage-600 leading-none">{approvedCount}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-sage-600/70 mt-0.5">Approved</span>
                  </div>
                )}
                {pendingCount > 0 && (
                  <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-amber-50 border border-amber-100">
                    <span className="font-heading text-2xl font-bold text-amber-700 leading-none">{pendingCount}</span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-600/70 mt-0.5">Pending</span>
                  </div>
                )}
                {!readonly && (
                  <button
                    onClick={() => setAddVendorOpen(true)}
                    className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-warm-sm"
                  >
                    <Plus className="w-4 h-4" />
                    Add Vendor
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* ── Top section tabs ─────────────────────────────────── */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">

          {/* Applications tab */}
          <button
            onClick={() => { setActiveSection('APPLICATIONS'); setQuery('') }}
            className={`
              flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0
              ${activeSection === 'APPLICATIONS'
                ? 'bg-charcoal-900 text-white shadow-sm'
                : 'bg-white border border-[#E8E0D5] text-charcoal-500 hover:border-charcoal-300 hover:text-charcoal-700'
              }
            `}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Applications
            {appPending > 0 && (
              <span className={`
                inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none
                ${activeSection === 'APPLICATIONS' ? 'bg-amber-400 text-white' : 'bg-amber-100 text-amber-700'}
              `}>
                {appPending}
              </span>
            )}
          </button>

          {/* Divider */}
          <div className="w-px h-5 bg-[#E8E0D5] flex-shrink-0 mx-0.5" />

          {/* Vendor status tabs */}
          {VENDOR_TABS.map(tab => {
            const count  = tab.key === 'ALL' ? vendors.length : (statusCounts[tab.key] ?? 0)
            const active = activeSection === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveSection(tab.key); setQuery('') }}
                className={`
                  flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0
                  ${active
                    ? 'bg-charcoal-900 text-white shadow-sm'
                    : 'bg-white border border-[#E8E0D5] text-charcoal-500 hover:border-charcoal-300 hover:text-charcoal-700'
                  }
                `}
              >
                {tab.label}
                {count > 0 && (
                  <span className={`
                    inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none
                    ${active ? 'bg-white/20 text-white' : 'bg-charcoal-100 text-charcoal-500'}
                  `}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* ── Search ───────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300 pointer-events-none" />
          <input
            type="text"
            placeholder={isApplications ? 'Search by name, email, or company…' : 'Search by company, contact name, or email…'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border border-[#E8E0D5] rounded-xl text-sm text-charcoal-900 placeholder-charcoal-300 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 transition-all"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-charcoal-100 hover:bg-charcoal-200 text-charcoal-500 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            APPLICATIONS VIEW
        ══════════════════════════════════════════════════════ */}
        {isApplications && (
          <>
            {/* Action error */}
            {actionErr && (
              <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {actionErr}
              </div>
            )}

            {/* App status sub-tabs */}
            <div className="flex gap-1 bg-cream rounded-xl p-1 w-fit">
              {APP_SUB_TABS.map(tab => {
                const active = appSubFilter === tab.key
                return (
                  <button key={tab.key} onClick={() => setAppSubFilter(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      active ? 'bg-white text-terracotta shadow-sm' : 'text-charcoal-500 hover:text-charcoal-700'
                    }`}
                  >
                    {tab.label}
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      active ? 'bg-terracotta/10 text-terracotta' : 'bg-charcoal-100 text-charcoal-400'
                    }`}>
                      {appSubCounts[tab.key]}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* Applications table */}
            <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
              {filteredApps.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-5">
                    <UserPlus className="w-6 h-6 text-terracotta/40" />
                  </div>
                  <p className="font-heading text-lg font-bold text-charcoal-900 mb-1">
                    {query ? 'No matching applications' : `No ${appSubFilter !== 'ALL' ? appSubFilter.toLowerCase() : ''} applications`}
                  </p>
                  <p className="text-sm text-charcoal-400">
                    {query ? `No results for "${query}"` : 'Applications will appear here when vendors apply for access.'}
                  </p>
                  {(query || appSubFilter !== 'PENDING') && (
                    <button onClick={() => { setQuery(''); setAppSubFilter('PENDING') }}
                      className="mt-4 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-cream border-b border-[#E8E0D5]">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-400 uppercase tracking-wider">Applicant</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-400 uppercase tracking-wider">Company</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-400 uppercase tracking-wider hidden md:table-cell">Contact</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-400 uppercase tracking-wider hidden lg:table-cell">Submitted</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-charcoal-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-charcoal-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E0D5]">
                    {filteredApps.map(req => (
                      <React.Fragment key={req.id}>
                        <tr
                          className="hover:bg-cream/40 transition-colors cursor-pointer"
                          onClick={() => setExpanded(expanded === req.id ? null : req.id)}
                        >
                          {/* Applicant */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-terracotta/10 flex items-center justify-center flex-shrink-0 text-terracotta font-bold text-sm">
                                {req.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-charcoal-900 text-sm">{req.name}</div>
                                <div className="text-xs text-charcoal-400 flex items-center gap-1 mt-0.5">
                                  <Mail className="w-3 h-3" /> {req.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Company */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-charcoal-300 flex-shrink-0" />
                              <div>
                                <div className="font-semibold text-charcoal-900 text-sm">{req.companyName}</div>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                  {req.tradeLicense && (
                                    <div className="text-xs text-charcoal-400 flex items-center gap-1">
                                      <FileText className="w-3 h-3" /> {req.tradeLicense}
                                    </div>
                                  )}
                                  {parseDocs(req.documents).length > 0 && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-terracotta/10 text-terracotta text-xs font-semibold">
                                      <Paperclip className="w-3 h-3" />
                                      {parseDocs(req.documents).length} file{parseDocs(req.documents).length > 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Contact */}
                          <td className="px-6 py-4 hidden md:table-cell">
                            <div className="text-sm text-charcoal-500 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-charcoal-300 flex-shrink-0" /> {req.phone}
                            </div>
                            {req.country && (
                              <div className="text-xs text-charcoal-400 flex items-center gap-1 mt-0.5">
                                <Globe className="w-3 h-3" /> {req.country}
                              </div>
                            )}
                          </td>

                          {/* Date */}
                          <td className="px-6 py-4 text-sm text-charcoal-400 whitespace-nowrap hidden lg:table-cell">
                            {formatDate(req.createdAt)}
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4"><AppStatusChip status={req.status} /></td>

                          {/* Actions */}
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                              {!readonly && req.status === 'PENDING' && (
                                <>
                                  <button onClick={() => approveApp(req.id)} disabled={isPending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50">
                                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                                  </button>
                                  <button onClick={() => { setRejectId(req.id); setRejectReason('') }} disabled={isPending}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50">
                                    <XCircle className="w-3.5 h-3.5" /> Reject
                                  </button>
                                </>
                              )}
                              {req.status === 'APPROVED' && req.vendorProfileId && (
                                <>
                                  <button onClick={() => openAppLoginModal(req)} title="View login details"
                                    className="p-2 rounded-lg border border-[#E8E0D5] text-charcoal-400 hover:border-terracotta hover:text-terracotta transition-colors">
                                    <KeyRound className="w-4 h-4" />
                                  </button>
                                  {!readonly && (
                                    <>
                                      <button onClick={() => { openAppLoginModal(req); setTimeout(() => setAppConfirming(true), 50) }}
                                        title="Send login details email"
                                        className="p-2 rounded-lg border border-[#E8E0D5] text-charcoal-400 hover:border-terracotta hover:text-terracotta transition-colors">
                                        <Send className="w-4 h-4" />
                                      </button>
                                      <button onClick={() => { setRevokeReq(req); setRevokeReason('') }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                                        <ShieldOff className="w-3.5 h-3.5" /> Revoke
                                      </button>
                                    </>
                                  )}
                                </>
                              )}
                              {!readonly && req.status === 'REJECTED' && (
                                <button onClick={() => reapproveApp(req.id)} disabled={isPending}
                                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50">
                                  <RotateCcw className="w-3.5 h-3.5" /> Re-approve
                                </button>
                              )}
                              <ChevronDown className={`w-4 h-4 text-charcoal-300 transition-transform flex-shrink-0 ${expanded === req.id ? 'rotate-180' : ''}`} />
                            </div>
                          </td>
                        </tr>

                        {/* Expanded detail */}
                        {expanded === req.id && (
                          <tr className="bg-cream/40">
                            <td colSpan={6} className="px-6 py-5">
                              <div className="flex flex-col gap-5">
                                <div className="flex flex-col gap-2">
                                  <p className="text-xs font-bold text-charcoal-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <MessageSquare className="w-3.5 h-3.5" /> Message from applicant
                                  </p>
                                  {req.message ? (
                                    <p className="text-sm text-charcoal-700 leading-relaxed bg-white rounded-lg px-4 py-3 border border-[#E8E0D5]">
                                      {req.message}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-charcoal-300 italic">No message provided.</p>
                                  )}
                                </div>
                                {(() => {
                                  const docs = parseDocs(req.documents)
                                  if (docs.length === 0) return null
                                  return (
                                    <div className="flex flex-col gap-2">
                                      <p className="text-xs font-bold text-charcoal-400 uppercase tracking-wider flex items-center gap-1.5">
                                        <Paperclip className="w-3.5 h-3.5" /> Uploaded Documents ({docs.length})
                                      </p>
                                      <div className="flex flex-wrap gap-3">
                                        {docs.map((docPath, i) => {
                                          const img = isImage(docPath)
                                          return (
                                            <a key={i} href={docPath} target="_blank" rel="noopener noreferrer"
                                              className="group flex items-center gap-2.5 bg-white border border-[#E8E0D5] hover:border-terracotta rounded-xl px-3 py-2.5 transition-colors"
                                              onClick={e => e.stopPropagation()}
                                            >
                                              {img ? (
                                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-[#E8E0D5] flex-shrink-0 bg-cream">
                                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                                  <img src={docPath} alt="" className="w-full h-full object-cover" />
                                                </div>
                                              ) : (
                                                <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                                                  <FileText className="w-5 h-5 text-terracotta" />
                                                </div>
                                              )}
                                              <div className="flex flex-col min-w-0">
                                                <span className="text-xs font-semibold text-charcoal-900 truncate max-w-[140px]">
                                                  {img ? 'Image' : 'Document'} {i + 1}
                                                </span>
                                                <span className="text-xs text-charcoal-400 uppercase tracking-wide">
                                                  {docPath.split('.').pop()?.toUpperCase()}
                                                </span>
                                              </div>
                                              <ExternalLink className="w-3.5 h-3.5 text-charcoal-300 group-hover:text-terracotta transition-colors flex-shrink-0" />
                                            </a>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )
                                })()}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════════════
            VENDORS VIEW
        ══════════════════════════════════════════════════════ */}
        {!isApplications && (
          filteredVendors.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card">
              <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-5">
                  <Building2 className="w-6 h-6 text-terracotta/40" />
                </div>
                <p className="font-heading text-lg font-bold text-charcoal-900 mb-1">
                  {query || activeSection !== 'ALL' ? 'No matching vendors' : 'No vendors yet'}
                </p>
                <p className="text-sm text-charcoal-400">
                  {query
                    ? `No results for "${query}"`
                    : activeSection !== 'ALL'
                    ? `No vendors with status "${VENDOR_STATUS_CFG[activeSection]?.label ?? activeSection}"`
                    : 'Vendors will appear here once applications are approved.'}
                </p>
                {(query || activeSection !== 'ALL') && (
                  <button onClick={() => { setQuery(''); setActiveSection('ALL') }}
                    className="mt-4 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors">
                    Clear filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
              {(query || activeSection !== 'ALL') && (
                <div className="px-6 py-3 border-b border-[#E8E0D5] bg-cream/40">
                  <p className="text-xs text-charcoal-400">
                    {filteredVendors.length} result{filteredVendors.length !== 1 ? 's' : ''}
                    {query && <> for <span className="font-semibold text-charcoal-600">"{query}"</span></>}
                  </p>
                </div>
              )}
              <ul className="divide-y divide-[#E8E0D5]">
                {filteredVendors.map(v => {
                  const cfg = VENDOR_STATUS_CFG[v.status] ?? { label: v.status, badge: 'bg-charcoal-100 text-charcoal-600', dot: 'bg-charcoal-300', avatar: '#9CA3AF' }
                  return (
                    <li key={v.id} className="group flex items-center gap-4 px-6 py-4 hover:bg-cream/40 transition-colors">

                      {v.logoUrl ? (
                        <div className="w-11 h-11 rounded-xl border border-[#E8E0D5] bg-cream/60 flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                          <img src={v.logoUrl} alt={v.companyName} className="w-full h-full object-contain p-1" />
                        </div>
                      ) : (
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold tracking-wide shadow-sm"
                          style={{ backgroundColor: cfg.avatar }}>
                          {initials(v.companyName)}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <span className="text-sm font-semibold text-charcoal-900 truncate">{v.companyName}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="text-xs text-charcoal-500 truncate">{v.user.name}</p>
                        <p className="text-[11px] text-charcoal-300 truncate mt-0.5">{v.user.email}</p>
                      </div>

                      <div className="flex-shrink-0 hidden lg:block text-right w-32">
                        {(v.city || v.country) ? (
                          <>
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">Location</p>
                            <p className="text-xs text-charcoal-600 font-medium mt-0.5 truncate">
                              {[v.city, v.country].filter(Boolean).join(', ')}
                            </p>
                          </>
                        ) : null}
                      </div>

                      <div className="flex-shrink-0 hidden sm:block text-right w-16">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">RFPs</p>
                        <p className="font-heading text-lg font-bold text-terracotta leading-none mt-0.5">{v.rfpCount}</p>
                      </div>

                      <div className="flex-shrink-0 hidden md:block text-right w-28">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400">
                          {v.approvedAt ? 'Approved' : 'Registered'}
                        </p>
                        <p className="text-xs text-charcoal-600 font-medium mt-0.5">
                          {formatDate(v.approvedAt ?? v.createdAt)}
                        </p>
                      </div>

                      <div className="flex-shrink-0 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {v.status === 'APPROVED' && (
                          <button type="button" onClick={() => openVendorModal(v)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-terracotta/8 text-terracotta text-[11px] font-semibold hover:bg-terracotta hover:text-white transition-colors"
                            title="Login Details">
                            <KeyRound className="w-3 h-3" />
                            <span className="hidden xl:inline">Login</span>
                          </button>
                        )}
                        <Link href={`/admin/vendors/${v.id}`}
                          className="w-8 h-8 rounded-lg flex items-center justify-center bg-cream hover:bg-terracotta/10 text-charcoal-400 hover:text-terracotta transition-colors"
                          title="View vendor">
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        {!readonly && (
                          <button type="button" onClick={() => { setDeleteVendor(v); setDeleteError(null) }}
                            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 text-charcoal-300 hover:text-red-500 transition-colors"
                            title="Delete vendor">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    </li>
                  )
                })}
              </ul>
            </div>
          )
        )}
      </div>

      {/* ── Delete error toast ── */}
      {deleteError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-red-200 rounded-xl shadow-lg px-5 py-3 text-sm text-red-700 max-w-md">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-500" />
          <span className="flex-1">{deleteError}</span>
          <button onClick={() => setDeleteError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── Delete confirm dialog ── */}
      <DeleteConfirmDialog
        isOpen={!!deleteVendor}
        title="Delete Vendor"
        message="Are you sure you want to permanently delete this vendor? Their account and all profile data will be removed."
        itemName={deleteVendor ? `${deleteVendor.companyName} — ${deleteVendor.user.email}` : ''}
        onConfirm={handleDeleteVendor}
        onCancel={() => { setDeleteVendor(null); setDeleteError(null) }}
        isLoading={isDeleting}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          Vendor Login Details modal
      ══════════════════════════════════════════════════════════════════════ */}
      {activeVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5 text-terracotta" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-charcoal-900">Login Details</h2>
                  <p className="text-sm text-charcoal-400">{activeVendor.companyName}</p>
                </div>
              </div>
              <button type="button" onClick={closeVendorModal}
                className="p-1.5 rounded-lg hover:bg-cream text-charcoal-400 hover:text-charcoal-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {apiError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{apiError}</p>
              </div>
            )}
            {!resendResult && (
              <>
                <div className="bg-cream rounded-xl px-4 py-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-charcoal-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-charcoal-400 mb-0.5">Login email sent to</p>
                      <p className="text-sm font-mono text-charcoal-900">{activeVendor.user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <KeyRound className="w-4 h-4 text-charcoal-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-charcoal-400 mb-0.5">Password</p>
                      <p className="text-xs text-charcoal-500">Sent securely by email — cannot be retrieved.</p>
                    </div>
                  </div>
                  {(activeVendor.approvedAt || activeVendor.lastSentAt) && (
                    <div className="border-t border-[#E8E0D5] pt-3 space-y-1.5">
                      {activeVendor.approvedAt && (
                        <p className="flex items-center gap-1.5 text-xs text-charcoal-400">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          First sent: <strong className="text-charcoal-600 ml-0.5">{formatDate(activeVendor.approvedAt)}</strong>
                        </p>
                      )}
                      {activeVendor.lastSentAt && (
                        <p className="flex items-center gap-1.5 text-xs text-charcoal-400">
                          <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                          Last resent: <strong className="text-charcoal-600 ml-0.5">{formatDate(activeVendor.lastSentAt)}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {!confirming ? (
                  <div className="flex gap-3">
                    <button type="button" onClick={closeVendorModal} className="flex-1 py-2.5 rounded-xl border border-[#E8E0D5] text-sm font-semibold text-charcoal-500 hover:bg-cream transition-colors">Close</button>
                    <button type="button" onClick={() => setConfirming(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-terracotta text-terracotta text-sm font-semibold hover:bg-terracotta hover:text-white transition-colors">
                      <Send className="w-4 h-4" /> Resend Details
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <p className="text-sm text-amber-700">
                        A <strong>new temporary password</strong> will be generated and emailed to{' '}
                        <span className="font-mono text-xs">{activeVendor.user.email}</span>.{' '}
                        Their current password will be invalidated.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setConfirming(false)} disabled={isPending} className="flex-1 py-2.5 rounded-xl border border-[#E8E0D5] text-sm font-semibold text-charcoal-500 hover:bg-cream transition-colors disabled:opacity-50">Cancel</button>
                      <button type="button" onClick={handleVendorResend} disabled={isPending} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-terracotta text-white text-sm font-semibold hover:bg-terracotta/90 transition-colors disabled:opacity-60">
                        <Send className="w-4 h-4" />{isPending ? 'Sending…' : 'Confirm & Send'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {resendResult && (
              <>
                {resendResult.emailSent ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700 font-medium">Credentials emailed to {resendResult.email}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 font-medium">Email failed. Share these credentials manually.</p>
                  </div>
                )}
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-bold text-charcoal-400 uppercase tracking-wider mb-1">Login Email</p>
                    <div className="flex items-center gap-2 bg-cream rounded-xl px-4 py-2.5">
                      <span className="flex-1 text-sm font-mono text-charcoal-900 select-all">{resendResult.email}</span>
                      <button type="button" onClick={() => copyText(resendResult.email, 'email')} className="text-charcoal-300 hover:text-terracotta transition-colors">
                        {copied === 'email' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal-400 uppercase tracking-wider mb-1">Temporary Password</p>
                    <div className="flex items-center gap-2 bg-cream rounded-xl px-4 py-2.5">
                      <span className="flex-1 text-sm font-mono tracking-wider text-charcoal-900 select-all">{resendResult.password}</span>
                      <button type="button" onClick={() => copyText(resendResult.password, 'pass')} className="text-charcoal-300 hover:text-terracotta transition-colors">
                        {copied === 'pass' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={() => copyText(`Email: ${resendResult.email}\nPassword: ${resendResult.password}`, 'both')} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[#E8E0D5] text-xs text-charcoal-400 hover:text-charcoal-700 hover:border-charcoal-300 transition-colors">
                    {copied === 'both' ? <><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy both</>}
                  </button>
                </div>
                <p className="text-xs text-charcoal-300 text-center">Password will not be shown again after closing.</p>
                <button type="button" onClick={closeVendorModal} className="w-full py-2.5 rounded-xl bg-charcoal-900 text-white text-sm font-semibold hover:bg-charcoal-800 transition-colors">Done</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Application Login Details modal
      ══════════════════════════════════════════════════════════════════════ */}
      {loginReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                  <KeyRound className="w-5 h-5 text-terracotta" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-charcoal-900">Login Details</h2>
                  <p className="text-sm text-charcoal-400">{loginReq.companyName}</p>
                </div>
              </div>
              <button type="button" onClick={closeAppLoginModal}
                className="p-1.5 rounded-lg hover:bg-cream text-charcoal-400 hover:text-charcoal-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            {appResendErr && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{appResendErr}</p>
              </div>
            )}
            {!appResendResult && (
              <>
                <div className="bg-cream rounded-xl px-4 py-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <Mail className="w-4 h-4 text-charcoal-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-charcoal-400 mb-0.5">Login email</p>
                      <p className="text-sm font-mono text-charcoal-900">{loginReq.email}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <KeyRound className="w-4 h-4 text-charcoal-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-charcoal-400 mb-0.5">Password</p>
                      <p className="text-xs text-charcoal-500">Sent securely by email — cannot be retrieved.</p>
                    </div>
                  </div>
                  {(loginReq.vendorApprovedAt || loginReq.vendorLastSentAt) && (
                    <div className="border-t border-[#E8E0D5] pt-3 space-y-1.5">
                      {loginReq.vendorApprovedAt && (
                        <p className="flex items-center gap-1.5 text-xs text-charcoal-400">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          First sent: <strong className="text-charcoal-600 ml-0.5">{fmtDateTime(loginReq.vendorApprovedAt)}</strong>
                        </p>
                      )}
                      {loginReq.vendorLastSentAt && (
                        <p className="flex items-center gap-1.5 text-xs text-charcoal-400">
                          <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
                          Last resent: <strong className="text-charcoal-600 ml-0.5">{fmtDateTime(loginReq.vendorLastSentAt)}</strong>
                        </p>
                      )}
                    </div>
                  )}
                </div>
                {!appConfirming ? (
                  <div className="flex gap-3">
                    <button type="button" onClick={closeAppLoginModal} className="flex-1 py-2.5 rounded-xl border border-[#E8E0D5] text-sm font-semibold text-charcoal-500 hover:bg-cream transition-colors">Close</button>
                    <button type="button" onClick={() => setAppConfirming(true)} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-terracotta text-terracotta text-sm font-semibold hover:bg-terracotta hover:text-white transition-colors">
                      <Send className="w-4 h-4" /> Resend Details
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <p className="text-sm text-amber-700">
                        A <strong>new temporary password</strong> will be generated and emailed to{' '}
                        <span className="font-mono text-xs">{loginReq.email}</span>.
                        Their current password will be invalidated.
                      </p>
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setAppConfirming(false)} disabled={isPending} className="flex-1 py-2.5 rounded-xl border border-[#E8E0D5] text-sm font-semibold text-charcoal-500 hover:bg-cream transition-colors disabled:opacity-50">Cancel</button>
                      <button type="button" onClick={handleAppResend} disabled={isPending} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-terracotta text-white text-sm font-semibold hover:bg-terracotta/90 transition-colors disabled:opacity-60">
                        <Send className="w-4 h-4" />{isPending ? 'Sending…' : 'Confirm & Send'}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
            {appResendResult && (
              <>
                {appResendResult.emailSent ? (
                  <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700 font-medium">Credentials emailed to {appResendResult.email}</p>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-amber-700 font-medium">Email failed. Share these credentials manually.</p>
                  </div>
                )}
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-bold text-charcoal-400 uppercase tracking-wider mb-1">Login Email</p>
                    <div className="flex items-center gap-2 bg-cream rounded-xl px-4 py-2.5">
                      <span className="flex-1 text-sm font-mono text-charcoal-900 select-all">{appResendResult.email}</span>
                      <button type="button" onClick={() => copyText(appResendResult.email, 'a-email')} className="text-charcoal-300 hover:text-terracotta transition-colors">
                        {copied === 'a-email' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-charcoal-400 uppercase tracking-wider mb-1">Temporary Password</p>
                    <div className="flex items-center gap-2 bg-cream rounded-xl px-4 py-2.5">
                      <span className="flex-1 text-sm font-mono tracking-wider text-charcoal-900 select-all">{appResendResult.password}</span>
                      <button type="button" onClick={() => copyText(appResendResult.password, 'a-pass')} className="text-charcoal-300 hover:text-terracotta transition-colors">
                        {copied === 'a-pass' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <button type="button" onClick={() => copyText(`Email: ${appResendResult.email}\nPassword: ${appResendResult.password}`, 'a-both')} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[#E8E0D5] text-xs text-charcoal-400 hover:text-charcoal-700 hover:border-charcoal-300 transition-colors">
                    {copied === 'a-both' ? <><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy both</>}
                  </button>
                </div>
                <p className="text-xs text-charcoal-300 text-center">Password will not be shown again after closing.</p>
                <button type="button" onClick={closeAppLoginModal} className="w-full py-2.5 rounded-xl bg-charcoal-900 text-white text-sm font-semibold hover:bg-charcoal-800 transition-colors">Done</button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Approval credential modal
      ══════════════════════════════════════════════════════════════════════ */}
      {approvalResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-xl w-full max-w-md p-6 space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <KeyRound className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">Vendor Approved</h2>
                <p className="text-sm text-charcoal-400">Account created successfully.</p>
              </div>
            </div>
            {!approvalResult.emailSent && (
              <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-amber-700 font-medium">Credentials email failed to send. Share manually below.</p>
              </div>
            )}
            <div className="space-y-2">
              <div>
                <p className="text-xs font-bold text-charcoal-400 uppercase tracking-wider mb-1">Login Email</p>
                <div className="flex items-center gap-2 bg-cream rounded-xl px-4 py-2.5">
                  <span className="flex-1 text-sm font-mono text-charcoal-900 select-all">{approvalResult.email}</span>
                  <button type="button" onClick={() => copyText(approvalResult.email, 'ap-email')} className="text-charcoal-300 hover:text-terracotta transition-colors">
                    {copied === 'ap-email' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-charcoal-400 uppercase tracking-wider mb-1">Temporary Password</p>
                <div className="flex items-center gap-2 bg-cream rounded-xl px-4 py-2.5">
                  <span className="flex-1 text-sm font-mono tracking-wider text-charcoal-900 select-all">{approvalResult.password}</span>
                  <button type="button" onClick={() => copyText(approvalResult.password, 'ap-pass')} className="text-charcoal-300 hover:text-terracotta transition-colors">
                    {copied === 'ap-pass' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="button" onClick={() => copyText(`Email: ${approvalResult.email}\nPassword: ${approvalResult.password}`, 'ap-both')} className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-[#E8E0D5] text-xs text-charcoal-400 hover:text-charcoal-700 hover:border-charcoal-300 transition-colors">
                {copied === 'ap-both' ? <><CheckCircle className="w-3.5 h-3.5 text-green-500" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy both</>}
              </button>
            </div>
            <p className="text-xs text-charcoal-300 text-center">This password will not be shown again.</p>
            <button type="button" onClick={() => setApprovalResult(null)}
              className="w-full py-2.5 rounded-xl bg-charcoal-900 text-white text-sm font-semibold hover:bg-charcoal-800 transition-colors">Done</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Reject modal
      ══════════════════════════════════════════════════════════════════════ */}
      {rejectId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-xl w-full max-w-md p-6 space-y-4">
            <h2 className="text-lg font-bold text-charcoal-900">Reject Application</h2>
            <p className="text-sm text-charcoal-400">Optionally provide a reason — it will be included in the rejection email.</p>
            <textarea rows={4} value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. We are not currently onboarding vendors in your region…"
              className="w-full px-4 py-3 rounded-xl border border-[#E8E0D5] bg-cream text-sm text-charcoal-900 focus:outline-none focus:border-terracotta focus:ring-2 focus:ring-terracotta/10 resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => { setRejectId(null); setRejectReason('') }}
                className="px-4 py-2 text-sm font-semibold text-charcoal-500 hover:text-charcoal-900 transition-colors">Cancel</button>
              <button type="button" onClick={() => rejectApp(rejectId)} disabled={isPending}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60">
                <XCircle className="w-4 h-4" />{isPending ? 'Rejecting…' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          Revoke modal
      ══════════════════════════════════════════════════════════════════════ */}
      {revokeReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center flex-shrink-0">
                <ShieldOff className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-charcoal-900">Revoke Vendor Access</h2>
                <p className="text-sm text-charcoal-400">{revokeReq.companyName}</p>
              </div>
              <button type="button" onClick={() => { setRevokeReq(null); setRevokeReason('') }}
                className="ml-auto p-1.5 rounded-lg hover:bg-cream text-charcoal-400 hover:text-charcoal-700 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">
                This will <strong>immediately deactivate</strong> the vendor's login.
                They will not be able to access the portal until re-approved.
              </p>
            </div>
            <div className="bg-cream rounded-xl px-4 py-3 text-sm text-charcoal-500">
              <span className="font-semibold text-charcoal-900">{revokeReq.name}</span>
              {' · '}
              <span className="font-mono text-xs">{revokeReq.email}</span>
            </div>
            <div>
              <label className="block text-sm font-semibold text-charcoal-900 mb-1.5">
                Reason <span className="text-charcoal-400 font-normal">(optional)</span>
              </label>
              <textarea rows={3} value={revokeReason} onChange={e => setRevokeReason(e.target.value)}
                placeholder="e.g. Contract ended, compliance issue…"
                className="w-full px-4 py-3 rounded-xl border border-[#E8E0D5] bg-cream text-sm text-charcoal-900 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setRevokeReq(null); setRevokeReason('') }}
                className="flex-1 py-2.5 rounded-xl border border-[#E8E0D5] text-sm font-semibold text-charcoal-500 hover:bg-cream transition-colors">Cancel</button>
              <button type="button" onClick={() => revokeApp(revokeReq.id)} disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-60">
                <ShieldOff className="w-4 h-4" />{isPending ? 'Revoking…' : 'Revoke Access'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ── Add Vendor Modal ── */}
      {addVendorOpen && (
        <AddVendorModal
          onClose={() => setAddVendorOpen(false)}
          onDone={() => { setAddVendorOpen(false); router.refresh() }}
        />
      )}
    </>
  )
}
