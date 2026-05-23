'use client'

import Link from 'next/link'
import { ForestryLogo } from '@/components/ui/ForestryLogo'
import { MapPin, Phone, Mail } from 'lucide-react'
import { useSiteLogo } from '@/hooks/useSiteLogo'

export function Footer({ initialLogoUrl = null }: { initialLogoUrl?: string | null } = {}) {
  const logoUrl = useSiteLogo(initialLogoUrl)

  return (
    <footer id="contact" className="bg-charcoal text-cream/70">
      <div className="section-container py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 pb-12 border-b border-white/10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="h-7 max-w-[120px] object-contain brightness-0 invert" />
                : <>
                    <ForestryLogo className="w-5 h-5 text-terracotta" />
                    <span className="font-heading font-bold text-base tracking-widest text-cream">FORESTRY</span>
                  </>
              }
            </div>
            <p className="text-sm leading-relaxed text-cream/50 max-w-xs">
              UAE's premier custom pot manufacturer. Crafting premium planters for commercial and residential projects since 2018.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-heading text-xs font-semibold uppercase tracking-widest text-cream mb-5">Quick Links</h3>
            <ul className="space-y-3 text-sm">
              {[
                { label: 'Product Collection', href: '/#products' },
                { label: 'How It Works',       href: '/#how-it-works' },
                { label: 'Request Access',     href: '/request-access' },
                { label: 'Vendor Login',       href: '/login' },
              ].map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-cream/55 hover:text-terracotta-light transition-colors duration-200"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-heading text-xs font-semibold uppercase tracking-widest text-cream mb-5">Contact</h3>
            <address className="not-italic space-y-3 text-sm text-cream/55">
              <div className="flex items-start gap-2.5">
                <MapPin size={14} className="text-terracotta mt-0.5 shrink-0" aria-hidden="true" />
                <span>Industrial Area 12, Sharjah, United Arab Emirates</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone size={14} className="text-terracotta shrink-0" aria-hidden="true" />
                <a href="tel:+97165000000" className="hover:text-terracotta-light transition-colors duration-200">
                  +971 6 500 0000
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={14} className="text-terracotta shrink-0" aria-hidden="true" />
                <a href="mailto:vendors@forestry.ae" className="hover:text-terracotta-light transition-colors duration-200">
                  vendors@forestry.ae
                </a>
              </div>
            </address>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-cream/35">
          <span>&copy; {new Date().getFullYear()} Forestry Manufacturing LLC. All rights reserved.</span>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-terracotta-light transition-colors duration-200">Privacy Policy</Link>
            <Link href="#" className="hover:text-terracotta-light transition-colors duration-200">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
