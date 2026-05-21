'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { ForestryLogo } from '@/components/ui/ForestryLogo'
import { useSiteLogo } from '@/hooks/useSiteLogo'


const navLinks = [
  { label: 'Products', href: '/#collection'   },
  { label: 'About',    href: '/#how-it-works' },
  { label: 'Contact',  href: '/#contact'      },
]

export function Navbar() {
  const [scrolled,    setScrolled]    = useState(false)
  const [menuOpen,    setMenuOpen]    = useState(false)
  const pathname = usePathname()
  const logoUrl  = useSiteLogo()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  return (
    <>
      <nav
        aria-label="Main navigation"
        className={[
          'fixed top-4 left-4 right-4 z-50 flex items-center justify-between px-6 py-3.5 rounded-2xl',
          'transition-all duration-300',
          scrolled
            ? 'bg-cream/95 backdrop-blur-xl border border-[#E8E0D5] shadow-card'
            : 'bg-cream/60 backdrop-blur-md border border-[#E8E0D5]/40',
        ].join(' ')}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group" aria-label="Forestry home">
          {logoUrl
            ? <img src={logoUrl} alt="Logo" className="h-8 max-w-[140px] object-contain" />
            : <>
                <ForestryLogo className="w-7 h-7 text-terracotta" />
                <span className="font-heading font-bold text-lg tracking-widest text-[#1C1C1C] group-hover:text-terracotta transition-colors duration-200">
                  FORESTRY
                </span>
              </>
          }
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8" role="list">
          {navLinks.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-sm font-medium text-charcoal hover:text-terracotta transition-colors duration-200 tracking-wide"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm font-semibold text-[#6B6B6B] hover:text-[#1C1C1C] transition-colors duration-200">
            Sign In
          </Link>
          <Link href="/request-access" className="btn-primary">
            Request Access
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-1 text-charcoal cursor-pointer"
          onClick={() => setMenuOpen(v => !v)}
          aria-label="Toggle menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-cream/97 backdrop-blur-xl flex flex-col items-center justify-center gap-8"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation"
        >
          <button
            className="absolute top-6 right-6 p-1 text-charcoal cursor-pointer"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            <X size={28} />
          </button>

          {navLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="font-heading text-3xl font-bold text-[#1C1C1C] hover:text-terracotta transition-colors duration-200"
              onClick={() => setMenuOpen(false)}
            >
              {l.label}
            </Link>
          ))}

          <Link
            href="/request-access"
            className="btn-primary btn-lg mt-4"
            onClick={() => setMenuOpen(false)}
          >
            Request Access
          </Link>

          <Link
            href="/login"
            className="text-sm text-[#6B6B6B] font-medium hover:text-terracotta transition-colors"
            onClick={() => setMenuOpen(false)}
          >
            Already a vendor? Sign in
          </Link>
        </div>
      )}
    </>
  )
}
