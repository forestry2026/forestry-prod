import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { VendorSidebar }    from '@/components/layout/VendorSidebar'
import { VendorOnboardingMount } from '@/components/onboarding/VendorOnboardingMount'

export default async function VendorLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/login')
  if (session.user.role === 'ADMIN' || session.user.role === 'MANAGER') redirect('/admin')

  // Badge counts for sidebar
  const vendorProfileId = session.user.vendorProfileId
  const [enquiryCount, quotedRfpCount, vendorProfile] = await Promise.all([
    prisma.enquiryItem.count({ where: { userId: session.user.id } }),
    vendorProfileId
      ? prisma.rfp.count({ where: { vendorProfileId, status: 'QUOTED' } })
      : Promise.resolve(0),
    vendorProfileId
      ? prisma.vendorProfile.findUnique({ where: { id: vendorProfileId }, select: { logoUrl: true, companyName: true } })
      : Promise.resolve(null),
  ])

  return (
    <VendorOnboardingMount userName={vendorProfile?.companyName ?? session.user.name}>
      <div className="flex flex-1 overflow-hidden">
        <VendorSidebar
          user={session.user}
          enquiryCount={enquiryCount}
          quotedRfpCount={quotedRfpCount}
          logoUrl={vendorProfile?.logoUrl ?? null}
        />
        <main className="flex-1 overflow-auto">
          <div className="px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </VendorOnboardingMount>
  )
}
