'use client'

import { useState, useMemo, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Search, X, Plus, Shield, Briefcase, Wrench, User,
  MoreHorizontal, Edit2, KeyRound, PowerOff, Power,
  Trash2, Copy, Check, AlertTriangle, CheckCircle2, Mail, Eye,
  SlidersHorizontal, LockKeyhole, Activity,
} from 'lucide-react'
import {
  SECTIONS, ROLE_DEFAULTS, parsePermissions,
  type PermissionLevel, type UserPermissions,
} from '@/lib/portal-permissions'

/* ── Role config ─────────────────────────────────────────────────── */
const ROLE_CFG: Record<string, {
  label:  string
  avatar: string
  badge:  string
  icon:   React.ElementType
}> = {
  ADMIN:      { label: 'Admin',      avatar: '#B35C2A', badge: 'bg-terracotta/10 text-terracotta',  icon: Shield    },
  MANAGER:    { label: 'Manager',    avatar: '#87A878', badge: 'bg-sage/15 text-sage-600',          icon: Briefcase },
  PRODUCTION: { label: 'Production', avatar: '#B07D2A', badge: 'bg-amber-50 text-amber-700',        icon: Wrench    },
}

const ROLE_TABS = [
  { key: 'ALL',        label: 'All'        },
  { key: 'ADMIN',      label: 'Admin'      },
  { key: 'MANAGER',    label: 'Manager'    },
  { key: 'PRODUCTION', label: 'Production' },
]

const ASSIGNABLE_ROLES = ['ADMIN', 'MANAGER', 'PRODUCTION'] as const

/* ── Types ───────────────────────────────────────────────────────── */
export interface UserRow {
  id:          string
  name:        string
  email:       string
  role:        string
  isActive:    boolean
  lastLoginAt: string | null
  createdAt:   string
  phone:       string | null
  permissions: string   // JSON blob from DB
}

interface Props {
  users:      UserRow[]
  roleCounts: Record<string, number>
  currentUserId: string
}

type ModalMode =
  | { type: 'create' }
  | { type: 'edit';           user: UserRow }
  | { type: 'reset-password'; user: UserRow }
  | { type: 'credentials';    user: UserRow }
  | { type: 'permissions';    user: UserRow }
  | { type: 'delete';         user: UserRow }
  | null

