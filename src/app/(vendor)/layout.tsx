'use client';

import { usePathname } from 'next/navigation';
import DashboardSidebar from '@/components/layout/DashboardSidebar';
import { useSession } from 'next-auth/react';
import { VendorNotificationBell } from '@/components/vendor/VendorNotificationBell'
import { useSiteLogo } from '@/hooks/useSiteLogo'

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const logoUrl = useSiteLogo()
  const isPortal = pathname.startsWith('/portal');
  const portalTitle = isPortal ? 'Vendor Portal' : 'Admin Portal';
  const userEmail = session?.user?.email || 'vendor@forestry.com';

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
            <span className="text-charcoal/50 text-sm ml-2">{portalTitle}</span>
          </div>
          <div className="flex items-center gap-4">
            <VendorNotificationBell />
            <div className="text-sm text-charcoal/60">{userEmail}</div>
          </div>
        </div>
      </header>

      {/* Portal routes handle their own sidebar+content layout */}
      <div className={isPortal ? 'flex flex-1 overflow-hidden' : 'flex flex-1 overflow-hidden'}>
        {!isPortal && <DashboardSidebar />}
        {isPortal ? (
          children
        ) : (
          <main className="flex-1 overflow-auto">
            <div className="px-8 py-8">{children}</div>
          </main>
        )}
      </div>
    </div>
  )
}
