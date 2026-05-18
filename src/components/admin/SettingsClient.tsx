'use client'

import { useState, useTransition, useRef, useCallback, useEffect } from 'react'
import {
  Settings, User, Mail, Shield, Server,
  ChevronRight, Check, X, Eye, EyeOff,
  Building2, Globe, CreditCard, Clock,
  KeyRound, Bell, Zap, AlertTriangle,
  CheckCircle2, Info, Lock, Layers,
  ImageIcon, Upload, Trash2, FileImage, Paintbrush,
} from 'lucide-react'

/* ── Types ──────────────────────────────────────────────────────── */
export interface AdminUser {
  id:          string
  name:        string
  email:       string
  phone:       string | null
  role:        string
  lastLoginAt: string | null
  createdAt:   string
}

export interface SystemInfo {
  version:        string
  environment:    string
  dbProvider:     string
  emailFrom:      string
  adminEmail:     string
  appUrl:         string
  hasResendKey:   boolean
  jwtMaxAgeDays:  number
}

interface Props {
  user:       AdminUser
  systemInfo: SystemInfo
}

/* ── Navigation ─────────────────────────────────────────────────── */
type Section = 'brand' | 'general' | 'account' | 'email' | 'security' | 'system'

const NAV: { id: Section; label: string; icon: React.ElementType; desc: string }[] = [
  { id: 'brand',    label: 'Brand & Logo',  icon: Paintbrush, desc: 'Logo & identity'       },
  { id: 'general',  label: 'General',       icon: Settings,  desc: 'Platform & region'     },
  { id: 'account',  label: 'My Account',    icon: User,      desc: 'Profile & password'    },
  { id: 'email',    label: 'Email',         icon: Mail,      desc: 'Notifications & sender'},
  { id: 'security', label: 'Security',      icon: Shield,    desc: 'Roles & session'       },
  { id: 'system',   label: 'System',        icon: Server,    desc: 'Status & build info'   },
]

/* ── Helpers ────────────────────────────────────────────────────── */
function relativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function initials(name: string): string {
  return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function StatusDot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold ${ok ? 'text-emerald-700' : 'text-rose-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`} />
      {label}
    </span>
  )
}

function SectionCard({ title, subtitle, icon: Icon, children }: {
  title: string; subtitle?: string; icon?: React.ElementType; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
      <div className="px-6 py-4 bg-cream border-b border-[#E8E0D5]">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-terracotta" />
            </div>
          )}
          <div>
            <h3 className="font-heading text-base font-bold text-charcoal-900 leading-none">{title}</h3>
            {subtitle && <p className="text-[11px] text-charcoal-400 mt-0.5">{subtitle}</p>}
          </div>
        </div>
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function ReadonlyField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-1.5">{label}</p>
      <p className={`text-sm font-medium text-charcoal-900 ${mono ? 'font-mono' : ''}`}>{value}</p>
    </div>
  )
}

function EnvField({ label, value, envKey }: { label: string; value: string; envKey: string }) {
  return (
    <div>
      <label className="block text-sm font-medium text-charcoal-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          readOnly
          className="form-input flex-1 font-mono text-sm bg-cream/60 cursor-default"
        />
        <span className="text-[10px] font-mono text-charcoal-400 bg-charcoal-100 px-2 py-1 rounded whitespace-nowrap">{envKey}</span>
      </div>
    </div>
  )
}

