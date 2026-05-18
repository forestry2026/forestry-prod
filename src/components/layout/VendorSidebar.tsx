'use client'

import Link            from 'next/link'
import { usePathname }  from 'next/navigation'
import { signOut }      from 'next-auth/react'
import { useState }     from 'react'
import {
  LayoutDashboard, Package, ShoppingCart,
  Clock, User, LogOut, Loader2, Wand2, Compass,
} from 'lucide-react'
import { useOnboarding } from '@/components/onboarding/OnboardingProvider'
import { vendorTour }    from '@/components/onboarding/tours/vendorTour'

/* ── Types ──────────────────────────────────────────────────────── */
interface Props {
  user:            { name?: string | null; email?: string | null }
  enquiryCount?:   number
  quotedRfpCount?: number
  logoUrl?:        string | null
}

interface NavItem {
  label:   string
  href:    string
  icon:    React.ElementType
  badge?:  number
  tourId?: string
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function initials(name: string | null | undefined): string {
  if (!name) return 'V'
  return name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]).join('').toUpperCase()
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

/* ── Identity Header (TOP) ───────────────────────────────────────── */
function IdentityHeader({ user, logoUrl }: { user: Props['user']; logoUrl?: string | null }) {
  const ini  = initials(user.name)
  const name = user.name  ?? 'Vendor'
  const email = user.email ?? ''

  return (
    <div className="relative overflow-hidden border-b border-[#E8E0D5]">
      {/* Warm gradient bg */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#FDF8F3] via-cream/60 to-[#F5EEE6]" />

      <div className="relative px-4 pt-5 pb-4 flex items-center gap-3">
        {/* Avatar / logo */}
        <div className="relative flex-shrink-0">
          {logoUrl ? (
            <div className="w-11 h-11 rounded-xl border border-[#E0D8D0] bg-white flex items-center justify-center overflow-hidden shadow-sm">
              <img src={logoUrl} alt={name} className="w-full h-full object-contain p-1.5" />
            </div>
          ) : (
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-terracotta to-terracotta-dark flex items-center justify-center shadow-warm-sm">
              <span className="font-heading text-sm font-bold text-white leading-none tracking-wide">
                {ini}
              </span>
            </div>
          )}
          {/* Online dot */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-[#FDF8F3]" />
        </div>

        {/* Name + role + email */}
        <div className="min-w-0 flex-1">
          <p className="font-heading text-[13px] font-bold text-charcoal-900 leading-tight truncate mb-0.5">
            {name}
          </p>
          <span className="inline-flex items-center -ml-1.5 px-1.5 py-px rounded-full bg-terracotta/12 text-terracotta text-[9px] font-bold uppercase tracking-wider">
            Vendor
          </span>
          <p className="text-[10px] text-charcoal-400 font-medium truncate mt-1 leading-normal">
            {email}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Sign Out Footer (BOTTOM) ────────────────────────────────────── */
function SignOutFooter({ loggingOut, onSignOut }: { loggingOut: boolean; onSignOut: () => void }) {
  const { replay } = useOnboarding()
  return (
    <div className="border-t border-[#E8E0D5] bg-white">
      <button
        onClick={() => replay(vendorTour)}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-charcoal-500 hover:text-terracotta hover:bg-cream/60 transition-all duration-150 group border-b border-[#E8E0D5]"
        title="Replay the first-run tour"
      >
        <Compass className="w-4 h-4 flex-shrink-0 transition-colors group-hover:text-terracotta" />
        <span className="text-[12px] font-semibold leading-none">Replay tour</span>
      </button>
      <button
        onClick={onSignOut}
        disabled={loggingOut}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-charcoal-500 hover:text-rose-600 hover:bg-rose-50/70 transition-all duration-150 group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loggingOut
          ? <Loader2 className="w-4 h-4 animate-spin flex-shrink-0 text-charcoal-400" />
          : <LogOut  className="w-4 h-4 flex-shrink-0 transition-colors group-hover:text-rose-500" />
        }
        <span className="text-[12px] font-semibold leading-none">
          {loggingOut ? 'Signing out…' : 'Sign out'}
        </span>
      </button>
    </div>
  )
}

/* ── Main ───────────────────────────────────────────────────────── */
export function VendorSidebar({ user, enquiryCount = 0, quotedRfpCount = 0, logoUrl }: Props) {
  const pathname    = usePathname()
  const [loggingOut, setLoggingOut] = useState(false)

  const isActive = (href: string) =>
    href === '/portal' ? pathname === '/portal' : pathname.startsWith(href)

  const navItems: NavItem[] = [
    { label: 'Dashboard',     href: '/portal',                icon: LayoutDashboard                                                       },
    { label: 'Products',      href: '/portal/products',       icon: Package,                                tourId: 'vendor.nav.products' },
    { label: 'Custom Design', href: '/portal/custom-request', icon: Wand2,                                  tourId: 'vendor.nav.customDesign' },
    { label: 'Enquiry',       href: '/portal/enquiry',        icon: ShoppingCart, badge: enquiryCount                                     },
    { label: 'RFP History',   href: '/portal/rfp/history',    icon: Clock,    badge: quotedRfpCount,        tourId: 'vendor.nav.rfp'      },
    { label: 'Profile',       href: '/portal/profile',        icon: User,                                   tourId: 'vendor.nav.profile'  },
  ]

  async function handleSignOut() {
    setLoggingOut(true)
    await signOut({ redirect: false })
    window.location.href = '/login'
  }

  return (
    <aside className="w-56 bg-white border border-[#E8E0D5] shadow-card flex flex-col self-start sticky top-4 ml-5 mr-3 mt-4 mb-4 rounded-xl overflow-hidden max-h-[calc(100vh-2rem)]">

      {/* ── Identity header — ALWAYS TOP ─────────────────────────── */}
      <IdentityHeader user={user} logoUrl={logoUrl} />

      {/* ── Nav ─────────────────────────────────────────────────── */}
      <nav className="px-2 py-3 overflow-y-auto">
        <p className="px-3 pb-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-charcoal-400 leading-none select-none">
          Navigation
        </p>
        <div className="space-y-0.5">
          {navItems.map(item => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>
      </nav>

      {/* ── Sign out — ALWAYS BOTTOM, always visible ─────────────── */}
      <SignOutFooter loggingOut={loggingOut} onSignOut={handleSignOut} />
    </aside>
  )
}
