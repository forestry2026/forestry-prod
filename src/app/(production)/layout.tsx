'use client';

import { useState, useEffect } from 'react'
import DashboardSidebar from '@/components/layout/DashboardSidebar';

function useSiteLogo() {
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  useEffect(() => {
    fetch('/api/admin/settings/brand')
      .then(r => r.json())
      .then(d => { if (d.logoUrl) setLogoUrl(d.logoUrl + '?t=' + Date.now()) })
      .catch(() => {})
    const handler = (e: Event) => {
      const url = (e as CustomEvent).detail?.logoUrl
      setLogoUrl(url ? url + '?t=' + Date.now() : null)
    }
    window.addEventListener('logo-updated', handler)
    return () => window.removeEventListener('logo-updated', handler)
  }, [])
  return logoUrl
}

export default function ProductionLayout({ children }: { children: React.ReactNode }) {
  const logoUrl = useSiteLogo()

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-cream-darker shadow-card sticky top-0 z-50">
        <div className="flex items-center justify-between px-6 py-3.5">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Brand logo" className="h-9 max-w-[160px] object-contain" />
            ) : (
              <>
                <div className="w-8 h-8 bg-terracotta rounded flex items-center justify-center text-white font-bold flex-shrink-0">F</div>
                <span className="font-heading font-bold text-charcoal text-lg">FORESTRY</span>
              </>
            )}
            <span className="text-charcoal/50 text-sm ml-2">Admin Portal</span>
          </div>
          <div className="text-sm text-charcoal/60">production@forestry.com</div>
        </div>
      </header>

      {/* Main Content with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 overflow-auto">
          <div className="px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
