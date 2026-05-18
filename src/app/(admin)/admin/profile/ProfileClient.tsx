'use client'

import { useState }           from 'react'
import { Mail, Phone, Calendar, Shield, Save, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'
import { UserAvatarUpload }   from '@/components/admin/UserAvatarUpload'

const ROLE_BADGE: Record<string, string> = {
  ADMIN:      'bg-terracotta/10 text-terracotta',
  MANAGER:    'bg-blue-50      text-blue-700',
  PRODUCTION: 'bg-purple-50    text-purple-700',
}

interface UserData {
  id:          string
  name:        string
  email:       string
  role:        string
  phone:       string | null
  avatarUrl:   string | null
  createdAt:   string
  lastLoginAt: string | null
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function ProfileClient({ user }: { user: UserData }) {
  const roleBadge = ROLE_BADGE[user.role] ?? 'bg-charcoal-100 text-charcoal-700'

  const [name,    setName]    = useState(user.name)
  const [phone,   setPhone]   = useState(user.phone ?? '')
  const [saving,  setSaving]  = useState(false)
  const [toast,   setToast]   = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 3500)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: name.trim(), phone: phone.trim() || null }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Save failed')
      }
      showToast('ok', 'Profile updated')
    } catch (e: any) {
      showToast('err', e.message)
    } finally {
      setSaving(false)
    }
  }

  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Admin Portal</p>
        <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">My Profile</h1>
        <p className="text-sm text-charcoal-400 mt-1.5">{dateLabel}</p>
      </div>

      {/* ── Profile snapshot card ────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-cream-darker shadow-card overflow-hidden">
        <div className="px-6 py-5 flex items-center gap-4">
          {/* Avatar — shown via UserAvatarUpload below; small preview here */}
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-terracotta to-terracotta-dark grid place-items-center text-white font-heading text-xl font-bold shadow-warm-sm flex-shrink-0">
            {name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="font-heading text-xl font-bold text-charcoal-900 leading-tight truncate">{user.name}</h2>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadge}`}>
                {user.role}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-charcoal-500">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-charcoal-300" />{user.email}
              </span>
              {user.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-charcoal-300" />{user.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-charcoal-300" />Joined {fmtDate(user.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-charcoal-300" />Last login {fmtDateTime(user.lastLoginAt)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Avatar upload ────────────────────────────────────────── */}
      <UserAvatarUpload
        userId={user.id}
        initialAvatarUrl={user.avatarUrl}
        userName={user.name}
        isSelf={true}
      />

      {/* ── Edit details ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-cream-darker shadow-card overflow-hidden">
        <div className="px-5 py-3 border-b border-[#F0EBE3] bg-cream/50">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-400">Personal Details</p>
        </div>
        <div className="px-5 py-5 space-y-4">

          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-charcoal-500 mb-1.5">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E0D5] bg-cream/40 text-sm text-charcoal-900 font-medium placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta/50 transition-all"
              placeholder="Your full name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-charcoal-500 mb-1.5">
              Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E0D5] bg-cream/40 text-sm text-charcoal-900 font-medium placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-terracotta/30 focus:border-terracotta/50 transition-all"
              placeholder="+971 50 000 0000"
            />
          </div>

          {/* Email — read-only */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-[0.12em] text-charcoal-500 mb-1.5">
              Email <span className="normal-case font-normal text-charcoal-300">(cannot change)</span>
            </label>
            <input
              type="email"
              value={user.email}
              disabled
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#E8E0D5] bg-charcoal-50/40 text-sm text-charcoal-400 font-medium cursor-not-allowed"
            />
          </div>

          {/* Toast */}
          {toast && (
            <div className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-semibold border ${
              toast.type === 'ok'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {toast.type === 'ok'
                ? <CheckCircle2  className="w-3.5 h-3.5 flex-shrink-0" />
                : <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              }
              {toast.msg}
            </div>
          )}

          {/* Save button */}
          <div className="flex justify-end pt-1">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-terracotta hover:bg-terracotta-dark text-white text-sm font-bold rounded-xl transition-colors shadow-warm-sm disabled:opacity-50"
            >
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Save    className="w-4 h-4" />
              }
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>

        </div>
      </div>

    </div>
  )
}