/* ── Helpers ─────────────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never'
  const diff  = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days  = Math.floor(diff / 86400000)
  if (mins  <  1) return 'Just now'
  if (mins  < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days  <  7) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function InlineAlert({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
      type === 'success'
        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
        : 'bg-rose-50 text-rose-700 border border-rose-200'
    }`}>
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        : <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
      {message}
    </div>
  )
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <div>
      <p className="text-xs font-semibold text-charcoal-500 mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2 bg-charcoal-900 text-emerald-400 text-sm font-mono rounded-lg tracking-wide">
          {value}
        </code>
        <button
          onClick={copy}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            copied
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-charcoal-100 text-charcoal-600 hover:bg-charcoal-200'
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}

/* ── Row action menu ─────────────────────────────────────────────── */
function ActionMenu({
  user,
  isSelf,
  onEdit,
  onReset,
  onPermissions,
  onToggleActive,
  onDelete,
}: {
  user:            UserRow
  isSelf:          boolean
  onEdit:          () => void
  onReset:         () => void
  onPermissions:   () => void
  onToggleActive:  () => void
  onDelete:        () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const items = [
    {
      label: 'Edit details',
      icon:  Edit2,
      action: () => { onEdit(); setOpen(false) },
      danger: false,
      disabled: false,
      hidden: false,
    },
    {
      label: 'Reset password',
      icon:  KeyRound,
      action: () => { onReset(); setOpen(false) },
      danger: false,
      disabled: false,
      hidden: false,
    },
    {
      label:    'Permissions',
      icon:     SlidersHorizontal,
      action:   () => { onPermissions(); setOpen(false) },
      danger:   false,
      disabled: user.role === 'ADMIN',
      hidden:   false,
    },
    {
      label:    user.isActive ? 'Deactivate' : 'Activate',
      icon:     user.isActive ? PowerOff : Power,
      action:   () => { onToggleActive(); setOpen(false) },
      danger:   user.isActive,
      disabled: isSelf,
      hidden:   false,
    },
    {
      label:    'Delete user',
      icon:     Trash2,
      action:   () => { onDelete(); setOpen(false) },
      danger:   true,
      disabled: isSelf,
      hidden:   false,
    },
  ]

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal-400 hover:bg-cream hover:text-charcoal-700 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-44 bg-white rounded-xl border border-[#E8E0D5] shadow-card-lg overflow-hidden">
          {items.filter(i => !i.hidden).map((item, idx, arr) => {
            const Icon = item.icon
            const isPerms = item.label === 'Permissions'
            return (
              <div key={item.label}>
                {isPerms && <div className="my-0.5 border-t border-[#E8E0D5]" />}
                <button
                  onClick={item.disabled ? undefined : item.action}
                  disabled={item.disabled}
                  title={isPerms && item.disabled ? 'Admin users always have full access' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors text-left disabled:opacity-40 disabled:cursor-not-allowed ${
                    item.danger
                      ? 'text-rose-600 hover:bg-rose-50'
                      : 'text-charcoal-700 hover:bg-cream'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {item.label}
                  {item.disabled && !isPerms && <span className="ml-auto text-[9px] text-charcoal-400">Self</span>}
                  {item.disabled &&  isPerms && <LockKeyhole className="ml-auto w-3 h-3 text-charcoal-400" />}
                </button>
                {isPerms && <div className="my-0.5 border-t border-[#E8E0D5]" />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ── Modal shell ─────────────────────────────────────────────────── */
function Modal({ title, subtitle, onClose, children, size = 'md' }: {
  title:     string
  subtitle?: string
  onClose:   () => void
  children:  React.ReactNode
  size?:     'md' | 'lg'
}) {
  useEffect(() => {
    function esc(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-charcoal-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl border border-[#E8E0D5] shadow-card-lg w-full overflow-hidden ${size === 'lg' ? 'max-w-lg' : 'max-w-md'}`}>
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-[#E8E0D5] bg-cream">
          <div>
            <h2 className="font-heading text-base font-bold text-charcoal-900">{title}</h2>
            {subtitle && <p className="text-xs text-charcoal-400 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-charcoal-400 hover:bg-charcoal-100 hover:text-charcoal-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  )
}

/* ── Credentials modal ───────────────────────────────────────────── */
function CredentialsModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const [tempPw,   setTempPw]   = useState<string | null>(null)
  const [loading,  startLoad]   = useTransition()
  const [err,      setErr]      = useState<string | null>(null)

  function handleReveal() {
    startLoad(async () => {
      setErr(null)
      const res  = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sendEmail: false }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Failed'); return }
      setTempPw(data.tempPassword)
    })
  }

  const cfg = ROLE_CFG[user.role] ?? { label: user.role, avatar: '#B8BEBE', badge: '', icon: User }
  const Icon = cfg.icon

  return (
    <Modal title="User Credentials" subtitle="Username and password for this account" onClose={onClose}>
      <div className="space-y-4">

        {/* User identity */}
        <div className="flex items-center gap-3 p-3.5 bg-cream rounded-xl border border-[#E8E0D5]">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
            style={{ backgroundColor: cfg.avatar }}
          >
            {initials(user.name)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-charcoal-900 truncate">{user.name}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-0.5 ${cfg.badge}`}>
              <Icon className="w-2.5 h-2.5" />{cfg.label}
            </span>
          </div>
        </div>

        {/* Username */}
        <CopyField label="Username (Email)" value={user.email} />

        {/* Password */}
        <div>
          <p className="text-xs font-semibold text-charcoal-500 mb-1.5">Password</p>
          {tempPw ? (
            <CopyField label="" value={tempPw} />
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-charcoal-100 rounded-lg">
                <p className="text-sm font-mono text-charcoal-400 tracking-widest">••••••••••••</p>
              </div>
              <button
                onClick={handleReveal}
                disabled={loading}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-terracotta hover:bg-terracotta-dark text-white text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {loading
                  ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <KeyRound className="w-3.5 h-3.5" />
                }
                {loading ? 'Resetting…' : 'Reset & Reveal'}
              </button>
            </div>
          )}
          {!tempPw && (
            <p className="text-[11px] text-charcoal-400 mt-1.5">
              Password is hashed — revealing generates a new temporary password.
            </p>
          )}
          {tempPw && (
            <p className="text-[11px] text-amber-700 mt-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Password was reset. Share this with the user securely.
            </p>
          )}
        </div>

        {err && <InlineAlert type="error" message={err} />}

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl text-sm font-semibold text-charcoal-600 bg-cream hover:bg-cream-dark transition-colors border border-[#E8E0D5]"
        >
          Close
        </button>
      </div>
    </Modal>
  )
}

/* ── Create / Edit modal ─────────────────────────────────────────── */
function UserFormModal({
  mode,
  user,
  onClose,
  onDone,
}: {
  mode:    'create' | 'edit'
  user?:   UserRow
  onClose: () => void
  onDone:  (tempPassword?: string) => void
}) {
  const [name,     setName]     = useState(user?.name  ?? '')
  const [email,    setEmail]    = useState(user?.email ?? '')
  const [phone,    setPhone]    = useState(user?.phone ?? '')
  const [role,     setRole]     = useState(user?.role  ?? 'MANAGER')
  const [err,      setErr]      = useState<string | null>(null)
  const [saving,   startSave]   = useTransition()
  const [sending,  startSend]   = useTransition()

  // Step 2 state — credential preview after creation
  const [created, setCreated] = useState<{ userId: string; tempPassword: string } | null>(null)

  function handleSubmit() {
    startSave(async () => {
      setErr(null)
      const url    = mode === 'create' ? '/api/admin/users' : `/api/admin/users/${user!.id}`
      const method = mode === 'create' ? 'POST' : 'PATCH'
      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, role }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Something went wrong'); return }
      if (mode === 'create' && data.tempPassword) {
        setCreated({ userId: data.userId, tempPassword: data.tempPassword })
      } else {
        onDone()
      }
    })
  }

  function handleSendEmail() {
    if (!created) return
    startSend(async () => {
      await fetch(`/api/admin/users/${created.userId}/send-credentials`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ tempPassword: created.tempPassword }),
      })
      onDone(created.tempPassword)
    })
  }

  /* ── Step 2: Credential preview ──────────────────────────────── */
  if (created) {
    const roleCfg = ROLE_CFG[role] ?? { label: role, avatar: '#B8BEBE', badge: '', icon: User }
    const RoleIcon = roleCfg.icon
    return (
      <Modal
        title="Account Created"
        subtitle="Review and share credentials with the user"
        onClose={() => { onDone(created.tempPassword) }}
      >
        <div className="space-y-4">
          {/* Success banner */}
          <div className="flex items-center gap-2.5 px-3.5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-sm font-semibold text-emerald-800">User account created successfully</p>
          </div>

          {/* User identity card */}
          <div className="flex items-center gap-3 p-3.5 bg-cream rounded-xl border border-[#E8E0D5]">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-sm font-bold"
              style={{ backgroundColor: roleCfg.avatar }}
            >
              {initials(name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-charcoal-900">{name}</p>
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mt-0.5 ${roleCfg.badge}`}>
                <RoleIcon className="w-2.5 h-2.5" />{roleCfg.label}
              </span>
            </div>
          </div>

          {/* Credentials */}
          <div className="rounded-xl border border-[#E8E0D5] overflow-hidden">
            <div className="px-4 py-2.5 bg-charcoal-900 border-b border-charcoal-800">
              <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal-400">Login Credentials</p>
            </div>
            <div className="p-4 space-y-3 bg-charcoal-900">
              <CopyField label="Username (Email)" value={email} />
              <CopyField label="Password"         value={created.tempPassword} />
            </div>
          </div>

          <p className="text-[11px] text-charcoal-400 flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 text-amber-500 flex-shrink-0 mt-0.5" />
            Copy and share these credentials securely. The password cannot be retrieved after this screen.
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2.5 pt-1">
            <button
              onClick={handleSendEmail}
              disabled={sending}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors disabled:opacity-50"
            >
              {sending
                ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Mail className="w-4 h-4" />
              }
              {sending ? 'Sending…' : 'Send via Email'}
            </button>
            <button
              onClick={() => onDone(created.tempPassword)}
              className="flex-1 inline-flex items-center justify-center py-2.5 rounded-xl text-sm font-semibold text-charcoal-600 bg-cream hover:bg-cream-dark border border-[#E8E0D5] transition-colors"
            >
              Done without email
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  /* ── Step 1: Form ────────────────────────────────────────────── */
  return (
    <Modal
      title={mode === 'create' ? 'Create User' : 'Edit User'}
      subtitle={mode === 'create' ? 'Internal team member — not a vendor' : `Editing ${user?.name}`}
      onClose={onClose}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Full Name *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="form-input"
              placeholder="Jane Smith"
              autoFocus
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Email Address *</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="form-input"
              placeholder="jane@forestry.ae"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Phone</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="form-input"
              placeholder="+971 50 000 0000"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-semibold text-charcoal-600 mb-1.5">Role *</label>
            <div className="grid grid-cols-3 gap-2">
              {ASSIGNABLE_ROLES.map(r => {
                const cfg      = ROLE_CFG[r]
                const Icon     = cfg.icon
                const selected = role === r
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 transition-all ${
                      selected
                        ? 'border-terracotta bg-terracotta/8'
                        : 'border-[#E8E0D5] bg-white hover:border-charcoal-300 hover:bg-cream/60'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      selected ? 'bg-terracotta text-white' : 'bg-charcoal-100 text-charcoal-500'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className={`text-xs font-semibold leading-none ${
                      selected ? 'text-terracotta' : 'text-charcoal-600'
                    }`}>
                      {cfg.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {err && <InlineAlert type="error" message={err} />}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim() || !email.trim()}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? (mode === 'edit' ? 'Saving…' : 'Creating…') : (mode === 'edit' ? 'Save User' : 'Create User')}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-charcoal-600 hover:bg-cream transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Reset password modal ────────────────────────────────────────── */
function ResetPasswordModal({ user, onClose, onDone }: {
  user:    UserRow
  onClose: () => void
  onDone:  () => void
}) {
  const [sendEmail,  setSendEmail]  = useState(true)
  const [tempPw,     setTempPw]     = useState<string | null>(null)
  const [err,        setErr]        = useState<string | null>(null)
  const [saving,     startSave]     = useTransition()
  const [showPw,     setShowPw]     = useState(true)

  function handleReset() {
    startSave(async () => {
      setErr(null)
      const res  = await fetch(`/api/admin/users/${user.id}/reset-password`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ sendEmail }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Reset failed'); return }
      setTempPw(data.tempPassword)
    })
  }

  if (tempPw) {
    return (
      <Modal title="Password Reset" subtitle={`New temporary password for ${user.name}`} onClose={() => { onDone(); onClose() }}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800 font-medium">
              Password reset successfully{sendEmail ? ' and email sent' : ''}.
            </p>
          </div>
          <CopyField label="Temporary Password" value={tempPw} />
          <p className="text-xs text-charcoal-400">
            Share this password securely. The user should change it immediately after logging in.
          </p>
          <button
            onClick={() => { onDone(); onClose() }}
            className="w-full inline-flex items-center justify-center bg-charcoal-900 hover:bg-charcoal-800 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
          >
            Done
          </button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal title="Reset Password" subtitle={`Reset password for ${user.name}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="p-4 bg-cream rounded-xl border border-[#E8E0D5]">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ backgroundColor: ROLE_CFG[user.role]?.avatar ?? '#B8BEBE' }}>
              {initials(user.name)}
            </div>
            <div>
              <p className="text-sm font-semibold text-charcoal-900">{user.name}</p>
              <p className="text-xs text-charcoal-400">{user.email}</p>
            </div>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={sendEmail}
            onChange={e => setSendEmail(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[#E8E0D5] text-terracotta focus:ring-terracotta/20"
          />
          <div>
            <p className="text-sm font-medium text-charcoal-800 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5" /> Send new password via email
            </p>
            <p className="text-xs text-charcoal-400 mt-0.5">Sends to {user.email}</p>
          </div>
        </label>

        {err && <InlineAlert type="error" message={err} />}

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={handleReset}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? 'Resetting…' : 'Reset Password'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-charcoal-600 hover:bg-cream transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Delete confirm modal ────────────────────────────────────────── */
function DeleteModal({ user, onClose, onDone }: {
  user:    UserRow
  onClose: () => void
  onDone:  () => void
}) {
  const [err,     setErr]     = useState<string | null>(null)
  const [deleting, startDel]  = useTransition()

  function handleDelete() {
    startDel(async () => {
      setErr(null)
      const res  = await fetch(`/api/admin/users/${user.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Delete failed'); return }
      onDone(); onClose()
    })
  }

  return (
    <Modal title="Delete User" subtitle="This action cannot be undone" onClose={onClose}>
      <div className="space-y-4">
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-rose-800">Permanently delete this user?</p>
            <p className="text-xs text-rose-700 mt-0.5">
              <strong>{user.name}</strong> ({user.email}) will be removed from the system. Their account and login will be lost.
            </p>
          </div>
        </div>

        {err && <InlineAlert type="error" message={err} />}

        <div className="flex items-center gap-3">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {deleting && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {deleting ? 'Deleting…' : 'Delete User'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-charcoal-600 hover:bg-cream transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Permissions modal ───────────────────────────────────────────── */
const LEVEL_OPTIONS: { value: PermissionLevel | ''; label: string; cls: string }[] = [
  { value: '',         label: 'Default', cls: 'text-charcoal-500 bg-charcoal-50  border-charcoal-200' },
  { value: 'none',     label: 'None',    cls: 'text-rose-600    bg-rose-50       border-rose-200'    },
  { value: 'readonly', label: 'View',    cls: 'text-amber-700   bg-amber-50      border-amber-200'   },
  { value: 'editable', label: 'Edit',    cls: 'text-emerald-700 bg-emerald-50    border-emerald-200' },
]

function PermissionsModal({ user, onClose, onDone }: {
  user:    UserRow
  onClose: () => void
  onDone:  () => void
}) {
  const parsed = parsePermissions(user.permissions)
  const [overrides, setOverrides] = useState<Record<string, PermissionLevel | ''>>(() => {
    const init: Record<string, PermissionLevel | ''> = {}
    for (const s of SECTIONS) {
      init[s.id] = (parsed[s.id] as PermissionLevel) ?? ''
    }
    return init
  })
  const [saving, startSave] = useTransition()
  const [err,    setErr]    = useState<string | null>(null)

  const roleDefaults = ROLE_DEFAULTS[user.role] ?? {}
  const cfg          = ROLE_CFG[user.role] ?? { label: user.role, avatar: '#B8BEBE', badge: 'bg-charcoal-100 text-charcoal-600', icon: User }
  const RoleIcon     = cfg.icon

  function handleSave() {
    startSave(async () => {
      setErr(null)
      const finalPerms: Record<string, string> = {}
      for (const [k, v] of Object.entries(overrides)) {
        if (v) finalPerms[k] = v
      }
      const res  = await fetch(`/api/admin/users/${user.id}/permissions`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ permissions: finalPerms }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error ?? 'Save failed'); return }
      onDone()
      onClose()
    })
  }

  return (
    <Modal title="Section Permissions" subtitle={`Override access for ${user.name}`} onClose={onClose} size="lg">
      <div className="space-y-4">

        {/* User chip */}
        <div className="flex items-center gap-3 px-3.5 py-3 bg-cream rounded-xl border border-[#E8E0D5]">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: cfg.avatar }}
          >
            {initials(user.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-charcoal-900 truncate">{user.name}</p>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}>
              <RoleIcon className="w-2.5 h-2.5" />{cfg.label}
            </span>
          </div>
          <p className="text-[10px] text-charcoal-400 text-right leading-snug max-w-[100px]">
            Role defaults apply unless overridden
          </p>
        </div>

        {/* Column labels */}
        <div className="flex items-center px-3.5">
          <p className="flex-1 text-[10px] font-bold uppercase tracking-wider text-charcoal-400">Section</p>
          <div className="flex items-center gap-1">
            {LEVEL_OPTIONS.map(l => (
              <span key={l.value} className="w-14 text-center text-[9px] font-bold uppercase tracking-wider text-charcoal-400">
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Section rows */}
        <div className="space-y-1.5">
          {SECTIONS.map(section => {
            const SIcon      = section.icon
            const locked     = !!section.adminOnly
            const roleLevel  = roleDefaults[section.id] ?? 'none'
            const override   = overrides[section.id] ?? ''

            if (locked) {
              return (
                <div
                  key={section.id}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-charcoal-50 border border-dashed border-charcoal-200"
                >
                  <div className="w-7 h-7 rounded-lg bg-charcoal-200 flex items-center justify-center flex-shrink-0">
                    <SIcon className="w-3.5 h-3.5 text-charcoal-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-charcoal-500">{section.label}</p>
                    <p className="text-[10px] text-charcoal-400">Admin only — cannot be delegated</p>
                  </div>
                  <LockKeyhole className="w-3.5 h-3.5 text-charcoal-400 flex-shrink-0" />
                </div>
              )
            }

            return (
              <div key={section.id} className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E0D5] hover:border-charcoal-300 transition-colors">
                <div className="w-7 h-7 rounded-lg bg-terracotta/10 flex items-center justify-center flex-shrink-0">
                  <SIcon className="w-3.5 h-3.5 text-terracotta" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-charcoal-800">{section.label}</p>
                  <p className="text-[10px] text-charcoal-400">
                    Role default: <span className="font-semibold capitalize">{roleLevel}</span>
                  </p>
                </div>
                {/* Toggle buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  {LEVEL_OPTIONS.map(opt => {
                    const selected = override === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setOverrides(o => ({ ...o, [section.id]: opt.value }))}
                        className={`w-14 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                          selected
                            ? opt.cls
                            : 'text-charcoal-400 bg-white border-transparent hover:bg-cream hover:border-charcoal-200'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        {err && <InlineAlert type="error" message={err} />}

        <div className="flex items-center gap-3 pt-2 border-t border-[#E8E0D5]">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors disabled:opacity-50"
          >
            {saving && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {saving ? 'Saving…' : 'Save Permissions'}
          </button>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-charcoal-600 hover:bg-cream transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  )
}

/* ── Main component ──────────────────────────────────────────────── */
export function UsersListClient({ users, roleCounts, currentUserId }: Props) {
  const router = useRouter()

  const [query,       setQuery]       = useState('')
  const [activeRole,  setActiveRole]  = useState('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL')
  const [modal,       setModal]       = useState<ModalMode>(null)
  const [toast,       setToast]       = useState<{ type: 'success' | 'error'; msg: string } | null>(null)
  const [toggling,    startToggle]    = useTransition()

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])

  const filtered = useMemo(() => {
    let list = users
    if (activeRole !== 'ALL')      list = list.filter(u => u.role === activeRole)
    if (statusFilter === 'ACTIVE')   list = list.filter(u => u.isActive)
    if (statusFilter === 'INACTIVE') list = list.filter(u => !u.isActive)
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(u =>
        u.name.toLowerCase().includes(q)  ||
        u.email.toLowerCase().includes(q) ||
        (u.phone ?? '').includes(q)
      )
    }
    return list
  }, [users, query, activeRole, statusFilter])

  const activeCount   = users.filter(u => u.isActive).length
  const inactiveCount = users.length - activeCount

  function refresh() { router.refresh() }

  function showToast(type: 'success' | 'error', msg: string) {
    setToast({ type, msg })
  }

  function handleToggleActive(user: UserRow) {
    startToggle(async () => {
      const res  = await fetch(`/api/admin/users/${user.id}`, {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ isActive: !user.isActive }),
      })
      const data = await res.json()
      if (!res.ok) { showToast('error', data.error ?? 'Failed to update'); return }
      showToast('success', `${user.name} ${!user.isActive ? 'activated' : 'deactivated'}`)
      refresh()
    })
  }

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Admin Portal</p>
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Users</h1>
          <p className="text-sm text-charcoal-400 mt-1.5">Internal team — admins, managers & production</p>
        </div>
        <div className="flex items-center gap-2 mt-1 flex-shrink-0">
          <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
            <span className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{users.length}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-400 mt-0.5">Total</span>
          </div>
          <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-sage/10 border border-sage/20">
            <span className="font-heading text-2xl font-bold text-sage-600 leading-none">{activeCount}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-sage-600/70 mt-0.5">Active</span>
          </div>
          {inactiveCount > 0 && (
            <div className="flex flex-col items-end px-4 py-2.5 rounded-xl bg-red-50 border border-red-100">
              <span className="font-heading text-2xl font-bold text-red-600 leading-none">{inactiveCount}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-red-500/70 mt-0.5">Inactive</span>
            </div>
          )}
          <button
            onClick={() => setModal({ type: 'create' })}
            className="inline-flex items-center gap-2 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-semibold px-5 py-3 rounded-xl transition-colors shadow-warm-sm"
          >
            <Plus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────── */}
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-300 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
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

        {/* Role + status tabs row */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Role tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {ROLE_TABS.map(tab => {
              const count  = tab.key === 'ALL' ? users.length : (roleCounts[tab.key] ?? 0)
              const active = activeRole === tab.key
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveRole(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-charcoal-900 text-white shadow-sm'
                      : 'bg-white border border-[#E8E0D5] text-charcoal-500 hover:border-charcoal-300 hover:text-charcoal-700'
                  }`}
                >
                  {tab.label}
                  {count > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold ${
                      active ? 'bg-white/20 text-white' : 'bg-charcoal-100 text-charcoal-500'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === s
                    ? s === 'ACTIVE'   ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : s === 'INACTIVE' ? 'bg-rose-100 text-rose-700 border border-rose-200'
                    : 'bg-charcoal-900 text-white'
                    : 'bg-white border border-[#E8E0D5] text-charcoal-400 hover:text-charcoal-700'
                }`}
              >
                {s === 'ALL' ? 'All status' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── User list ──────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card flex flex-col items-center justify-center py-16 px-8 text-center">
          <div className="w-14 h-14 rounded-2xl bg-terracotta/8 flex items-center justify-center mb-5">
            <User className="w-6 h-6 text-terracotta/40" />
          </div>
          <p className="font-heading text-lg font-bold text-charcoal-900 mb-1">No users found</p>
          <p className="text-sm text-charcoal-400">
            {query ? `No results for "${query}"` : 'No users match the current filters'}
          </p>
          {(query || activeRole !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => { setQuery(''); setActiveRole('ALL'); setStatusFilter('ALL') }}
              className="mt-4 text-xs font-semibold text-terracotta hover:text-terracotta-dark transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E0D5] shadow-card overflow-hidden">
          {(query || activeRole !== 'ALL' || statusFilter !== 'ALL') && (
            <div className="px-6 py-2.5 border-b border-[#E8E0D5] bg-cream/40">
              <p className="text-xs text-charcoal-400">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                {query && <> for <span className="font-semibold text-charcoal-700">"{query}"</span></>}
              </p>
            </div>
          )}

          {/* Table header */}
          <div className="hidden md:grid grid-cols-[2fr_1fr_120px_120px_100px] gap-4 px-6 py-2.5 border-b border-[#E8E0D5] bg-cream/60">
            {['User', 'Role', 'Last Login', 'Joined', ''].map((h, i) => (
              <p key={i} className="text-[10px] font-bold uppercase tracking-wider text-charcoal-400">{h}</p>
            ))}
          </div>

          <ul className="divide-y divide-[#E8E0D5]">
            {filtered.map(user => {
              const cfg    = ROLE_CFG[user.role] ?? { label: user.role, avatar: '#B8BEBE', badge: 'bg-charcoal-100 text-charcoal-600', icon: User }
              const Icon   = cfg.icon
              const isSelf = user.id === currentUserId

              return (
                <li key={user.id} className="group">
                  <div className="grid md:grid-cols-[2fr_1fr_120px_120px_100px] gap-4 items-center px-6 py-4 hover:bg-cream/40 transition-colors">

                    {/* User info */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold tracking-wide ${!user.isActive ? 'opacity-50' : ''}`}
                        style={{ backgroundColor: cfg.avatar }}
                      >
                        {initials(user.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/admin/users/${user.id}`}
                            className="text-sm font-semibold text-charcoal-900 truncate hover:text-terracotta transition-colors"
                          >
                            {user.name}
                          </Link>
                          {isSelf && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-terracotta/10 text-terracotta flex-shrink-0">You</span>
                          )}
                          {!user.isActive && (
                            <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-500 flex-shrink-0">Inactive</span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-400 truncate">{user.email}</p>
                        {user.phone && <p className="text-[11px] text-charcoal-300 mt-0.5">{user.phone}</p>}
                      </div>
                    </div>

                    {/* Role */}
                    <div className="hidden md:block">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider ${cfg.badge}`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </span>
                    </div>

                    {/* Last login */}
                    <div className="hidden md:block">
                      <p className="text-xs text-charcoal-600 font-medium">{timeAgo(user.lastLoginAt)}</p>
                    </div>

                    {/* Joined */}
                    <div className="hidden md:block">
                      <p className="text-xs text-charcoal-600 font-medium">
                        {new Date(user.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 justify-end">
                      <Link
                        href={`/admin/users/${user.id}`}
                        title="View activity log"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal-400 hover:bg-terracotta/10 hover:text-terracotta transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Activity className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => setModal({ type: 'credentials', user })}
                        title="View credentials"
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-charcoal-400 hover:bg-terracotta/10 hover:text-terracotta transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <ActionMenu
                        user={user}
                        isSelf={isSelf}
                        onEdit={() => setModal({ type: 'edit', user })}
                        onReset={() => setModal({ type: 'reset-password', user })}
                        onPermissions={() => setModal({ type: 'permissions', user })}
                        onToggleActive={() => handleToggleActive(user)}
                        onDelete={() => setModal({ type: 'delete', user })}
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────── */}
      {modal?.type === 'credentials' && (
        <CredentialsModal user={modal.user} onClose={() => setModal(null)} />
      )}
      {modal?.type === 'create' && (
        <UserFormModal
          mode="create"
          onClose={() => setModal(null)}
          onDone={(tempPw) => {
            setModal(null)
            refresh()
            if (tempPw) showToast('success', 'User created — temp password generated')
          }}
        />
      )}
      {modal?.type === 'edit' && (
        <UserFormModal
          mode="edit"
          user={modal.user}
          onClose={() => setModal(null)}
          onDone={() => {
            setModal(null)
            refresh()
            showToast('success', 'User updated successfully')
          }}
        />
      )}
      {modal?.type === 'reset-password' && (
        <ResetPasswordModal
          user={modal.user}
          onClose={() => setModal(null)}
          onDone={() => refresh()}
        />
      )}
      {modal?.type === 'permissions' && (
        <PermissionsModal
          user={modal.user}
          onClose={() => setModal(null)}
          onDone={() => { refresh(); showToast('success', 'Permissions saved') }}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal
          user={modal.user}
          onClose={() => setModal(null)}
          onDone={() => { refresh(); showToast('success', 'User deleted') }}
        />
      )}

      {/* ── Toast ──────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-card-lg border text-sm font-semibold transition-all ${
          toast.type === 'success'
            ? 'bg-white border-emerald-200 text-emerald-800'
            : 'bg-white border-rose-200 text-rose-700'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            : <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-1 text-charcoal-400 hover:text-charcoal-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  )
}
