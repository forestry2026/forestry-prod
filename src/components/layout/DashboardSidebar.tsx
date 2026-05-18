'use client'

import Link             from 'next/link'
import { usePathname }   from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut }       from 'next-auth/react'
import {
  LayoutDashboard, Package, Zap, Truck,
  Users, FileText, Settings, LogOut, ChevronDown, Compass,
  ClipboardList, ListOrdered, BarChart3, ShoppingBag, Loader2, MonitorPlay, Wand2, UserCircle, Image,
} from 'lucide-react'
import { canAccess, parsePermissions, type UserPermissions } from '@/lib/portal-permissions'
import { useOnboarding } from '@/components/onboarding/OnboardingProvider'
import { adminTour }     from '@/components/onboarding/tours/adminTour'

/* ── Types ──────────────────────────────────────────────────────── */
interface BadgeCounts {
  rfps?:           number
  accessRequests?: number
}

interface NavItem {
  label:    string
  href:     string
  icon:     React.ElementType
  badge?:   number
  disabled?: boolean
  tourId?:  string
}

/* ── Badge ──────────────────────────────────────────────────────── */
function Badge({ count }: { count: number }) {
  if (!count) return null
  return (
    <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-terracotta text-white text-[10px] font-bold leading-none flex-shrink-0">
      {count > 99 ? '99+' : count}
    </span>
  )
}

/* ── Nav Item ───────────────────────────────────────────────────── */
function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon

  if (item.disabled) {
    return (
      <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg opacity-35 cursor-not-allowed select-none">
        <Icon className="w-4 h-4 flex-shrink-0 text-charcoal-400" />
        <span className="text-[13px] font-medium text-charcoal-600 flex-1 leading-none">{item.label}</span>
        <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-charcoal-100 text-charcoal-400 flex-shrink-0 leading-none">
          Soon
        </span>
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      data-tour-id={item.tourId}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors duration-150 ${
        active
          ? 'bg-terracotta/10 text-terracotta'
          : 'text-charcoal-600 hover:bg-cream hover:text-charcoal-900'
      }`}
    >
      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-terracotta' : 'text-charcoal-400'}`} />
      <span className={`text-[13px] leading-none flex-1 ${active ? 'font-semibold' : 'font-medium'}`}>
        {item.label}
      </span>
      {!!item.badge && <Badge count={item.badge} />}
    </Link>
  )
}

/* ── Section Label ──────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-charcoal-400 leading-none select-none">
      {children}
    </p>
  )
}

/* ── Identity header ────────────────────────────────────────────── */
function IdentityHeader({
  name, email, role, avatarUrl,
}: { name: string; email: string; role: string; avatarUrl: string | null }) {
  const ini = name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase() || 'A'
  const roleBadgeColors: Record<string, string> = {
    ADMIN:      'bg-terracotta/12 text-terracotta',
    MANAGER:    'bg-blue-50 text-blue-700',
    PRODUCTION: 'bg-purple-50 text-purple-700',
  }
  const badgeClass = roleBadgeColors[role] ?? 'bg-charcoal-100 text-charcoal-600'

  return (
    <div className="relative border-b border-[#E8E0D5] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#FDF8F3] via-cream/60 to-[#F5EEE6]" />
      <div className="relative px-4 pt-5 pb-4 flex items-start gap-3">
        <div className="relative flex-shrink-0">
          {avatarUrl ? (
            <div className="w-14 h-14 rounded-xl border border-[#E0D8D0] bg-white overflow-hidden shadow-sm">
              <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-terracotta to-terracotta-dark flex items-center justify-center shadow-warm-sm">
              <span className="font-heading text-sm font-bold text-white leading-none tracking-wide">{ini}</span>
            </div>
          )}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#FDF8F3]" />
        </div>
        <div className="min-w-0 flex-1 flex flex-col items-start gap-1">
          <p className="font-heading text-[13px] font-bold text-charcoal-900 leading-tight truncate w-full">
            {name}
          </p>
          <span className={`inline-flex items-center px-1.5 py-px rounded-full text-[9px] font-bold uppercase tracking-wider -ml-1.5 ${badgeClass}`}>
            {role}
          </span>
          <p className="text-[10px] text-charcoal-400 font-medium truncate w-full leading-none">{email}</p>
        </div>
      </div>
    </div>
  )
}