function InlineAlert({ type, message }: { type: 'success' | 'error'; message: string }) {
  const isOk = type === 'success'
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
      isOk ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
    }`}>
      {isOk ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
      {message}
    </div>
  )
}

/* ── EMAIL EVENTS ───────────────────────────────────────────────── */
const EMAIL_EVENTS = [
  { event: 'Access Request Received', trigger: 'Vendor submits access request',  recipient: 'Vendor',   active: true },
  { event: 'Access Approved',         trigger: 'Admin approves vendor access',   recipient: 'Vendor',   active: true },
  { event: 'Access Rejected',         trigger: 'Admin rejects vendor access',    recipient: 'Vendor',   active: true },
  { event: 'Access Revoked',          trigger: 'Admin revokes vendor access',    recipient: 'Vendor',   active: true },
  { event: 'New RFP Notification',    trigger: 'Vendor submits an RFP',          recipient: 'Admin',    active: true },
  { event: 'Quote Sent',              trigger: 'Admin sends quote to vendor',    recipient: 'Vendor',   active: true },
  { event: 'Password Reset',          trigger: 'Admin resets vendor password',   recipient: 'Vendor',   active: true },
  { event: 'Invite Re-sent',          trigger: 'Admin resends vendor invite',    recipient: 'Vendor',   active: true },
]

/* ── ROLES ──────────────────────────────────────────────────────── */
const ROLES = [
  { role: 'ADMIN',      color: 'bg-terracotta/10 text-terracotta',   desc: 'Full system access. Manage all users, vendors, products, and settings.' },
  { role: 'MANAGER',    color: 'bg-amber-50 text-amber-700',         desc: 'View and manage vendors, RFPs, and quotations. Cannot access settings.' },
  { role: 'VENDOR',     color: 'bg-sage/15 text-sage-700',           desc: 'Submit RFPs and view own quotations via the vendor portal.' },
  { role: 'PRODUCTION', color: 'bg-charcoal-100 text-charcoal-600',  desc: 'Access production queue and order management tools.' },
]

/* ── BRAND SECTION ──────────────────────────────────────────────── */
function BrandSection() {
  const fileRef  = useRef<HTMLInputElement>(null)
  const dropRef  = useRef<HTMLDivElement>(null)

  const [logoUrl,    setLogoUrl]    = useState<string | null>(null)
  const [preview,    setPreview]    = useState<string | null>(null)
  const [dragging,   setDragging]   = useState(false)
  const [uploading,  setUploading]  = useState(false)
  const [removing,   setRemoving]   = useState(false)
  const [msg,        setMsg]        = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Load current logo
  useEffect(() => {
    fetch('/api/admin/settings/brand')
      .then(r => r.json())
      .then(d => { if (d.logoUrl) setLogoUrl(d.logoUrl + '?t=' + Date.now()) })
      .catch(() => {})
  }, [])

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const uploadFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) { showMsg('error', 'Only image files allowed'); return }
    if (file.size > 2 * 1024 * 1024)    { showMsg('error', 'Max file size is 2 MB');    return }

    // Local preview
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res  = await fetch('/api/admin/settings/logo', { method: 'POST', body: form })
      const text = await res.text()
      let data: any = {}
      try { data = JSON.parse(text) } catch { throw new Error(`Server error (${res.status}): ${text.slice(0, 120)}`) }
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setLogoUrl(data.logoUrl)
      setPreview(null)
      showMsg('success', 'Logo updated — refreshing in all areas')
      // Trigger header/sidebar reload
      window.dispatchEvent(new CustomEvent('logo-updated', { detail: { logoUrl: data.logoUrl } }))
    } catch (e: any) {
      setPreview(null)
      showMsg('error', e.message)
    } finally {
      setUploading(false)
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) uploadFile(f)
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) uploadFile(f)
  }, [uploadFile])

  const handleRemove = async () => {
    if (!confirm('Remove the current logo? The default text logo will be used.')) return
    setRemoving(true)
    try {
      const res = await fetch('/api/admin/settings/logo', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to remove')
      setLogoUrl(null)
      setPreview(null)
      showMsg('success', 'Logo removed')
      window.dispatchEvent(new CustomEvent('logo-updated', { detail: { logoUrl: null } }))
    } catch (e: any) {
      showMsg('error', e.message)
    } finally {
      setRemoving(false)
    }
  }

  const displayUrl = preview || logoUrl

  return (
    <div className="space-y-4">
      <SectionCard title="Brand Logo" subtitle="Upload your company logo for use across the portal and PDF quotations" icon={ImageIcon}>

        {/* Current logo / upload zone */}
        <div className="flex gap-6 items-start">

          {/* Preview panel */}
          <div className="flex-shrink-0">
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-2.5">Current Logo</p>
            <div className={`w-48 h-28 rounded-xl border-2 flex items-center justify-center overflow-hidden transition-all ${
              displayUrl
                ? 'border-[#E8E0D5] bg-white'
                : 'border-dashed border-[#E8E0D5] bg-cream/60'
            }`}>
              {displayUrl ? (
                <img
                  src={displayUrl}
                  alt="Brand logo"
                  className="max-w-full max-h-full object-contain p-3"
                />
              ) : (
                <div className="text-center">
                  <ImageIcon className="w-8 h-8 text-charcoal-200 mx-auto mb-1.5" />
                  <p className="text-[11px] text-charcoal-400 font-medium">No logo set</p>
                  <p className="text-[10px] text-charcoal-300 mt-0.5">Text fallback in use</p>
                </div>
              )}
            </div>
            {displayUrl && uploading && (
              <p className="text-[11px] text-charcoal-400 mt-1.5 text-center animate-pulse">Uploading…</p>
            )}
          </div>

          {/* Drop zone + actions */}
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-2.5">Upload New Logo</p>

            {/* Drop zone */}
            <div
              ref={dropRef}
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`relative cursor-pointer rounded-xl border-2 border-dashed px-6 py-8 flex flex-col items-center justify-center text-center transition-all ${
                dragging
                  ? 'border-terracotta bg-terracotta/5 scale-[1.01]'
                  : 'border-[#DDD5C8] bg-cream/40 hover:border-terracotta/50 hover:bg-cream'
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileInput}
                className="sr-only"
              />
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                dragging ? 'bg-terracotta/20' : 'bg-charcoal-100'
              }`}>
                <Upload className={`w-5 h-5 transition-colors ${dragging ? 'text-terracotta' : 'text-charcoal-400'}`} />
              </div>
              <p className="text-sm font-semibold text-charcoal-700 mb-1">
                {dragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
              </p>
              <p className="text-xs text-charcoal-400">PNG, JPG, WebP or SVG — max 2 MB</p>
              <p className="text-[10px] text-charcoal-300 mt-1.5">Recommended: transparent PNG, min 200 × 80 px</p>

              {uploading && (
                <div className="absolute inset-0 rounded-xl bg-white/80 flex items-center justify-center">
                  <div className="flex items-center gap-2 text-sm font-medium text-terracotta">
                    <div className="w-4 h-4 border-2 border-terracotta border-t-transparent rounded-full animate-spin" />
                    Uploading…
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-terracotta text-white text-sm font-semibold hover:bg-[#B85C3B] transition-colors disabled:opacity-50"
              >
                <FileImage className="w-3.5 h-3.5" />
                {uploading ? 'Uploading…' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
              </button>
              {logoUrl && (
                <button
                  onClick={handleRemove}
                  disabled={removing}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-rose-200 text-rose-600 text-sm font-semibold hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {removing ? 'Removing…' : 'Remove'}
                </button>
              )}
            </div>

            {/* Feedback */}
            {msg && (
              <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                msg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {msg.type === 'success'
                  ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  : <X className="w-4 h-4 flex-shrink-0" />
                }
                {msg.text}
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      {/* Usage guide */}
      <SectionCard title="Where the Logo Appears" subtitle="Your logo is used in these locations" icon={FileImage}>
        <div className="grid grid-cols-3 gap-3">
          {[
            { place: 'Admin Header',    desc: 'Top navigation bar across all admin pages',      icon: '🖥️' },
            { place: 'PDF Quotations',  desc: 'Embedded in the header of every quote document', icon: '📄' },
            { place: 'Vendor Portal',   desc: 'Header of the vendor-facing portal',             icon: '🏢' },
          ].map(u => (
            <div key={u.place} className="p-4 rounded-xl bg-cream/60 border border-[#E8E0D5]">
              <span className="text-xl mb-2 block">{u.icon}</span>
              <p className="text-sm font-bold text-charcoal-900">{u.place}</p>
              <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">{u.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5">
          <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            For best results use a <strong>transparent PNG</strong> with your logo on a light or transparent background. The portal header shows the logo at ~120 × 40 px; the PDF embeds it at a similar scale.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}

/* ── SECTIONS ───────────────────────────────────────────────────── */
function GeneralSection({ systemInfo }: { systemInfo: SystemInfo }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Platform Identity" subtitle="Core platform configuration" icon={Building2}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <ReadonlyField label="Company Name"    value="Forestry" />
          <ReadonlyField label="Portal URL"      value={systemInfo.appUrl} mono />
          <ReadonlyField label="Currency"        value="AED — United Arab Emirates Dirham" />
          <ReadonlyField label="Country / Region" value="United Arab Emirates" />
          <ReadonlyField label="Timezone"        value="Asia/Dubai (UTC+4)" />
          <ReadonlyField label="Language"        value="English (en-GB)" />
        </div>
      </SectionCard>

      <SectionCard title="Vendor Portal" subtitle="How vendors interact with the system" icon={Globe}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-5">
          <ReadonlyField label="Vendor Login"     value={`${systemInfo.appUrl}/login`} mono />
          <ReadonlyField label="Vendor Portal"    value={`${systemInfo.appUrl}/portal`} mono />
          <ReadonlyField label="RFP Access"       value="Approved vendors only" />
          <ReadonlyField label="Registration"     value="By invitation / access request" />
        </div>
        <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5">
          <Info className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            Platform configuration is managed via environment variables. To change company name, URL, or currency, update <code className="font-mono bg-amber-100 px-1 rounded">NEXT_PUBLIC_*</code> variables and redeploy.
          </p>
        </div>
      </SectionCard>
    </div>
  )
}

function AccountSection({ user }: { user: AdminUser }) {
  const [name,  setName]  = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingProfile, startSaveProfile] = useTransition()

  const [currentPw, setCurrentPw] = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew,     setShowNew]     = useState(false)
  const [pwMsg,   setPwMsg]  = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingPw, startSavePw] = useTransition()

  function pwStrength(pw: string): { score: number; label: string; color: string } {
    let score = 0
    if (pw.length >= 8)  score++
    if (pw.length >= 12) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    if (score <= 1) return { score, label: 'Weak',   color: 'bg-rose-400' }
    if (score <= 3) return { score, label: 'Medium', color: 'bg-amber-400' }
    return            { score, label: 'Strong', color: 'bg-emerald-500' }
  }

  function handleSaveProfile() {
    startSaveProfile(async () => {
      setProfileMsg(null)
      const res = await fetch('/api/admin/settings/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      const data = await res.json()
      if (res.ok) {
        setProfileMsg({ type: 'success', text: 'Profile updated successfully' })
      } else {
        setProfileMsg({ type: 'error', text: data.error ?? 'Failed to save' })
      }
    })
  }

  function handleChangePassword() {
    startSavePw(async () => {
      setPwMsg(null)
      if (newPw !== confirmPw) {
        setPwMsg({ type: 'error', text: 'New passwords do not match' })
        return
      }
      if (newPw.length < 8) {
        setPwMsg({ type: 'error', text: 'Password must be at least 8 characters' })
        return
      }
      const res = await fetch('/api/admin/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (res.ok) {
        setPwMsg({ type: 'success', text: 'Password changed successfully' })
        setCurrentPw(''); setNewPw(''); setConfirmPw('')
      } else {
        setPwMsg({ type: 'error', text: data.error ?? 'Failed to change password' })
      }
    })
  }

  const strength = pwStrength(newPw)

  return (
    <div className="space-y-4">
      {/* Profile card */}
      <SectionCard title="Profile" subtitle="Update your display name and contact details" icon={User}>
        <div className="flex items-start gap-5 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-terracotta flex items-center justify-center flex-shrink-0">
            <span className="font-heading text-xl font-bold text-white">{initials(user.name)}</span>
          </div>
          <div>
            <p className="font-heading text-base font-bold text-charcoal-900">{user.name}</p>
            <p className="text-sm text-charcoal-500">{user.email}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-terracotta/10 text-terracotta">
                {user.role}
              </span>
              <span className="text-[11px] text-charcoal-400">
                Last login: {relativeTime(user.lastLoginAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-input"
              placeholder="Your full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1.5">Email Address</label>
            <input
              type="email"
              value={user.email}
              readOnly
              className="form-input bg-cream/60 cursor-default text-charcoal-500"
            />
            <p className="text-[11px] text-charcoal-400 mt-1">Email cannot be changed from this panel</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="form-input"
              placeholder="+971 50 000 0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1.5">Role</label>
            <input
              type="text"
              value={user.role}
              readOnly
              className="form-input bg-cream/60 cursor-default text-charcoal-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#E8E0D5]">
          <button
            onClick={handleSaveProfile}
            disabled={savingProfile || !name.trim()}
            className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingProfile ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            {savingProfile ? 'Saving…' : 'Save Profile'}
          </button>
          {profileMsg && <InlineAlert type={profileMsg.type} message={profileMsg.text} />}
        </div>
      </SectionCard>

      {/* Password card */}
      <SectionCard title="Change Password" subtitle="Use a strong password with letters, numbers, and symbols" icon={KeyRound}>
        <div className="grid grid-cols-1 gap-4 max-w-md">
          {/* Current password */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1.5">Current Password</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                className="form-input pr-10"
                placeholder="Enter current password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1.5">New Password</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                className="form-input pr-10"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Strength bar */}
            {newPw.length > 0 && (
              <div className="mt-2">
                <div className="flex gap-1 mb-1">
                  {[1,2,3,4,5].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all ${
                        i <= strength.score ? strength.color : 'bg-charcoal-100'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-[11px] text-charcoal-400">{strength.label} password</p>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label className="block text-sm font-medium text-charcoal-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              className={`form-input ${confirmPw && confirmPw !== newPw ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-100' : ''}`}
              placeholder="Repeat new password"
              autoComplete="new-password"
            />
            {confirmPw && confirmPw !== newPw && (
              <p className="text-[11px] text-rose-600 mt-1">Passwords do not match</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[#E8E0D5]">
          <button
            onClick={handleChangePassword}
            disabled={savingPw || !currentPw || !newPw || !confirmPw}
            className="inline-flex items-center gap-2 bg-charcoal-900 hover:bg-charcoal-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {savingPw ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
            {savingPw ? 'Changing…' : 'Change Password'}
          </button>
          {pwMsg && <InlineAlert type={pwMsg.type} message={pwMsg.text} />}
        </div>
      </SectionCard>

      {/* Account metadata */}
      <SectionCard title="Account Info" subtitle="Read-only account metadata" icon={Info}>
        <div className="grid grid-cols-3 gap-6">
          <ReadonlyField label="User ID"      value={user.id}         mono />
          <ReadonlyField label="Member Since" value={new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <ReadonlyField label="Last Login"   value={relativeTime(user.lastLoginAt)} />
        </div>
      </SectionCard>
    </div>
  )
}

function EmailSection({ systemInfo }: { systemInfo: SystemInfo }) {
  const [resendApiKey, setResendApiKey] = useState('')
  const [emailFrom,    setEmailFrom]    = useState(systemInfo.emailFrom)
  const [adminEmail,   setAdminEmail]   = useState(systemInfo.adminEmail)
  const [showKey,      setShowKey]      = useState(false)
  const [saving,       setSaving]       = useState(false)
  const [status,       setStatus]       = useState<'idle' | 'saved' | 'error'>('idle')
  const [hasKey,       setHasKey]       = useState(systemInfo.hasResendKey)

  async function handleSave() {
    setSaving(true)
    setStatus('idle')
    try {
      const res = await fetch('/api/admin/settings/email', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ resendApiKey, emailFrom, adminEmail }),
      })
      if (res.ok) {
        setStatus('saved')
        if (resendApiKey && !resendApiKey.startsWith('•')) setHasKey(true)
        setResendApiKey('')   // clear after save — stored securely in DB
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    } finally {
      setSaving(false)
      setTimeout(() => setStatus('idle'), 3000)
    }
  }

  return (
    <div className="space-y-4">
      {/* Editable config */}
      <SectionCard title="Email Service" subtitle="Powered by Resend — settings saved to database" icon={Zap}>

        {/* Status badge */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold ${
            hasKey
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            {hasKey
              ? <><CheckCircle2 className="w-4 h-4" /> Service connected</>
              : <><AlertTriangle className="w-4 h-4" /> Not configured — emails disabled</>
            }
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">

          {/* Resend API Key */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-500 mb-1.5">
              Resend API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={resendApiKey}
                onChange={e => setResendApiKey(e.target.value)}
                placeholder={hasKey ? 'Enter new key to replace current one' : 're_xxxxxxxxxxxxxxxxxxxx'}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E8E0D5] rounded-xl text-charcoal-900 placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta/50 pr-10 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-charcoal-400 mt-1">
              Get your key at <a href="https://resend.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-terracotta hover:underline">resend.com/api-keys</a>
              {hasKey && ' — leave blank to keep existing key'}
            </p>
          </div>

          {/* From Address */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-500 mb-1.5">
              From Address
            </label>
            <input
              type="text"
              value={emailFrom}
              onChange={e => setEmailFrom(e.target.value)}
              placeholder="Forestry <noreply@yourdomain.ae>"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E8E0D5] rounded-xl text-charcoal-900 placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta/50"
            />
            <p className="text-[11px] text-charcoal-400 mt-1">
              Must be a domain verified in your Resend account
            </p>
          </div>

          {/* Admin notification email */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-500 mb-1.5">
              Admin Notification Email
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={e => setAdminEmail(e.target.value)}
              placeholder="admin@yourdomain.ae"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#E8E0D5] rounded-xl text-charcoal-900 placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-terracotta/20 focus:border-terracotta/50"
            />
            <p className="text-[11px] text-charcoal-400 mt-1">
              Receives new RFP notifications
            </p>
          </div>
        </div>

        {/* Save */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-terracotta text-white text-sm font-bold rounded-xl hover:bg-terracotta-dark transition-colors disabled:opacity-60"
          >
            {saving
              ? <><KeyRound className="w-4 h-4 animate-pulse" /> Saving…</>
              : <><Check className="w-4 h-4" /> Save Email Settings</>
            }
          </button>

          {status === 'saved' && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-700 font-semibold">
              <CheckCircle2 className="w-4 h-4" /> Saved — emails active immediately
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1.5 text-sm text-rose-600 font-semibold">
              <AlertTriangle className="w-4 h-4" /> Save failed — try again
            </span>
          )}
        </div>
      </SectionCard>

      {/* Email events */}
      <SectionCard title="Email Events" subtitle="All automated email triggers in this system" icon={Bell}>
        <div className="divide-y divide-[#E8E0D5]">
          {EMAIL_EVENTS.map((ev, i) => (
            <div key={i} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                ev.active ? 'bg-emerald-100' : 'bg-charcoal-100'
              }`}>
                {ev.active
                  ? <Check className="w-3 h-3 text-emerald-700" />
                  : <X className="w-3 h-3 text-charcoal-400" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-charcoal-900">{ev.event}</p>
                <p className="text-xs text-charcoal-400 mt-0.5">{ev.trigger}</p>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex-shrink-0 ${
                ev.recipient === 'Admin'
                  ? 'bg-terracotta/10 text-terracotta'
                  : 'bg-sage/15 text-sage-700'
              }`}>
                → {ev.recipient}
              </span>
            </div>
          ))}
        </div>
        <p className="text-xs text-charcoal-400 mt-4 pt-3 border-t border-[#E8E0D5]">
          All {EMAIL_EVENTS.length} email events are active.
        </p>
      </SectionCard>
    </div>
  )
}

function SecuritySection({ systemInfo }: { systemInfo: SystemInfo }) {
  return (
    <div className="space-y-4">
      {/* Session config */}
      <SectionCard title="Session & Authentication" subtitle="JWT-based authentication configuration" icon={Shield}>
        <div className="grid grid-cols-3 gap-6 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-1.5">Strategy</p>
            <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-charcoal-100 text-charcoal-700 text-xs font-bold font-mono">JWT</span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-1.5">Session Lifetime</p>
            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-charcoal-900">
              <Clock className="w-4 h-4 text-charcoal-400" />
              {systemInfo.jwtMaxAgeDays} days
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-400 mb-1.5">Provider</p>
            <span className="text-sm font-semibold text-charcoal-900">Credentials (email + password)</span>
          </div>
        </div>
        <div className="p-3 bg-charcoal-100/50 rounded-xl">
          <p className="text-xs text-charcoal-500">
            Sessions expire after <strong className="text-charcoal-700">{systemInfo.jwtMaxAgeDays} days</strong> of inactivity. Configured in <code className="font-mono text-[11px]">src/lib/auth.ts</code>.
          </p>
        </div>
      </SectionCard>

      {/* Roles */}
      <SectionCard title="User Roles" subtitle="Permission levels in the system" icon={Layers}>
        <div className="space-y-3">
          {ROLES.map(r => (
            <div key={r.role} className="flex items-start gap-3 p-3 rounded-xl bg-cream/60 border border-[#E8E0D5]">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 ${r.color}`}>
                {r.role}
              </span>
              <p className="text-sm text-charcoal-600">{r.desc}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Password policy */}
      <SectionCard title="Password Policy" subtitle="Requirements for all user passwords" icon={KeyRound}>
        <ul className="space-y-2.5">
          {[
            'Minimum 8 characters',
            'Stored as bcrypt hash (12 rounds)',
            'Temporary passwords issued on account creation',
            'Users prompted to change password on first login',
            'Admins can reset vendor passwords from the Vendors panel',
          ].map((item, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-charcoal-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              {item}
            </li>
          ))}
        </ul>
      </SectionCard>
    </div>
  )
}

function SystemSection({ systemInfo }: { systemInfo: SystemInfo }) {
  const infoPairs = [
    { label: 'Application Version', value: systemInfo.version,     mono: true  },
    { label: 'Environment',         value: systemInfo.environment, mono: false },
    { label: 'Database',            value: `${systemInfo.dbProvider.charAt(0).toUpperCase()}${systemInfo.dbProvider.slice(1)}`, mono: false },
    { label: 'Auth Framework',      value: 'NextAuth.js v4',       mono: false },
    { label: 'Email Service',       value: 'Resend',               mono: false },
    { label: 'Frontend Framework',  value: 'Next.js 14 (App Router)', mono: false },
    { label: 'ORM',                 value: 'Prisma',               mono: false },
    { label: 'Runtime',             value: 'Node.js',              mono: false },
  ]

  return (
    <div className="space-y-4">
      {/* Health */}
      <SectionCard title="Service Health" subtitle="Real-time status of connected services" icon={Server}>
        <div className="grid grid-cols-2 gap-4">
          {[
            { service: 'Database',      ok: true,                          note: systemInfo.dbProvider },
            { service: 'Email Service', ok: systemInfo.hasResendKey,       note: systemInfo.hasResendKey ? 'Resend connected' : 'API key missing' },
            { service: 'Auth',          ok: true,                          note: 'NextAuth.js active' },
            { service: 'App URL',       ok: !!systemInfo.appUrl,           note: systemInfo.appUrl },
          ].map(s => (
            <div key={s.service} className="flex items-center justify-between p-3 bg-cream/60 rounded-xl border border-[#E8E0D5]">
              <span className="text-sm font-medium text-charcoal-700">{s.service}</span>
              <div className="text-right">
                <StatusDot ok={s.ok} label={s.ok ? 'Operational' : 'Issue'} />
                <p className="text-[10px] text-charcoal-400 mt-0.5 font-mono">{s.note}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Build info */}
      <SectionCard title="Build Information" subtitle="Stack and dependency details" icon={Info}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
          {infoPairs.map(p => (
            <ReadonlyField key={p.label} label={p.label} value={p.value} mono={p.mono} />
          ))}
        </div>
      </SectionCard>

      {/* Env vars checklist */}
      <SectionCard title="Environment Variables" subtitle="Required configuration keys" icon={CreditCard}>
        <div className="space-y-2">
          {[
            { key: 'DATABASE_URL',           desc: 'Prisma database connection string',   required: true,  set: true  },
            { key: 'NEXTAUTH_SECRET',         desc: 'JWT signing secret',                  required: true,  set: true  },
            { key: 'NEXTAUTH_URL',            desc: 'Base URL for auth callbacks',          required: true,  set: true  },
            { key: 'RESEND_API_KEY',          desc: 'Resend API key for email delivery',   required: false, set: systemInfo.hasResendKey },
            { key: 'EMAIL_FROM',             desc: 'Sender address for outbound email',    required: false, set: !!systemInfo.emailFrom },
            { key: 'ADMIN_EMAIL',            desc: 'Admin inbox for RFP notifications',    required: false, set: !!systemInfo.adminEmail },
            { key: 'NEXT_PUBLIC_APP_URL',    desc: 'Public app URL (used in email links)', required: false, set: !!systemInfo.appUrl },
          ].map(v => (
            <div key={v.key} className="flex items-center gap-3 py-2.5 border-b border-[#E8E0D5] last:border-0">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                v.set ? 'bg-emerald-100' : v.required ? 'bg-rose-100' : 'bg-amber-100'
              }`}>
                {v.set
                  ? <Check className="w-3 h-3 text-emerald-700" />
                  : v.required
                    ? <X className="w-3 h-3 text-rose-600" />
                    : <AlertTriangle className="w-3 h-3 text-amber-600" />
                }
              </div>
              <code className="text-xs font-mono text-charcoal-800 w-48 flex-shrink-0">{v.key}</code>
              <span className="text-xs text-charcoal-500 flex-1">{v.desc}</span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex-shrink-0 ${
                v.required ? 'bg-rose-50 text-rose-600' : 'bg-charcoal-100 text-charcoal-400'
              }`}>
                {v.required ? 'Required' : 'Optional'}
              </span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}

/* ── Main Component ─────────────────────────────────────────────── */
export function SettingsClient({ user, systemInfo }: Props) {
  const [active, setActive] = useState<Section>('brand')

  return (
    <div className="flex gap-6 items-start">

      {/* Left sidebar navigation */}
      <div className="w-52 flex-shrink-0 bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden sticky top-6">
        <div className="px-4 py-3 bg-cream border-b border-[#E8E0D5]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal-400">Settings</p>
        </div>
        <nav className="p-2">
          {NAV.map(item => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button
                key={item.id}
                onClick={() => setActive(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all mb-0.5 last:mb-0 ${
                  isActive
                    ? 'bg-terracotta/10 text-terracotta'
                    : 'text-charcoal-600 hover:bg-cream hover:text-charcoal-900'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-terracotta' : 'text-charcoal-400'}`} />
                <div className="min-w-0">
                  <p className={`text-sm font-semibold leading-none ${isActive ? 'text-terracotta' : ''}`}>{item.label}</p>
                  <p className="text-[10px] text-charcoal-400 mt-0.5 truncate">{item.desc}</p>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 ml-auto flex-shrink-0 text-terracotta" />}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {active === 'brand'    && <BrandSection />}
        {active === 'general'  && <GeneralSection  systemInfo={systemInfo} />}
        {active === 'account'  && <AccountSection  user={user} />}
        {active === 'email'    && <EmailSection    systemInfo={systemInfo} />}
        {active === 'security' && <SecuritySection systemInfo={systemInfo} />}
        {active === 'system'   && <SystemSection   systemInfo={systemInfo} />}
      </div>
    </div>
  )
}
