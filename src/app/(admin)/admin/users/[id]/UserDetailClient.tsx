'use client'

import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Calendar, Shield, Activity, Zap } from 'lucide-react'
import { ActivityLog }      from '@/components/admin/ActivityLog'
import { UserAvatarUpload } from '@/components/admin/UserAvatarUpload'

const ROLE_BADGE: Record<string, string> = {
  ADMIN:      'bg-terracotta/10 text-terracotta',
  MANAGER:    'bg-blue-50       text-blue-700',
  PRODUCTION: 'bg-purple-50     text-purple-700',
  VENDOR:     'bg-emerald-50    text-emerald-700',
}

interface UserData {
  id:          string
  name:        string
  email:       string
  role:        string
  isActive:    boolean
  phone:       string | null
  lastLoginAt: string | null
  createdAt:   string
  avatarUrl:   string | null
}

interface Stats {
  total30d:     number
  total7d:      number
  lastActionAt: string | null
  lastAction:   string | null
}

interface Props {
  user:  UserData
  stats: Stats
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function UserDetailClient({ user, stats }: Props) {
  const roleBadge = ROLE_BADGE[user.role] ?? 'bg-charcoal-100 text-charcoal-700'
  const initials  = user.name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || 'U'

  return (
    <div className="space-y-6">

      {/* Back link */}
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-charcoal-400 hover:text-terracotta transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to users
      </Link>

      {/* ── Profile header card ─────────────────────────── */}
      <div className="bg-white rounded-2xl border border-cream-darker shadow-card overflow-hidden">
        <div className="px-6 py-6 flex items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-20 h-20 rounded-2xl object-cover shadow-warm-sm border border-[#E8E0D5]"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-terracotta to-terracotta-dark grid place-items-center text-white font-heading text-2xl font-bold shadow-warm-sm">
                {initials}
              </div>
            )}
            <span className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ring-4 ring-white ${user.isActive ? 'bg-emerald-500' : 'bg-charcoal-300'}`} aria-label={user.isActive ? 'Active' : 'Inactive'} />
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h1 className="font-heading text-2xl font-bold text-charcoal-900 leading-tight truncate">
                {user.name}
              </h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${roleBadge}`}>
                {user.role}
              </span>
              {!user.isActive && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-charcoal-100 text-charcoal-600">
                  Inactive
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-charcoal-500 mt-2">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-charcoal-300" />
                {user.email}
              </span>
              {user.phone && (
                <span className="inline-flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-charcoal-300" />
                  {user.phone}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-charcoal-300" />
                Joined {fmtDate(user.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-charcoal-300" />
                Last login {fmtDateTime(user.lastLoginAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <div className="grid grid-cols-3 border-t border-cream-darker bg-cream/30">
          <div className="px-6 py-4 border-r border-cream-darker">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-terracotta" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-500">Last 7 days</p>
            </div>
            <p className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{stats.total7d}</p>
            <p className="text-[10px] text-charcoal-400 mt-1">events</p>
          </div>
          <div className="px-6 py-4 border-r border-cream-darker">
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-3.5 h-3.5 text-charcoal-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-500">Last 30 days</p>
            </div>
            <p className="font-heading text-2xl font-bold text-charcoal-900 leading-none">{stats.total30d}</p>
            <p className="text-[10px] text-charcoal-400 mt-1">events</p>
          </div>
          <div className="px-6 py-4">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3.5 h-3.5 text-charcoal-400" />
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-charcoal-500">Last action</p>
            </div>
            <p className="font-heading text-sm font-bold text-charcoal-900 leading-tight truncate">
              {stats.lastAction ? stats.lastAction.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()) : '—'}
            </p>
            <p className="text-[10px] text-charcoal-400 mt-1">{stats.lastActionAt ? fmtDateTime(stats.lastActionAt) : 'never'}</p>
          </div>
        </div>
      </div>

      {/* ── Profile Photo ────────────────────────────────── */}
      <UserAvatarUpload
        userId={user.id}
        initialAvatarUrl={user.avatarUrl}
        userName={user.name}
        isSelf={false}
      />

      {/* ── Activity Log ─────────────────────────────────── */}
      <ActivityLog userId={user.id} />
    </div>
  )
}
