import { Metadata }        from 'next'
import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { RfpListClient }    from './RfpListClient'
import { parsePermissions, canAccess, canEdit } from '@/lib/portal-permissions'

export const metadata: Metadata = { title: 'RFPs — Forestry Admin' }

export default async function RFPsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userRec   = await prisma.user.findUnique({ where: { id: session.user.id }, select: { permissions: true } })
  const userPerms = parsePermissions(userRec?.permissions)
  if (!canAccess(session.user.role, userPerms, 'rfps')) redirect('/admin')
  const readonly  = !canEdit(session.user.role, userPerms, 'rfps')

  const rfps = await prisma.rfp.findMany({
    include: {
      vendorProfile: { include: { user: { select: { name: true } } } },
      items: { select: { quantity: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Pre-compute status counts for filter tab badges
  const statusCounts: Record<string, number> = {}
  for (const rfp of rfps) {
    statusCounts[rfp.status] = (statusCounts[rfp.status] ?? 0) + 1
  }

  // Serialise dates for the client component
  const serialised = rfps.map(rfp => ({
    id:           rfp.id,
    rfpNumber:    rfp.rfpNumber,
    status:       rfp.status,
    projectName:  rfp.projectName ?? null,
    submittedAt:  rfp.submittedAt?.toISOString() ?? null,
    createdAt:    rfp.createdAt.toISOString(),
    items:        rfp.items,
    isArchived:   rfp.isArchived,
    vendorProfile: {
      companyName: rfp.vendorProfile.companyName,
      user:        { name: rfp.vendorProfile.user.name },
    },
  }))

  return <RfpListClient rfps={serialised} statusCounts={statusCounts} readonly={readonly} />
}
