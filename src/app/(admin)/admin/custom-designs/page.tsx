import { Metadata }        from 'next'
import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { CustomDesignListClient } from './CustomDesignListClient'

export const metadata: Metadata = { title: 'Custom Designs — Forestry Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminCustomDesignsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const requests = await prisma.customDesignRequest.findMany({
    include: {
      vendorProfile: {
        select: {
          companyName: true,
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Status counts for tab badges
  const statusCounts: Record<string, number> = {}
  for (const r of requests) {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1
  }

  const serialised = requests.map(r => ({
    id:              r.id,
    title:           r.title,
    status:          r.status,
    quantity:        r.quantity,
    createdAt:       r.createdAt.toISOString(),
    referenceImages: JSON.parse(r.referenceImages || '[]') as { url: string }[],
    dimensions:      JSON.parse(r.dimensions      || '[]') as { label: string; value: string; unit: string }[],
    vendorProfile: {
      companyName: r.vendorProfile.companyName,
      user:        { name: r.vendorProfile.user.name },
    },
  }))

  return <CustomDesignListClient requests={serialised} statusCounts={statusCounts} />
}
