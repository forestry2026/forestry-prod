'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ClipboardCheck, Zap, Settings, Menu, X
} from 'lucide-react'
import { useState } from 'react'
import { useSiteLogo } from '@/hooks/useSiteLogo'

const NAV = [
  { label: 'Production Queue', href: '/production-queue', Icon: ClipboardCheck },
  { label: 'Quick Actions', href: '/production-queue', Icon: Zap },
  { label: 'Settings', href: '/settings', Icon: Settings },
]

interface Props {
  user: { name: string; email: string }
}

export function ManagerSidebar({ user }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const logoUrl  = useSiteLogo()

  const isActive = (href: string) => pathname.startsWith(href)

  const SidebarContent = () => (
    <div className="flex flex-col h-full p-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8 pt-2">
        {logoUrl
          ? <img src={logoUrl} alt="Logo" className="h-8 max-w-[140px] object-contain" />
          : <>
              <div className="w-6 h-6 bg-terracotta rounded flex items-center justify-center text-white text-xs font-bold">F</div>
              <span className="font-heading font-bold tracking-widest text-charcoal">FORESTRY</span>
            </>
        }
      </div>

      {/* User chip */}
      <div className="mb-6 p-3 rounded-xl bg-cream-dark border border-cream-darker">
        <p className="text-sm font-semibold text-charcoal truncate">{user.name}</p>
        <p className="text-xs text-charcoal/60 truncate">{user.email}</p>
      </div>

      <p className="text-[10px] font-semibold uppercase tracking-widest text-charcoal/50 mb-2">Menu</p>

      {/* Nav links */}
      <nav className="flex-1 space-y-0.5">
        {NAV.map(({ label, href, Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
              isActive(href)
                ? 'bg-terracotta text-white shadow-warm-sm'
                : 'text-charcoal hover:bg-cream-dark'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed top-4 left-4 lg:hidden z-40 p-2 rounded-lg hover:bg-cream-dark"
      >
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/20 lg:hidden z-30"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-0 w-64 h-screen bg-cream border-r border-cream-darker overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-0 w-64 h-screen bg-cream border-r border-cream-darker overflow-y-auto transform transition-transform lg:hidden z-40 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>
    </>
  )
}