/* ── Main ───────────────────────────────────────────────────────── */
export default function DashboardSidebar() {
  const pathname = usePathname()
  const [counts,       setCounts]      = useState<BadgeCounts>({})
  const [orderOpen,    setOrderOpen]   = useState(false)
  const [userRole,     setUserRole]    = useState<string>('ADMIN')
  const [userPerms,    setUserPerms]   = useState<UserPermissions>({})
  const [userName,     setUserName]    = useState<string>('')
  const [userEmail,    setUserEmail]   = useState<string>('')
  const [userAvatar,   setUserAvatar]  = useState<string | null>(null)
  const [loggingOut,   setLoggingOut]  = useState(false)

  useEffect(() => {
    fetch('/api/notifications/badge-counts')
      .then(r => r.ok ? r.json() : {})
      .then(setCounts)
      .catch(() => {})

    fetch('/api/admin/me')
      .then(r => r.ok ? r.json() : {})
      .then((data: { role?: string; permissions?: string; name?: string; email?: string; avatarUrl?: string | null }) => {
        if (data.role)  setUserRole(data.role)
        if (data.name)  setUserName(data.name)
        if (data.email) setUserEmail(data.email)
        setUserAvatar(data.avatarUrl ?? null)
        const parsed = parsePermissions(data.permissions ?? '{}')
        setUserPerms(parsed)
      })
      .catch(() => {})
  }, [pathname])

  // Exact-match routes that would otherwise greedily match child paths
  const EXACT_MATCH = new Set(['/admin/settings'])

  const isActive = (href: string) =>
    href === '/admin' || EXACT_MATCH.has(href)
      ? pathname === href
      : pathname === href || pathname.startsWith(href + '/')

  const allAdminItems: (NavItem & { sectionId: string })[] = [
    { sectionId: 'dashboard',  label: 'CMS Dashboard', href: '/admin',            icon: LayoutDashboard, badge: 0 },
    { sectionId: 'products',   label: 'Products',      href: '/admin/products',   icon: Package,         badge: 0,                            tourId: 'admin.nav.products' },
    { sectionId: 'attributes', label: 'Attributes',    href: '/admin/attributes', icon: Zap,             badge: 0 },
    { sectionId: 'vendors',    label: 'Vendors',       href: '/admin/vendors',    icon: Truck,           badge: counts.accessRequests ?? 0,   tourId: 'admin.nav.vendors'  },
    { sectionId: 'users',      label: 'Users',         href: '/admin/users',      icon: Users,           badge: 0,                            tourId: 'admin.nav.users'    },
    { sectionId: 'rfps',           label: 'RFPs',            href: '/admin/rfps',            icon: FileText, badge: counts.rfps ?? 0,         tourId: 'admin.nav.rfps'     },
    { sectionId: 'custom-designs', label: 'Custom Designs',  href: '/admin/custom-designs',  icon: Wand2,    badge: 0 },
  ]

  const adminItems = allAdminItems.filter(item =>
    canAccess(userRole, userPerms, item.sectionId)
  )

  // ORDER MANAGEMENT — disabled until next dev phase.
  // To re-enable: flip disabled: true → false on each item below.
  const orderItems: NavItem[] = [
    { label: 'Quotations',            href: '/quotations',       icon: ClipboardList, disabled: true },
    { label: 'Production Queue',      href: '/production-queue', icon: ListOrdered,   disabled: true },
    { label: 'Production Dashboard',  href: '/dashboard',        icon: BarChart3,     disabled: true },
    { label: 'Vendor Orders',         href: '/orders',           icon: ShoppingBag,   disabled: true },
  ]

  const footerItems: NavItem[] = [
    { label: 'My Profile', href: '/admin/profile', icon: UserCircle },
    ...(canAccess(userRole, userPerms, 'settings')
      ? [
          { label: 'Hero Banners', href: '/admin/settings/hero-banners',  icon: Image       },
          { label: 'Login Slides', href: '/admin/settings/login-slides', icon: MonitorPlay },
          { label: 'Settings',     href: '/admin/settings',              icon: Settings    },
        ]
      : []),
  ]

  return (
    <aside className="w-56 bg-white border border-[#E8E0D5] shadow-card h-full flex flex-col sticky top-4 ml-5 mr-3 mt-4 mb-4 rounded-xl overflow-hidden">

      <IdentityHeader name={userName} email={userEmail} role={userRole} avatarUrl={userAvatar} />

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 pt-3 overflow-y-auto">

        {/* Admin Panel */}
        <SectionLabel>Admin</SectionLabel>
        <div className="space-y-0.5">
          {adminItems.map(item => (
            <NavLink key={item.href} item={item} active={!item.disabled && isActive(item.href)} />
          ))}
        </div>

        {/* Order Management — collapsible */}
        <div className="mt-2 border-t border-[#E8E0D5]">
          <button
            onClick={() => setOrderOpen(o => !o)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-cream transition-colors group"
          >
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-charcoal-400 group-hover:text-charcoal-600 transition-colors flex-1 text-left leading-none">
              Order Management
            </span>
            <ChevronDown
              className={`w-3 h-3 text-charcoal-400 transition-transform duration-200 flex-shrink-0 ${orderOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {orderOpen && (
            <div className="space-y-0.5 pb-1">
              {orderItems.map(item => (
                <NavLink key={item.href} item={item} active={false} />
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <div className="px-2 py-3 border-t border-[#E8E0D5] space-y-0.5">
        {footerItems.map(item => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
        <ReplayTourButton />
        <button
          onClick={async () => {
            setLoggingOut(true)
            await signOut({ redirect: false })
            window.location.href = '/login'
          }}
          disabled={loggingOut}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-charcoal-500 hover:bg-cream hover:text-charcoal-900 disabled:opacity-60"
        >
          {loggingOut
            ? <Loader2 className="w-4 h-4 flex-shrink-0 text-charcoal-400 animate-spin" />
            : <LogOut  className="w-4 h-4 flex-shrink-0 text-charcoal-400" />
          }
          <span className="text-[13px] font-medium leading-none">
            {loggingOut ? 'Logging out…' : 'Logout'}
          </span>
        </button>
      </div>

    </aside>
  )
}

/* ── Replay tour button ─────────────────────────────────────────── */
function ReplayTourButton() {
  const { replay } = useOnboarding()
  return (
    <button
      type="button"
      onClick={() => replay(adminTour)}
      title="Replay the first-run tour"
      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors text-charcoal-500 hover:bg-cream hover:text-terracotta"
    >
      <Compass className="w-4 h-4 flex-shrink-0 text-charcoal-400" />
      <span className="text-[13px] font-medium leading-none">Replay tour</span>
    </button>
  )
}
