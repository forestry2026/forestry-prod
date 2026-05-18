import { Metadata }        from 'next'
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { logoToDataUrl }    from '@/lib/logoUtils'
import RFPDetailClient      from '@/components/rfps/RFPDetailClient'

export const metadata: Metadata = {
  title: 'RFP Details - Forestry Admin',
}

export default async function RfpDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    redirect('/login')
  }

  const { id } = await params

  const [rfp, settingsRows] = await Promise.all([
    prisma.rfp.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            dimension: true,
            color:     true,
            texture:   true,
            finish:    true,
          },
        },
        vendorProfile: { include: { user: true } },
        quotes: { orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.siteSetting.findMany({
      where: { key: { in: ['logoUrl', 'company_name', 'company_trn', 'company_email', 'company_phone', 'company_address'] } },
    }),
  ])

  if (!rfp) notFound()

  // Map settings rows to a single lookup
  const settingsMap = Object.fromEntries(settingsRows.map(s => [s.key, s.value]))

  // Read both logos as base64 data URLs server-side (avoids client fetch/CORS issues)
  const [brandLogoDataUrl, vendorLogoDataUrl] = await Promise.all([
    logoToDataUrl(settingsMap['logoUrl']),
    logoToDataUrl(rfp.vendorProfile.logoUrl),
  ])

  const companyInfo = {
    name:    settingsMap['company_name']    ?? null,
    trn:     settingsMap['company_trn']     ?? null,
    email:   settingsMap['company_email']   ?? null,
    phone:   settingsMap['company_phone']   ?? null,
    address: settingsMap['company_address'] ?? null,
  }

  return (
    <RFPDetailClient
      rfp={rfp}
      brandLogoDataUrl={brandLogoDataUrl}
      vendorLogoDataUrl={vendorLogoDataUrl}
      companyInfo={companyInfo}
      currentUser={{
        id:   session.user.id,
        role: session.user.role,
        name: session.user.name ?? 'Admin',
      }}
    />
  )
}
